export type WorkloadClass = 'COMPUTE_HEAVY' | 'IO_BOUND' | 'PERSISTENT_DAEMON';

export type FreeTierProvider = 
  | 'OCI_ALWAYS_FREE'       // 4 ARM Ampere A1, 24GB RAM, 200GB storage
  | 'GCP_ALWAYS_FREE'       // 1 e2-micro VM, 30GB disk, Cloud Build (120 min/day)
  | 'GITHUB_ACTIONS_FREE'   // 2,000 runner minutes/mo
  | 'CLOUDFLARE_FREE'       // 100k requests/day edge workers
  | 'LOCAL_HYBRID_FALLBACK';// Local engine (dockerode / host system)

export interface QuotaState {
  provider: FreeTierProvider;
  monthlyLimitMinutes?: number;
  usedMinutes?: number;
  dailyRequestsLimit?: number;
  usedRequests?: number;
  availableRamGb: number;
  availableCpuCores: number;
  healthy: boolean;
}

export interface TaskWorkloadDescriptor {
  taskId: string;
  name: string;
  class: WorkloadClass;
  estimatedDurationSeconds: number;
  requiredRamMb: number;
  requiresDocker: boolean;
}

export interface RoutingDecision {
  provider: FreeTierProvider;
  reason: string;
  costPerHour: number; // Always $0.00
  failoverChain: FreeTierProvider[];
}

export class ZeroCostInfrastructureRouter {
  private quotaRegistry: Map<FreeTierProvider, QuotaState> = new Map();

  constructor() {
    this.initQuotaRegistry();
  }

  private initQuotaRegistry() {
    this.quotaRegistry.set('OCI_ALWAYS_FREE', {
      provider: 'OCI_ALWAYS_FREE',
      availableRamGb: 24,
      availableCpuCores: 4,
      healthy: true,
    });

    this.quotaRegistry.set('GCP_ALWAYS_FREE', {
      provider: 'GCP_ALWAYS_FREE',
      monthlyLimitMinutes: 3600, // 120 mins/day * 30
      usedMinutes: 240,
      availableRamGb: 1,
      availableCpuCores: 2,
      healthy: true,
    });

    this.quotaRegistry.set('GITHUB_ACTIONS_FREE', {
      provider: 'GITHUB_ACTIONS_FREE',
      monthlyLimitMinutes: 2000,
      usedMinutes: 320,
      availableRamGb: 7,
      availableCpuCores: 2,
      healthy: true,
    });

    this.quotaRegistry.set('CLOUDFLARE_FREE', {
      provider: 'CLOUDFLARE_FREE',
      dailyRequestsLimit: 100000,
      usedRequests: 1420,
      availableRamGb: 0.128,
      availableCpuCores: 1,
      healthy: true,
    });

    this.quotaRegistry.set('LOCAL_HYBRID_FALLBACK', {
      provider: 'LOCAL_HYBRID_FALLBACK',
      availableRamGb: 16,
      availableCpuCores: 8,
      healthy: true,
    });
  }

  /**
   * Evaluates task weight and selects optimal zero-cost provider ($0.00/mo)
   */
  selectOptimalProvider(task: TaskWorkloadDescriptor): RoutingDecision {
    const oci = this.quotaRegistry.get('OCI_ALWAYS_FREE')!;
    const gcp = this.quotaRegistry.get('GCP_ALWAYS_FREE')!;
    const gha = this.quotaRegistry.get('GITHUB_ACTIONS_FREE')!;
    const cf = this.quotaRegistry.get('CLOUDFLARE_FREE')!;

    // 1. High-Speed Webhook Ingestion & Edge HMAC validation
    if (task.class === 'IO_BOUND') {
      if (cf.healthy && (cf.usedRequests || 0) < (cf.dailyRequestsLimit || 100000)) {
        return {
          provider: 'CLOUDFLARE_FREE',
          reason: 'I/O-Bound edge webhook ingestion routed to Cloudflare Workers (100k free req/day).',
          costPerHour: 0.0,
          failoverChain: ['GCP_ALWAYS_FREE', 'LOCAL_HYBRID_FALLBACK'],
        };
      }
      return {
        provider: 'GCP_ALWAYS_FREE',
        reason: 'Cloudflare threshold reached. Fallback to GCP Always Free e2-micro instance.',
        costPerHour: 0.0,
        failoverChain: ['LOCAL_HYBRID_FALLBACK'],
      };
    }

    // 2. Persistent 24/7 Daemons and Webhook Listener API Server
    if (task.class === 'PERSISTENT_DAEMON') {
      if (gcp.healthy) {
        return {
          provider: 'GCP_ALWAYS_FREE',
          reason: 'Persistent daemon anchored to GCP Always Free e2-micro VM (24/7 zero-cost).',
          costPerHour: 0.0,
          failoverChain: ['OCI_ALWAYS_FREE', 'LOCAL_HYBRID_FALLBACK'],
        };
      }
      return {
        provider: 'OCI_ALWAYS_FREE',
        reason: 'GCP node unavailable. Migrating persistent daemon to OCI Always Free ARM node.',
        costPerHour: 0.0,
        failoverChain: ['LOCAL_HYBRID_FALLBACK'],
      };
    }

    // 3. Compute-Heavy Sandboxed Test Execution, DinD, and Code Patches
    if (task.class === 'COMPUTE_HEAVY') {
      // Prioritize GitHub Actions for isolated DinD ephemeral runs if quota available
      const ghaRemaining = (gha.monthlyLimitMinutes || 2000) - (gha.usedMinutes || 0);
      const estMinutes = Math.ceil(task.estimatedDurationSeconds / 60);

      if (gha.healthy && ghaRemaining > estMinutes) {
        return {
          provider: 'GITHUB_ACTIONS_FREE',
          reason: `Compute-Heavy sandbox routed to GitHub Actions ephemeral runner (${ghaRemaining} min free quota remaining).`,
          costPerHour: 0.0,
          failoverChain: ['OCI_ALWAYS_FREE', 'LOCAL_HYBRID_FALLBACK'],
        };
      }

      // If GitHub Actions quota consumed, route to OCI ARM Ampere A1 (24GB RAM)
      if (oci.healthy) {
        return {
          provider: 'OCI_ALWAYS_FREE',
          reason: 'Sandboxed DinD execution offloaded to OCI Always Free 4-Core ARM Ampere A1 (24GB RAM).',
          costPerHour: 0.0,
          failoverChain: ['LOCAL_HYBRID_FALLBACK'],
        };
      }

      // Default fallback
      return {
        provider: 'LOCAL_HYBRID_FALLBACK',
        reason: 'All cloud quotas exhausted. Executing in local isolated Docker runtime.',
        costPerHour: 0.0,
        failoverChain: [],
      };
    }

    return {
      provider: 'LOCAL_HYBRID_FALLBACK',
      reason: 'Standard fallback execution.',
      costPerHour: 0.0,
      failoverChain: [],
    };
  }

  recordUsage(provider: FreeTierProvider, minutes: number = 0, requests: number = 0) {
    const state = this.quotaRegistry.get(provider);
    if (state) {
      if (state.usedMinutes !== undefined) state.usedMinutes += minutes;
      if (state.usedRequests !== undefined) state.usedRequests += requests;
    }
  }

  getQuotaStatus() {
    return Array.from(this.quotaRegistry.values());
  }
}
