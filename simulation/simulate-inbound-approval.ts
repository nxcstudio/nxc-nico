import { InboundEmailGateway } from '../src/mail/inbound-webhook.js';
import { SelfHealingWorkflow } from '../src/orchestrator/self-healing-workflow.js';

async function runApprovalSimulation() {
  console.log('================================================================');
  console.log('  SIMULATION: Human Inbound Email Approval & PR Merge');
  console.log('================================================================');

  const gateway = new InboundEmailGateway();
  const workflow = new SelfHealingWorkflow();

  // Synthetic inbound email reply payload received via SendGrid/Resend webhook
  const mockIncomingEmail = {
    sender: 'alex.devops-lead@nxc.internal',
    recipient: 'nico@nxc.internal',
    subject: 'Re: 🚨 [NICO Autopilot] Patched & Verified: TypeError in nxc-auth-service (PR #12)',
    text: 'approve\n\nLooks great NICO, thanks for catching and fixing that null pointer so quickly.',
    messageId: 'msg_reply_9988776655',
    'in-reply-to': 'sim_msg_original_123',
  };

  console.log(`[InboundSimulation] Ingesting reply from: ${mockIncomingEmail.sender}`);
  console.log(`[InboundSimulation] Subject: ${mockIncomingEmail.subject}`);
  console.log(`[InboundSimulation] Email Body: "${mockIncomingEmail.text}"\n`);

  const { payload, command } = gateway.processInboundEmail(mockIncomingEmail);

  console.log(`[InboundSimulation] Interpreted Command: ${command.type}`);
  console.log(`[InboundSimulation] Target PR: #${command.prNumber}`);

  if (command.type === 'APPROVE_MERGE' && command.prNumber) {
    const merged = await workflow.handleHumanApproval(command.prNumber, 'nxc-auth-service');
    console.log(`\n[InboundSimulation] Merge Result: ${merged ? 'SUCCESSFULLY MERGED' : 'FAILED'}`);
  }

  console.log('\n================================================================');
  console.log('  APPROVAL & AUTO-MERGE SIMULATION COMPLETED!');
  console.log('================================================================\n');
}

runApprovalSimulation().catch(console.error);
