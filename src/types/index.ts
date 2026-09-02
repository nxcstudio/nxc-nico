export interface SentryExceptionFrame {
  filename: string;
  function: string;
  lineno: number;
  colno?: number;
  in_app?: boolean;
  context_line?: string;
  pre_context?: string[];
  post_context?: string[];
}

export interface SentryEventPayload {
  id: string;
  project: string;
  project_name: string;
  project_slug: string;
  message: string;
  level: 'fatal' | 'error' | 'warning' | 'info';
  culprit?: string;
  platform?: string;
  environment?: string;
  event: {
    event_id: string;
    level: string;
    title: string;
    exception?: {
      values: Array<{
        type: string;
        value: string;
        module?: string;
        stacktrace?: {
          frames: SentryExceptionFrame[];
        };
      }>;
    };
    tags?: Array<[string, string]>;
    extra?: Record<string, unknown>;
  };
}

export interface TriageAnalysis {
  repository: string;
  affectedFile: string;
  line: number;
  errorType: string;
  rootCause: string;
  confidenceScore: number;
  proposedFixDescription: string;
  patchDiff?: string;
}

export interface SandboxExecutionRequest {
  id: string;
  repoUrl: string;
  repoName: string;
  branch: string;
  commitSha?: string;
  patchDiff?: string;
  testCommand?: string;
  buildCommand?: string;
}

export interface SandboxExecutionResult {
  id: string;
  success: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
  verificationReport: string;
}

export interface PullRequestDetails {
  repoOwner: string;
  repoName: string;
  baseBranch: string;
  headBranch: string;
  title: string;
  body: string;
  prNumber?: number;
  prUrl?: string;
  isDraft?: boolean;
}

export interface PostHogEntityEvent {
  distinctId: string; // E.g., "repo:nxc-auth-service" or "svc:payment-worker"
  event: string;
  properties: {
    serviceName: string;
    repoName: string;
    environment: string;
    schemaVersion?: string;
    commitSha?: string;
    dependentServices?: string[];
    [key: string]: unknown;
  };
}

export interface OutboundEmailRequest {
  to: string | string[];
  subject: string;
  text?: string;
  html: string;
  inReplyTo?: string;
  references?: string[];
  headers?: Record<string, string>;
  metadata?: {
    workflowId?: string;
    incidentId?: string;
    repoName?: string;
    prNumber?: number;
  };
}

export interface InboundEmailPayload {
  from: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
  headers?: Record<string, string>;
  messageId?: string;
  inReplyTo?: string;
}

export type HumanCommandType = 'APPROVE_MERGE' | 'REQUEST_CHANGES' | 'TRIGGER_ROLLBACK' | 'STATUS_CHECK' | 'UNKNOWN';

export interface ParsedHumanCommand {
  type: HumanCommandType;
  rawText: string;
  incidentId?: string;
  prNumber?: number;
  repoName?: string;
  instructions?: string;
}

export interface GitOpsSyncEvent {
  appName: string;
  cluster: string;
  namespace: string;
  syncStatus: 'Synced' | 'OutOfSync' | 'SyncFailed';
  healthStatus: 'Healthy' | 'Progressing' | 'Degraded' | 'Missing';
  revision: string;
  imageTag: string;
  rolloutStrategy: {
    type: 'RollingUpdate';
    maxSurge: number | string;
    maxUnavailable: number | string;
  };
}
