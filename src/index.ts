import { createServer } from './api/server.js';
import { getConfig } from './config/index.js';

async function bootstrap() {
  const config = getConfig();
  const server = createServer();

  try {
    const address = await server.listen({
      port: config.PORT,
      host: config.HOST,
    });

    console.log(`
==================================================================
  🤖 NXC-NICO (Node Infrastructure & Cluster Orchestrator)
==================================================================
  Autonomous DevOps Engineer initialized successfully.
  Mode:       ${config.NODE_ENV}
  Endpoint:   ${address}
  LLM Engine: ${config.LLM_PROVIDER} (${config.LLM_MODEL})
  Mail Hub:   ${config.MAIL_PROVIDER} (Sender: ${config.MAIL_FROM})
  Health:     ${address}/health

  Active Listeners:
    POST /webhooks/sentry
    POST /webhooks/inbound-email
    POST /webhooks/argocd-sync
    POST /webhooks/schema-migration
==================================================================
    `);
  } catch (err) {
    console.error('Failed to start NXC-NICO daemon:', err);
    process.exit(1);
  }
}

bootstrap();
