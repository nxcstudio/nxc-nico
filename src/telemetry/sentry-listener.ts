import crypto from 'node:crypto';
import { SentryEventPayload } from '../types/index.js';
import { getConfig } from '../config/index.js';

export class SentryListener {
  verifySignature(rawBody: string, signatureHeader?: string): boolean {
    const config = getConfig();
    if (!config.SENTRY_WEBHOOK_SECRET) {
      // Allow unauthenticated in dev/test mode if secret not configured
      return true;
    }
    if (!signatureHeader) return false;

    const hmac = crypto.createHmac('sha256', config.SENTRY_WEBHOOK_SECRET);
    const digest = hmac.update(rawBody).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signatureHeader));
  }

  parseWebhookPayload(body: any): SentryEventPayload {
    // Normalizes webhook payload from Sentry format
    const event = body.data?.event || body.event || body;
    const project = body.data?.project || body.project || {};

    return {
      id: body.id || event.event_id || `evt_${Date.now()}`,
      project: project.slug || project.name || body.project_slug || 'nxc-unknown-service',
      project_name: project.name || body.project_name || 'NXC Service',
      project_slug: project.slug || body.project_slug || 'nxc-auth-service',
      message: event.message || event.title || 'Unhandled Production Exception',
      level: event.level || 'error',
      culprit: event.culprit,
      platform: event.platform,
      environment: event.environment || 'production',
      event: {
        event_id: event.event_id || `evt_${Date.now()}`,
        level: event.level || 'error',
        title: event.title || event.message || 'Error',
        exception: event.exception,
        tags: event.tags,
        extra: event.extra,
      },
    };
  }
}
