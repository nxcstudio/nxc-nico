export class WardenGuardrails {
  private blockedPatterns: RegExp[] = [
    /\brm\s+(-rf?|-fr?)\s+(\/|~|\$HOME|\.\.)/i,
    /\bmkfs\b/i,
    /\bdd\s+if=.*of=\/dev\//i,
    />\s*\/dev\/([sh]d[a-z]|nvme)/i,
    /\bchmod\s+(-R\s+)?777\s+\//i,
    /\bchown\s+(-R\s+)?.*\s+\//i,
    /\bdrop\s+database\b/i,
    /\btruncate\s+table\b/i
  ];

  isPermitted(command: string): { permitted: boolean; violation?: string } {
    for (const pattern of this.blockedPatterns) {
      if (pattern.test(command)) {
        return {
          permitted: false,
          violation: `Warden policy violation: blocked potentially destructive operation matching pattern ${pattern}`
        };
      }
    }
    return { permitted: true };
  }
}
