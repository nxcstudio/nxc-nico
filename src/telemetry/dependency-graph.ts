export interface ServiceDependency {
  repoName: string;
  consumedApis: string[];
  downstreamServices: string[];
}

export class CrossRepoDependencyGraph {
  private registry = new Map<string, ServiceDependency>();

  constructor() {
    // Seed default microservice dependencies
    this.registerDependency({
      repoName: 'nxc-auth-service',
      consumedApis: ['nxc-db-cluster'],
      downstreamServices: ['nxc-billing-gateway', 'nxc-api-gateway', 'nxc-user-portal'],
    });

    this.registerDependency({
      repoName: 'nxc-billing-gateway',
      consumedApis: ['nxc-auth-service', 'stripe-webhook-relay'],
      downstreamServices: ['nxc-analytics-worker'],
    });
  }

  registerDependency(dep: ServiceDependency) {
    this.registry.set(dep.repoName, dep);
  }

  getDownstreamServices(repoName: string): string[] {
    return this.registry.get(repoName)?.downstreamServices || [];
  }

  getAllDependencies(): ServiceDependency[] {
    return Array.from(this.registry.values());
  }
}
