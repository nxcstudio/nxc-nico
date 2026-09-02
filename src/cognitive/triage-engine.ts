import { SentryEventPayload, TriageAnalysis } from '../types/index.js';
import { CognitiveLLMClient } from './llm-client.js';

export class TriageEngine {
  private llm: CognitiveLLMClient;

  constructor() {
    this.llm = new CognitiveLLMClient();
  }

  async triageSentryAlert(payload: SentryEventPayload, repoContextSnippet?: string): Promise<TriageAnalysis> {
    const exception = payload.event.exception?.values?.[0];
    const frames = exception?.stacktrace?.frames || [];
    const topFrame = frames.length > 0 ? frames[frames.length - 1] : null;

    const errorDetails = {
      project: payload.project_name || payload.project_slug,
      message: payload.message || exception?.value,
      type: exception?.type,
      culprit: payload.culprit,
      file: topFrame?.filename,
      function: topFrame?.function,
      line: topFrame?.lineno,
      codeContext: topFrame?.context_line,
    };

    const schemaDescription = `{
      "repository": string (e.g. "nxc-auth-service"),
      "affectedFile": string (relative path in repo),
      "line": number,
      "errorType": string,
      "rootCause": string,
      "confidenceScore": number (0.0 to 1.0),
      "proposedFixDescription": string,
      "patchDiff": string (unified diff format)
    }`;

    const analysis = await this.llm.generateStructured<TriageAnalysis>(
      [
        {
          role: 'system',
          content: 'You are NICO, an autonomous containerized DevOps engineer. Analyze the production exception, determine the exact root cause, identify the offending repository and file, and propose an accurate patch diff.'
        },
        {
          role: 'user',
          content: `Production Exception Alert:\n${JSON.stringify(errorDetails, null, 2)}\n\nSurrounding Code Context:\n${repoContextSnippet || 'None provided'}`
        }
      ],
      schemaDescription
    );

    return analysis;
  }
}
