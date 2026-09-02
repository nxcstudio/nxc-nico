export function renderSelfHealingEmail(data: {
  repoName: string;
  errorType: string;
  rootCause: string;
  prNumber: number;
  prUrl: string;
  sandboxSummary: string;
  incidentId: string;
}): { html: string; text: string; subject: string } {
  const subject = `🚨 [NICO Autopilot] Patched & Verified: ${data.errorType} in ${data.repoName} (PR #${data.prNumber})`;

  const text = `NICO Autonomous Self-Healing Report
=============================================
Incident ID: ${data.incidentId}
Repository:  ${data.repoName}
Error:       ${data.errorType}

Root Cause:
${data.rootCause}

Verification:
${data.sandboxSummary}

Pull Request:
${data.prUrl}

HOW TO RESPOND:
- Reply "approve" to merge this PR immediately.
- Reply "tweak: <your instructions>" to request code adjustments.
- Reply "rollback" to discard this patch.
`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0d1117; color: #c9d1d9; padding: 20px; }
    .card { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 24px; max-width: 680px; margin: 0 auto; }
    .header { border-bottom: 1px solid #21262d; padding-bottom: 16px; margin-bottom: 20px; }
    .badge { display: inline-block; background: #238636; color: white; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: bold; }
    .code-box { background: #0d1117; border: 1px solid #30363d; border-radius: 6px; padding: 12px; font-family: 'SFMono-Regular', Consolas, monospace; font-size: 13px; color: #58a6ff; }
    .button { display: inline-block; background: #238636; color: white; text-decoration: none; padding: 10px 18px; border-radius: 6px; font-weight: bold; margin-top: 15px; }
    .reply-box { background: #1f242c; border-left: 4px solid #58a6ff; padding: 12px; margin-top: 20px; font-size: 13px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <span class="badge">NICO Self-Healing</span>
      <h2 style="color: #ffffff; margin-top: 10px;">Self-Healing Patch Generated & Verified</h2>
      <p style="color: #8b949e; font-size: 14px;">Incident <code>${data.incidentId}</code> | Service: <strong>${data.repoName}</strong></p>
    </div>

    <h4 style="color: #f85149; margin-bottom: 6px;">Triggering Exception</h4>
    <div class="code-box">${data.errorType}</div>

    <h4 style="color: #f0883e; margin-top: 16px; margin-bottom: 6px;">Diagnosis & Root Cause</h4>
    <p style="font-size: 14px; line-height: 1.5;">${data.rootCause}</p>

    <h4 style="color: #7ee787; margin-top: 16px; margin-bottom: 6px;">Isolated Sandbox Verification</h4>
    <p style="font-size: 14px;">${data.sandboxSummary}</p>

    <a href="${data.prUrl}" class="button">View Pull Request #${data.prNumber}</a>

    <div class="reply-box">
      <strong>📬 Direct Inbox Control:</strong>
      <p style="margin: 4px 0 0 0;">Reply directly to this email with:
        <br>• <code>approve</code> to merge and deploy via GitOps
        <br>• <code>tweak: &lt;instructions&gt;</code> to adjust the implementation
        <br>• <code>rollback</code> to cancel
      </p>
    </div>
  </div>
</body>
</html>
`;

  return { html, text, subject };
}

export function renderGitOpsReceiptEmail(data: {
  appName: string;
  revision: string;
  imageTag: string;
  syncStatus: string;
  healthStatus: string;
  maxSurge: string | number;
  maxUnavailable: string | number;
}): { html: string; text: string; subject: string } {
  const subject = `🚀 [GitOps Receipt] Deployed ${data.appName} (${data.imageTag}) to Cluster`;

  const text = `GitOps Deployment Receipt
=========================
Application: ${data.appName}
Image Tag:   ${data.imageTag}
Revision:    ${data.revision}
Sync Status: ${data.syncStatus}
Health:      ${data.healthStatus}
Strategy:    RollingUpdate (maxSurge: ${data.maxSurge}, maxUnavailable: ${data.maxUnavailable})
`;

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; background-color: #0d1117; color: #c9d1d9; padding: 20px;">
  <div style="background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 24px; max-width: 600px; margin: 0 auto;">
    <h3 style="color: #58a6ff; margin-top: 0;">🚀 ArgoCD Zero-Downtime Rollout Completed</h3>
    <p>Application: <strong>${data.appName}</strong></p>
    <p>Status: <span style="color: #3fb950; font-weight: bold;">${data.healthStatus} (${data.syncStatus})</span></p>
    <p>Image: <code>${data.imageTag}</code></p>
    <p>Commit Revision: <code>${data.revision}</code></p>
    <p>Policy: RollingUpdate (maxSurge: ${data.maxSurge}, maxUnavailable: ${data.maxUnavailable})</p>
  </div>
</body>
</html>
`;

  return { html, text, subject };
}
