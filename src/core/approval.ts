export interface ProposedToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export type ToolApprovalAction = 'Approve' | 'Deny' | 'Ask';
export type ToolDecision = 'Accept' | 'Reject';

export interface ToolApprovalPolicy {
  defaultAction: ToolApprovalAction;
  rules: Array<{
    toolName: string;
    action: ToolApprovalAction;
    argumentPatterns?: Record<string, string>;
  }>;
}

export interface ResolvedToolCall {
  toolCall: ProposedToolCall;
  decision: ToolDecision;
}

export class ApprovalStateMachine {
  private entries: Array<{
    toolCall: ProposedToolCall;
    state: 'PendingUserDecision' | 'Ready' | 'Dispatched';
    decision?: ToolDecision;
  }>;
  private nextIndex: number = 0;

  constructor(toolCalls: ProposedToolCall[], policy: ToolApprovalPolicy) {
    this.entries = toolCalls.map(tc => {
      const rule = policy.rules.find(r => r.toolName === tc.name);
      const action = rule ? rule.action : policy.defaultAction;

      let state: 'PendingUserDecision' | 'Ready' = 'PendingUserDecision';
      let decision: ToolDecision | undefined;

      if (action === 'Approve') {
        state = 'Ready';
        decision = 'Accept';
      } else if (action === 'Deny') {
        state = 'Ready';
        decision = 'Reject';
      }

      return { toolCall: tc, state, decision };
    });
  }

  isWaitingForUser(): boolean {
    return this.entries.some(e => e.state === 'PendingUserDecision');
  }

  isComplete(): boolean {
    return this.nextIndex >= this.entries.length;
  }

  resolveTool(toolCallId: string, decision: ToolDecision) {
    const entry = this.entries.find(e => e.toolCall.id === toolCallId);
    if (!entry) throw new Error(`Unknown tool_call_id: ${toolCallId}`);
    entry.decision = decision;
    entry.state = 'Ready';
  }

  resolveAll(decision: ToolDecision) {
    for (const entry of this.entries) {
      if (entry.state === 'PendingUserDecision') {
        entry.decision = decision;
        entry.state = 'Ready';
      }
    }
  }

  nextReadyToDispatch(): ResolvedToolCall | null {
    if (this.nextIndex >= this.entries.length) return null;
    const entry = this.entries[this.nextIndex];
    if (entry.state === 'Ready' && entry.decision) {
      entry.state = 'Dispatched';
      this.nextIndex++;
      return { toolCall: entry.toolCall, decision: entry.decision };
    }
    return null;
  }
}
