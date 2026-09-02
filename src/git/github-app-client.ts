import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';
import fs from 'node:fs';
import { getConfig } from '../config/index.js';

export class GitHubAppClient {
  private octokit: Octokit | null = null;

  getClient(): Octokit {
    if (this.octokit) return this.octokit;

    const config = getConfig();
    if (config.GITHUB_APP_ID && config.GITHUB_APP_PRIVATE_KEY_PATH && config.GITHUB_APP_INSTALLATION_ID) {
      const privateKey = fs.existsSync(config.GITHUB_APP_PRIVATE_KEY_PATH)
        ? fs.readFileSync(config.GITHUB_APP_PRIVATE_KEY_PATH, 'utf-8')
        : 'MOCK_KEY';

      this.octokit = new Octokit({
        authStrategy: createAppAuth,
        auth: {
          appId: config.GITHUB_APP_ID,
          privateKey,
          installationId: config.GITHUB_APP_INSTALLATION_ID,
        },
      });
    } else {
      // Unauthenticated / token fallback
      this.octokit = new Octokit();
    }
    return this.octokit;
  }
}
