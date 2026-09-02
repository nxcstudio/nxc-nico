import nodemailer from 'nodemailer';
import { getConfig } from '../config/index.js';
import { OutboundEmailRequest } from '../types/index.js';

export class EmailDispatcher {
  private transporter: nodemailer.Transporter | null = null;
  private provider: string;

  constructor() {
    const config = getConfig();
    this.provider = config.MAIL_PROVIDER;

    if (this.provider === 'smtp' && config.SMTP_HOST) {
      this.transporter = nodemailer.createTransport({
        host: config.SMTP_HOST,
        port: config.SMTP_PORT,
        secure: config.SMTP_PORT === 465,
        auth: {
          user: config.SMTP_USER,
          pass: config.SMTP_PASS,
        },
      });
    }
  }

  async sendEmail(request: OutboundEmailRequest): Promise<{ success: boolean; messageId: string }> {
    const config = getConfig();
    const fromAddress = config.MAIL_FROM;
    const recipient = request.to || config.MAIL_TO_DEFAULT;

    console.log(`[MailDispatcher] Sending '${request.subject}' via [${this.provider}] to:`, recipient);

    // Resend API Integration
    if (this.provider === 'resend' && config.RESEND_API_KEY) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: fromAddress,
          to: Array.isArray(recipient) ? recipient : [recipient],
          subject: request.subject,
          html: request.html,
          text: request.text,
          headers: request.headers,
        }),
      });
      const data = (await res.json()) as any;
      return { success: res.ok, messageId: data.id || `msg_${Date.now()}` };
    }

    // SMTP Transporter
    if (this.transporter) {
      const info = await this.transporter.sendMail({
        from: fromAddress,
        to: recipient,
        subject: request.subject,
        html: request.html,
        text: request.text,
        headers: request.headers,
        inReplyTo: request.inReplyTo,
        references: request.references,
      });
      return { success: true, messageId: info.messageId };
    }

    // Default Console / Simulation Mode
    const simulatedId = `sim_msg_${Date.now()}`;
    console.log(`--------------------------------------------------------------------------------`);
    console.log(`📬 [DISPATCHED EMAIL PREVIEW]`);
    console.log(`From:    ${fromAddress}`);
    console.log(`To:      ${JSON.stringify(recipient)}`);
    console.log(`Subject: ${request.subject}`);
    console.log(`Text Preview:\n${request.text?.slice(0, 300)}...`);
    console.log(`--------------------------------------------------------------------------------`);

    return { success: true, messageId: simulatedId };
  }
}
