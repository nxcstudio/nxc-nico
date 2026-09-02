import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const ConfigSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  // LLM Config
  LLM_PROVIDER: z.enum(['gemini', 'openai', 'anthropic', 'mock']).default('mock'),
  GEMINI_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  LLM_MODEL: z.string().default('gemini-1.5-pro'),

  // Sandbox DinD
  DOCKER_HOST: z.string().optional(),
  SANDBOX_TIMEOUT_MS: z.coerce.number().default(120000),
  SANDBOX_CONTAINER_IMAGE: z.string().default('node:20-alpine'),

  // GitHub App
  GITHUB_APP_ID: z.string().optional(),
  GITHUB_APP_PRIVATE_KEY_PATH: z.string().optional(),
  GITHUB_APP_INSTALLATION_ID: z.string().optional(),
  GITHUB_WEBHOOK_SECRET: z.string().optional(),

  // Telemetry (Sentry & PostHog)
  SENTRY_DSN: z.string().optional(),
  SENTRY_WEBHOOK_SECRET: z.string().optional(),
  POSTHOG_API_KEY: z.string().optional(),
  POSTHOG_HOST: z.string().default('https://app.posthog.com'),

  // Mail
  MAIL_PROVIDER: z.enum(['resend', 'sendgrid', 'smtp', 'console']).default('console'),
  MAIL_FROM: z.string().default('nico@nxc.internal'),
  MAIL_TO_DEFAULT: z.string().default('devops-alerts@nxc.internal'),
  RESEND_API_KEY: z.string().optional(),
  SENDGRID_API_KEY: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  INBOUND_MAIL_WEBHOOK_SECRET: z.string().optional(),

  // GitOps / ArgoCD
  ARGOCD_SERVER: z.string().default('argocd.internal.nxc.systems'),
  ARGOCD_AUTH_TOKEN: z.string().optional(),
});

export type AppConfig = z.infer<typeof ConfigSchema>;

let cachedConfig: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (!cachedConfig) {
    const parsed = ConfigSchema.safeParse(process.env);
    if (!parsed.success) {
      console.warn('Configuration validation warnings:', parsed.error.format());
      // Fallback with defaults
      cachedConfig = ConfigSchema.parse({});
    } else {
      cachedConfig = parsed.data;
    }
  }
  return cachedConfig;
}
