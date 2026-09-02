import { SelfHealingWorkflow } from '../src/orchestrator/self-healing-workflow.js';
import { SentryEventPayload } from '../src/types/index.js';

async function runSimulation() {
  console.log('================================================================');
  console.log('  SIMULATION: Workflow A - Self-Healing Production Bug Fix');
  console.log('================================================================');

  const workflow = new SelfHealingWorkflow();

  // Synthetic Sentry crash payload for an unhandled exception in production
  const mockSentryPayload: SentryEventPayload = {
    id: `evt_sentry_${Date.now()}`,
    project: 'nxc-auth-service',
    project_name: 'NXC Authentication Service',
    project_slug: 'nxc-auth-service',
    message: "TypeError: Cannot read properties of undefined (reading 'split')",
    level: 'error',
    culprit: 'token-verifier.ts in verifyToken',
    platform: 'node',
    environment: 'production',
    event: {
      event_id: '8a9f3b2c1d0e4f5a6b7c8d9e0f1a2b3c',
      level: 'error',
      title: "TypeError: Cannot read properties of undefined (reading 'split')",
      exception: {
        values: [
          {
            type: 'TypeError',
            value: "Cannot read properties of undefined (reading 'split')",
            module: 'src.services.token-verifier',
            stacktrace: {
              frames: [
                {
                  filename: 'src/services/token-verifier.ts',
                  function: 'verifyToken',
                  lineno: 42,
                  context_line: "  const token = authHeader.split(' ')[1];",
                  pre_context: [
                    'export function verifyToken(authHeader?: string) {',
                    '  // Attempting to extract bearer token',
                  ],
                  post_context: [
                    '  return jwt.verify(token, process.env.JWT_SECRET);',
                    '}',
                  ],
                },
              ],
            },
          },
        ],
      },
      tags: [
        ['server_name', 'auth-service-pod-7d8b9f-xk2l9'],
        ['release', 'v1.3.9'],
        ['environment', 'production'],
      ],
    },
  };

  const outcome = await workflow.handleSentryIncident(mockSentryPayload);

  console.log('\n================================================================');
  console.log('  SIMULATION COMPLETED SUCCESSFULLY!');
  console.log(`  Incident:   ${outcome.incidentId}`);
  console.log(`  Target:     ${outcome.repoName}`);
  console.log(`  PR Status:  PR #${outcome.prNumber} opened at ${outcome.prUrl}`);
  console.log('================================================================\n');
}

runSimulation().catch(console.error);
