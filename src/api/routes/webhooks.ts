import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { SentryListener } from '../../telemetry/sentry-listener.js';
import { InboundEmailGateway } from '../../mail/inbound-webhook.js';
import { SelfHealingWorkflow } from '../../orchestrator/self-healing-workflow.js';
import { GitOpsMonitorWorkflow } from '../../orchestrator/gitops-monitor-workflow.js';
import { PostHogTelemetryBus } from '../../telemetry/posthog-bus.js';

export function registerWebhookRoutes(
  server: FastifyInstance,
  options: {
    selfHealing: SelfHealingWorkflow;
    gitOpsMonitor: GitOpsMonitorWorkflow;
    telemetryBus: PostHogTelemetryBus;
  }
) {
  const sentryListener = new SentryListener();
  const inboundGateway = new InboundEmailGateway();

  // 1. Sentry Crash Webhook
  server.post('/webhooks/sentry', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const payload = sentryListener.parseWebhookPayload(request.body);
      console.log(`[Webhook] Ingested Sentry alert for project: ${payload.project}`);

      // Trigger Workflow A asynchronously
      options.selfHealing.handleSentryIncident(payload).catch(err => {
        console.error('[Workflow A] Unhandled error during execution:', err);
      });

      return reply.status(202).send({ status: 'accepted', incidentId: payload.id });
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  // 2. Inbound Email Reply Webhook (SendGrid / Resend)
  server.post('/webhooks/inbound-email', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { payload, command } = inboundGateway.processInboundEmail(request.body);

      if (command.type === 'APPROVE_MERGE' && command.prNumber) {
        console.log(`[InboundEmail] Human approved PR #${command.prNumber}. Initiating merge...`);
        await options.selfHealing.handleHumanApproval(command.prNumber, command.repoName || 'nxc-auth-service');
        return reply.status(200).send({ status: 'merged', prNumber: command.prNumber });
      }

      if (command.type === 'REQUEST_CHANGES') {
        console.log(`[InboundEmail] Changes requested for PR #${command.prNumber}: "${command.instructions}"`);
        return reply.status(200).send({ status: 'changes_recorded', instructions: command.instructions });
      }

      return reply.status(200).send({ status: 'received', commandType: command.type });
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  // 3. ArgoCD GitOps Sync Webhook
  server.post('/webhooks/argocd-sync', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = request.body as any;
      const syncEvent = {
        appName: body.appName || 'nxc-auth-service',
        cluster: body.cluster || 'prod-us-east-1-eks',
        namespace: body.namespace || 'production',
        syncStatus: body.syncStatus || 'Synced',
        healthStatus: body.healthStatus || 'Healthy',
        revision: body.revision || 'main@sha256:7f3a9e',
        imageTag: body.imageTag || 'v1.4.2',
        rolloutStrategy: {
          type: 'RollingUpdate' as const,
          maxSurge: '25%',
          maxUnavailable: 0,
        },
      };

      await options.gitOpsMonitor.handleGitOpsSync(syncEvent);
      return reply.status(200).send({ status: 'processed' });
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  // 4. Cross-Repo Schema Migration Event Webhook
  server.post('/webhooks/schema-migration', async (request: FastifyRequest, reply: FastifyReply) => {
    const { repoName, schemaVersion, summary } = request.body as any;
    const affectedDownstreams = await options.telemetryBus.recordSchemaChange(repoName, schemaVersion, summary);
    return reply.status(200).send({ status: 'recorded', affectedDownstreams });
  });
}
