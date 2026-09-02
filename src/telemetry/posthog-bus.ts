import { PostHog } from 'posthog-node';
import { getConfig } from '../config/index.js';
import { PostHogEntityEvent } from '../types/index.js';
import { CrossRepoDependencyGraph } from './dependency-graph.js';

export class PostHogTelemetryBus {
  private client: PostHog | null = null;
  private dependencyGraph: CrossRepoDependencyGraph;

  constructor() {
    this.dependencyGraph = new CrossRepoDependencyGraph();
    const config = getConfig();

    if (config.POSTHOG_API_KEY) {
      this.client = new PostHog(config.POSTHOG_API_KEY, {
        host: config.POSTHOG_HOST,
        flushAt: 1,
        flushInterval: 0,
      });
    }
  }

  async trackEntityEvent(event: PostHogEntityEvent): Promise<void> {
    console.log(`[PostHogBus] Logging entity event for '${event.distinctId}': ${event.event}`);

    if (this.client) {
      this.client.capture({
        distinctId: event.distinctId,
        event: event.event,
        properties: {
          $current_url: `https://github.com/nxc-systems/${event.properties.repoName}`,
          ...event.properties,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  async recordSchemaChange(repoName: string, schemaVersion: string, changeSummary: string): Promise<string[]> {
    const distinctId = `repo:${repoName}`;
    const downstreams = this.dependencyGraph.getDownstreamServices(repoName);

    await this.trackEntityEvent({
      distinctId,
      event: 'schema_migration_deployed',
      properties: {
        serviceName: repoName,
        repoName,
        environment: 'production',
        schemaVersion,
        changeSummary,
        dependentServices: downstreams,
      },
    });

    console.log(`[PostHogBus] Schema shift in '${repoName}' flagged. Dependent services to verify: [${downstreams.join(', ')}]`);
    return downstreams;
  }

  async recordSelfHealingResolution(repoName: string, errorType: string, prNumber: number, durationMs: number) {
    await this.trackEntityEvent({
      distinctId: `repo:${repoName}`,
      event: 'self_healing_pr_opened',
      properties: {
        serviceName: repoName,
        repoName,
        environment: 'production',
        errorType,
        prNumber,
        resolutionTimeMs: durationMs,
      },
    });
  }

  async shutdown() {
    if (this.client) {
      await this.client.shutdown();
    }
  }
}
