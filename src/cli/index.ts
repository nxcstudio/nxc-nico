import { Command } from 'commander';
import { AutopilotDoctor } from '../core/doctor.js';
import { AgentKnowledgeStore } from '../core/ak-store.js';
import { WardenGuardrails } from '../core/warden.js';
import path from 'node:path';
import os from 'node:os';

const program = new Command();

program
  .name('nico')
  .description('NXC-NICO - Autonomous 24/7 DevOps Engine (Stakpak-aligned)')
  .version('1.1.0');

// 1. nico up / nico down lifecycle commands
program
  .command('up')
  .description('Alias for nico autopilot up - Start NICO autonomous daemon 24/7')
  .action(async () => {
    console.log('Running preflight health probes before boot...');
    const doctor = new AutopilotDoctor();
    const probes = await doctor.runAllProbes();
    for (const p of probes) {
      console.log(`[${p.passed ? '✓' : '!'}] ${p.name}: ${p.message}`);
    }
    console.log('\n🚀 Starting NICO Autopilot Engine on http://127.0.0.1:3100...');
    import('../index.js');
  });

// 2. nico autopilot subcommands
const autopilot = program.command('autopilot').description('Manage 24/7 autonomous runtime');

autopilot
  .command('doctor')
  .description('Run deployment-readiness preflight report')
  .action(async () => {
    console.log('=== 🩺 NICO Autopilot Doctor ===');
    const doctor = new AutopilotDoctor();
    const probes = await doctor.runAllProbes();
    for (const p of probes) {
      console.log(`[${p.passed ? 'PASS' : 'WARN'}] ${p.name}: ${p.message}`);
      if (!p.passed && p.fixHint) console.log(`  💡 Fix hint: ${p.fixHint}`);
    }
  });

autopilot
  .command('status')
  .description('Check active daemon and task execution status')
  .action(async () => {
    try {
      const res = await fetch('http://127.0.0.1:3100/health');
      const data = await res.json();
      console.log('NICO Runtime Status:', data);
    } catch {
      console.log('NICO daemon is currently inactive.');
    }
  });

// 3. nico ak (Agent Knowledge) commands
const ak = program.command('ak').description('Manage persistent agent knowledge store');

ak
  .command('search <query>')
  .description('Search local knowledge entries')
  .action(async (query: string) => {
    const store = new AgentKnowledgeStore(path.join(os.homedir(), '.nico', 'ak'));
    const results = await store.search(query);
    console.log(`Found ${results.length} knowledge entries for "${query}":`);
    for (const r of results) {
      console.log(`- ${r.path} (${r.title})`);
    }
  });

program.parse(process.argv);
