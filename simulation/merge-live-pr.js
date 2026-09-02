import { execSync } from 'node:child_process';
const creds = execSync('git credential fill', { input: 'protocol=https\nhost=github.com\n\n', encoding: 'utf-8' });
const token = creds.match(/password=(.+)/)[1].trim();

async function mergePR() {
  const headers = {
    'Authorization': 'Bearer ' + token,
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'NXC-Setup',
    'Content-Type': 'application/json'
  };

  const res = await fetch('https://api.github.com/repos/nxcstudio/nxc-nico/pulls/2/merge', {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      commit_title: 'chore: autonomous merge of handshake verification PR #2',
      merge_method: 'squash'
    })
  });

  const data = await res.json();
  if (res.ok) {
    console.log('LIVE PR #2 MERGED SUCCESSFULLY! SHA:', data.sha);
  } else {
    console.log('Merge response:', res.status, data.message);
  }
}
mergePR();
