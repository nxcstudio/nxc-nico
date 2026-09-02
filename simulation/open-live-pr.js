import { execSync } from 'node:child_process';
const creds = execSync('git credential fill', { input: 'protocol=https\nhost=github.com\n\n', encoding: 'utf-8' });
const token = creds.match(/password=(.+)/)[1].trim();

async function openPR() {
  const headers = {
    'Authorization': 'Bearer ' + token,
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'NXC-Setup',
    'Content-Type': 'application/json'
  };

  const res = await fetch('https://api.github.com/repos/nxcstudio/nxc-nico/pulls', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title: '?? [NICO GitOps] Live Agent Handshake & Cluster Verification',
      head: 'nico/agent-handshake',
      base: 'main',
      body: 'Autonomous Pull Request created by NXC-NICO on nxcstudio org to verify live Git daemon operations.'
    })
  });

  const data = await res.json();
  if (res.ok) {
    console.log('LIVE PR CREATED:', data.html_url);
  } else {
    console.log('PR Status:', res.status, data.message);
  }
}
openPR();
