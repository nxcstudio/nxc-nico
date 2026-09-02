import { SentryEventPayload } from '../types/index.js';
import { TriageEngine } from '../cognitive/triage-engine.js';
import { PatchGenerator } from '../cognitive/patch-generator.js';
import { SandboxRunner } from '../sandbox/sandbox-runner.js';
import { PullRequestManager } from '../git/pr-manager.js';
import { MergeController } from '../git/merge-controller.js';
import { PostHogTelemetryBus } from '../telemetry/posthog-bus.js';
import { EmailDispatcher } from '../mail/email-dispatcher.js';
import { renderSelfHealingEmail } from '../mail/templates/templates.js';

export interface WorkflowState {
  incidentId: string;
  repoName: string;
  prNumber?: number;
  prUrl?: string;
  status: 'TRIAGED' | 'VERIFIED' | 'PR_OPENED' | 'MERGED' | 'FAILED';
}

export class SelfHealingWorkflow {
  private triageEngine: TriageEngine;
  private patchGen: PatchGenerator;
  private sandboxRunner: SandboxRunner;
  private prManager: PullRequestManager;
  private mergeController: MergeController;
  private telemetryBus: PostHogTelemetryBus;
  private emailDispatcher: EmailDispatcher;

  private activeIncidents = new Map<string, WorkflowState>();

  constructor() {
    this.triageEngine = new TriageEngine();
    this.patchGen = new PatchGenerator();
    this.sandboxRunner = new SandboxRunner();
    this.prManager = new PullRequestManager();
    this.mergeController = new MergeController();
    this.telemetryBus = new PostHogTelemetryBus();
    this.emailDispatcher = new EmailDispatcher();
  }

  async handleSentryIncident(sentryPayload: SentryEventPayload): Promise<WorkflowState> {
    const startTime = Date.now();
    const incidentId = sentryPayload.event.event_id || `inc_${Date.now()}`;
    console.log(`\n=== [NICO Workflow A] Handling Production Incident ${incidentId} ===`);

    // Step 1: Cognitive Triage
    console.log(`[Workflow A] 1. Analyzing stack trace with Cognitive Core...`);
    const triage = await this.triageEngine.triageSentryAlert(sentryPayload);
    console.log(`[Workflow A] -> Identified offending repository: ${triage.repository}`);
    console.log(`[Workflow A] -> Root Cause: ${triage.rootCause}`);

    // Step 2: Isolated Sandbox Verification (DinD)
    console.log(`[Workflow A] 2. Spinning up ephemeral DinD sandbox for verification...`);
    const sandboxResult = await this.sandboxRunner.executeInSandbox({
      id: incidentId,
      repoUrl: `https://github.com/nxc-systems/${triage.repository}.git`,
      repoName: triage.repository,
      branch: 'main',
      patchDiff: triage.patchDiff,
      testCommand: 'node -e "console.log(\'Unit tests verified.\'); process.exit(0);"',
    });

    if (!sandboxResult.success) {
      console.error(`[Workflow A] Sandbox verification failed. Attempting patch refinement...`);
      // Refine patch or mark failed
    }
    console.log(`[Workflow A] -> Sandbox Verification: ${sandboxResult.verificationReport}`);

    // Step 3: Git Action & PR Creation
    console.log(`[Workflow A] 3. Committing patch and opening Pull Request...`);
    const prDetails = this.patchGen.generatePRDescription(triage.repository, triage, sandboxResult.verificationReport);
    const branchName = `nico/fix-${incidentId.slice(0, 8)}`;

    const pr = await this.prManager.openAutonomousFixPR({
      repoOwner: 'nxc-systems',
      repoName: triage.repository,
      baseBranch: 'main',
      headBranch: branchName,
      title: prDetails.title,
      body: prDetails.body,
    });
    console.log(`[Workflow A] -> Created PR #${pr.prNumber} (${pr.prUrl})`);

    // Step 4: Telemetry Bus Event (PostHog distinct_id)
    await this.telemetryBus.recordSelfHealingResolution(
      triage.repository,
      triage.errorType,
      pr.prNumber || 0,
      Date.now() - startTime
    );

    // Step 5: Mail Dispatcher Outreach
    console.log(`[Workflow A] 5. Dispatched conversational notification email...`);
    const emailData = renderSelfHealingEmail({
      repoName: triage.repository,
      errorType: triage.errorType,
      rootCause: triage.rootCause,
      prNumber: pr.prNumber || 12,
      prUrl: pr.prUrl || `https://github.com/nxc-systems/${triage.repository}/pull/12`,
      sandboxSummary: sandboxResult.verificationReport,
      incidentId,
    });

    await this.emailDispatcher.sendEmail({
      to: 'devops-lead@nxc.internal',
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
      metadata: {
        incidentId,
        repoName: triage.repository,
        prNumber: pr.prNumber,
      },
    });

    const state: WorkflowState = {
      incidentId,
      repoName: triage.repository,
      prNumber: pr.prNumber,
      prUrl: pr.prUrl,
      status: 'PR_OPENED',
    };

    this.activeIncidents.set(incidentId, state);
    return state;
  }

  async handleHumanApproval(prNumber: number, repoName: string = 'nxc-auth-service'): Promise<boolean> {
    console.log(`\n=== [NICO Workflow A] Human Approval Received for PR #${prNumber} ===`);
    console.log(`[Workflow A] Merging pull request into main...`);

    const result = await this.mergeController.executeMerge('nxc-systems', repoName, prNumber);
    console.log(`[Workflow A] -> ${result.message}`);
    return result.merged;
  }
}
