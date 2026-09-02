import { CognitiveLLMClient } from './llm-client.js';

export interface RefinedPatchResult {
  patchDiff: string;
  explanation: string;
  confidenceScore: number;
}

export class PatchGenerator {
  private llm: CognitiveLLMClient;

  constructor() {
    this.llm = new CognitiveLLMClient();
  }

  async refinePatchOnFailure(
    originalPatch: string,
    fileContent: string,
    sandboxTestOutput: string
  ): Promise<RefinedPatchResult> {
    const prompt = [
      {
        role: 'system' as const,
        content: 'You are NICO. The initial patch you generated failed unit tests inside the sandbox. Analyze the test failure output, inspect the original file, and generate a corrected unified diff that fixes the bug and satisfies all tests.'
      },
      {
        role: 'user' as const,
        content: `Original Patch:\n${originalPatch}\n\nFull File Content:\n${fileContent}\n\nSandbox Test Failure Output:\n${sandboxTestOutput}`
      }
    ];

    const schema = `{
      "patchDiff": string,
      "explanation": string,
      "confidenceScore": number
    }`;

    return await this.llm.generateStructured<RefinedPatchResult>(prompt, schema);
  }

  generatePRDescription(repoName: string, triage: {
    errorType: string;
    rootCause: string;
    proposedFixDescription: string;
  }, sandboxReport: string): { title: string; body: string } {
    const title = `fix(${repoName}): resolve ${triage.errorType.split(':')[0] || 'unhandled exception'}`;
    const body = `## 🤖 NICO Autonomous Self-Healing Fix

### 🚨 Root Cause
> ${triage.rootCause}

### 🛠️ Proposed Solution
${triage.proposedFixDescription}

### 🧪 Sandbox Verification Report
\`\`\`
${sandboxReport}
\`\`\`

---
*Generated autonomously by **NXC-NICO** (Node Infrastructure & Cluster Orchestrator).*
*Reply directly to the notification email to approve, request tweaks, or trigger a rollback.*
`;
    return { title, body };
  }
}
