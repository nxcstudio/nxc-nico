import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { getConfig } from '../config/index.js';

const execAsync = promisify(exec);

export interface EphemeralContainerConfig {
  image: string;
  name: string;
  workingDir: string;
  mounts?: Array<{ source: string; target: string; readonly?: boolean }>;
  env?: Record<string, string>;
  cmd?: string[];
}

export class DinDManager {
  private dockerHost?: string;

  constructor() {
    const config = getConfig();
    this.dockerHost = config.DOCKER_HOST;
  }

  private getDockerEnv(): NodeJS.ProcessEnv {
    const env = { ...process.env };
    if (this.dockerHost) {
      env.DOCKER_HOST = this.dockerHost;
    }
    return env;
  }

  async isDockerAvailable(): Promise<boolean> {
    try {
      await execAsync('docker info', { env: this.getDockerEnv(), timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async runEphemeralSandbox(
    config: EphemeralContainerConfig,
    command: string,
    timeoutMs: number = 120000
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    const mountArgs = (config.mounts || [])
      .map(m => `-v "${m.source}:${m.target}${m.readonly ? ':ro' : ''}"`)
      .join(' ');

    const envArgs = Object.entries(config.env || {})
      .map(([k, v]) => `-e ${k}="${v}"`)
      .join(' ');

    const dockerCmd = `docker run --rm ${mountArgs} ${envArgs} -w "${config.workingDir}" ${config.image} /bin/sh -c "${command.replace(/"/g, '\\"')}"`;

    try {
      const { stdout, stderr } = await execAsync(dockerCmd, {
        env: this.getDockerEnv(),
        timeout: timeoutMs,
        maxBuffer: 10 * 1024 * 1024,
      });
      return { stdout, stderr, exitCode: 0 };
    } catch (err: any) {
      return {
        stdout: err.stdout || '',
        stderr: err.stderr || err.message,
        exitCode: typeof err.code === 'number' ? err.code : 1,
      };
    }
  }
}
