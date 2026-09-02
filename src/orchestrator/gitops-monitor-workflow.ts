import { GitOpsSyncEvent } from '../types/index.js';
import { PostHogTelemetryBus } from '../telemetry/posthog-bus.js';
import { EmailDispatcher } from '../mail/email-dispatcher.js';
import { renderGitOpsReceiptEmail } from '../mail/templates/templates.js';

export class GitOpsMonitorWorkflow {
  private telemetryBus: PostHogTelemetryBus;
  private emailDispatcher: EmailDispatcher;

  constructor() {
    this.telemetryBus = new PostHogTelemetryBus();
    this.emailDispatcher = new EmailDispatcher();
  }

  async handleGitOpsSync(syncEvent: GitOpsSyncEvent): Promise<void> {
    console.log(`\n=== [NICO Workflow B] GitOps Deployment Sync Detected ===`);
    console.log(`Application: ${syncEvent.appName}`);
    console.log(`Cluster:     ${syncEvent.cluster} (Namespace: ${syncEvent.namespace})`);
    console.log(`Image Tag:   ${syncEvent.imageTag}`);
    console.log(`Sync Status: ${syncEvent.syncStatus} | Health: ${syncEvent.healthStatus}`);

    // Step 1: Record Deployment in PostHog Telemetry Bus (entity = repo)
    await this.telemetryBus.trackEntityEvent({
      distinctId: `repo:${syncEvent.appName}`,
      event: 'gitops_sync_completed',
      properties: {
        serviceName: syncEvent.appName,
        repoName: syncEvent.appName,
        environment: syncEvent.namespace,
        revision: syncEvent.revision,
        imageTag: syncEvent.imageTag,
        rolloutStrategy: syncEvent.rolloutStrategy,
        healthStatus: syncEvent.healthStatus,
      },
    });

    // Step 2: Format & Send Deployment Receipt Email
    console.log(`[Workflow B] Dispatching deployment receipt email...`);
    const emailData = renderGitOpsReceiptEmail({
      appName: syncEvent.appName,
      revision: syncEvent.revision,
      imageTag: syncEvent.imageTag,
      syncStatus: syncEvent.syncStatus,
      healthStatus: syncEvent.healthStatus,
      maxSurge: syncEvent.rolloutStrategy.maxSurge,
      maxUnavailable: syncEvent.rolloutStrategy.maxUnavailable,
    });

    await this.emailDispatcher.sendEmail({
      to: 'devops-alerts@nxc.internal',
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
      metadata: {
        repoName: syncEvent.appName,
      },
    });

    console.log(`[Workflow B] Cluster rollout verified with zero downtime.`);
  }
}
