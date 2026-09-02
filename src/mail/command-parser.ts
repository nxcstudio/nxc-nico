import { InboundEmailPayload, ParsedHumanCommand } from '../types/index.js';

export class HumanCommandParser {
  parse(payload: InboundEmailPayload): ParsedHumanCommand {
    const rawText = payload.text.trim();
    const subject = payload.subject;

    // Extract PR number from subject (e.g. "... (PR #12)")
    const prMatch = subject.match(/PR\s*#?([0-9]+)/i) || rawText.match(/PR\s*#?([0-9]+)/i);
    const prNumber = prMatch ? parseInt(prMatch[1], 10) : undefined;

    // Extract Incident ID if present (e.g. "Incident incident_1234")
    const incidentMatch = subject.match(/Incident\s*([a-zA-Z0-9_\-]+)/i) || rawText.match(/incident[:\s]+([a-zA-Z0-9_\-]+)/i);
    const incidentId = incidentMatch ? incidentMatch[1] : undefined;

    // Normalize command from first non-quoted line
    const firstLine = rawText.split('\n')[0].trim().toLowerCase();

    if (/^(approve|approved|lgtm|merge|ship it)/i.test(firstLine)) {
      return {
        type: 'APPROVE_MERGE',
        rawText,
        prNumber,
        incidentId,
      };
    }

    if (/^tweak[:\s]+(.*)/i.test(firstLine) || /^modify[:\s]+(.*)/i.test(firstLine)) {
      const match = firstLine.match(/^(?:tweak|modify)[:\s]+(.*)/i);
      return {
        type: 'REQUEST_CHANGES',
        rawText,
        prNumber,
        incidentId,
        instructions: match?.[1] || rawText,
      };
    }

    if (/^(rollback|revert|abort|cancel)/i.test(firstLine)) {
      return {
        type: 'TRIGGER_ROLLBACK',
        rawText,
        prNumber,
        incidentId,
      };
    }

    if (/^(status|check|health)/i.test(firstLine)) {
      return {
        type: 'STATUS_CHECK',
        rawText,
        prNumber,
        incidentId,
      };
    }

    return {
      type: 'UNKNOWN',
      rawText,
      prNumber,
      incidentId,
    };
  }
}
