import { InboundEmailPayload, ParsedHumanCommand } from '../types/index.js';
import { HumanCommandParser } from './command-parser.js';

export class InboundEmailGateway {
  private parser: HumanCommandParser;

  constructor() {
    this.parser = new HumanCommandParser();
  }

  normalizePayload(rawBody: any): InboundEmailPayload {
    // Normalizes between Sendgrid Inbound Parse and Resend Inbound webhook
    return {
      from: rawBody.from || rawBody.sender || 'unknown@nxc.internal',
      to: rawBody.to || rawBody.recipient || 'nico@nxc.internal',
      subject: rawBody.subject || '',
      text: rawBody.text || rawBody.plain || rawBody.body || '',
      html: rawBody.html,
      messageId: rawBody.messageId || rawBody.id,
      inReplyTo: rawBody.inReplyTo || rawBody['in-reply-to'],
    };
  }

  processInboundEmail(rawBody: any): { payload: InboundEmailPayload; command: ParsedHumanCommand } {
    const payload = this.normalizePayload(rawBody);
    const command = this.parser.parse(payload);
    console.log(`[InboundGateway] Received email from ${payload.from} with command type: ${command.type}`);
    return { payload, command };
  }
}
