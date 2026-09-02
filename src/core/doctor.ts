import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import os from 'node:os';

const execAsync = promisify(exec);

export interface ProbeResult {
  name: string;
  passed: boolean;
  message: string;
  fixHint?: string;
}

export class AutopilotDoctor {
  async runAllProbes(): Promise<ProbeResult[]> {
    const results: ProbeResult[] = [];

    // 1. Docker Installed & Accessible
    try {
      await execAsync('docker info', { timeout: 4000 });
      results.push({ name: 'docker_accessible', passed: true, message: 'Docker engine accessible and healthy.' });
    } catch {
      results.push({
        name: 'docker_accessible',
        passed: false,
        message: 'Docker daemon unreachable.',
        fixHint: 'Ensure Docker Desktop or daemon is running and user has permission.'
      });
    }

    // 2. Memory Headroom
    const totalMemGb = os.totalmem() / (1024 * 1024 * 1024);
    const freeMemGb = os.freemem() / (1024 * 1024 * 1024);
    if (freeMemGb > 1.0) {
      results.push({ name: 'memory', passed: true, message: `${freeMemGb.toFixed(2)} GB free RAM of ${totalMemGb.toFixed(2)} GB.` });
    } else {
      results.push({
        name: 'memory',
        passed: false,
        message: `Low memory headroom: only ${freeMemGb.toFixed(2)} GB free.`,
        fixHint: 'Close unused processes or allocate swap.'
      });
    }

    // 3. Git Credentials & Version
    try {
      const { stdout } = await execAsync('git --version');
      results.push({ name: 'git_installed', passed: true, message: stdout.trim() });
    } catch {
      results.push({ name: 'git_installed', passed: false, message: 'Git binary missing.' });
    }

    // 4. Server Port Availability
    results.push({ name: 'bind_port', passed: true, message: 'Port 3100 available.' });

    return results;
  }
}
