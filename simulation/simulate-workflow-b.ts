import { GitOpsMonitorWorkflow } from '../src/orchestrator/gitops-monitor-workflow.js';
import { GitOpsSyncEvent } from '../src/types/index.js';

async function runWorkflowBSimulation() {
  console.log('================================================================');
  console.log('  SIMULATION: Workflow B - Infrastructure & GitOps Rollout');
  console.log('================================================================');

  const gitopsWorkflow = new GitOpsMonitorWorkflow();

  // Synthetic ArgoCD sync completion event
  const mockSyncEvent: GitOpsSyncEvent = {
    appName: 'nxc-auth-service',
    cluster: 'arn:aws:eks:us-east-1:123456789012:cluster/nxc-production-eks',
    namespace: 'production',
    syncStatus: 'Synced',
    healthStatus: 'Healthy',
    revision: '9f4c3a1b8e2d4c6a8f0e2b4d6c8e0a2b4c6d8e0',
    imageTag: 'sha-9f4c3a1',
    rolloutStrategy: {
      type: 'RollingUpdate',
      maxSurge: 1,
      maxUnavailable: 0,
    },
  };

  console.log('[Workflow B Simulation] Dispatching ArgoCD cluster sync event...');
  await gitopsWorkflow.handleGitOpsSync(mockSyncEvent);

  console.log('\n================================================================');
  console.log('  WORKFLOW B SIMULATION COMPLETED!');
  console.log('================================================================\n');
}

runWorkflowBSimulation().catch(console.error);
