import Fastify, { FastifyInstance } from 'fastify';
import { getConfig } from '../config/index.js';
import { registerWebhookRoutes } from './routes/webhooks.js';
import { SelfHealingWorkflow } from '../orchestrator/self-healing-workflow.js';
import { GitOpsMonitorWorkflow } from '../orchestrator/gitops-monitor-workflow.js';
import { PostHogTelemetryBus } from '../telemetry/posthog-bus.js';

export function createServer(): FastifyInstance {
  const server = Fastify({
    logger: {
      level: getConfig().LOG_LEVEL,
    },
  });

  const selfHealing = new SelfHealingWorkflow();
  const gitOpsMonitor = new GitOpsMonitorWorkflow();
  const telemetryBus = new PostHogTelemetryBus();

  // Health check endpoint for Kubernetes probes
  server.get('/health', async () => {
    return {
      status: 'healthy',
      system: 'NXC-NICO',
      version: '1.0.0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  });

  // Register Webhook endpoints
  registerWebhookRoutes(server, {
    selfHealing,
    gitOpsMonitor,
    telemetryBus,
  });

  return server;
}
