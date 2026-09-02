export class SecretMasker {
  private secretRegistry = new Map<string, string>(); // token -> raw
  private rawToToken = new Map<string, string>();     // raw -> token

  registerSecret(name: string, rawValue: string): string {
    if (!rawValue || rawValue.length < 4) return rawValue;
    const token = `{{SECRET_${name.toUpperCase()}}}`;
    this.secretRegistry.set(token, rawValue);
    this.rawToToken.set(rawValue, token);
    return token;
  }

  mask(text: string): string {
    let masked = text;
    for (const [raw, token] of this.rawToToken.entries()) {
      masked = masked.split(raw).join(token);
    }
    // Also mask generic API keys and bearer tokens
    masked = masked.replace(/(gh[pousr]_[A-Za-z0-9_]{36})/g, '{{SECRET_GITHUB_TOKEN}}');
    masked = masked.replace(/(sk-[a-zA-Z0-9_-]{32,})/g, '{{SECRET_API_KEY}}');
    return masked;
  }

  unmask(text: string): string {
    let unmasked = text;
    for (const [token, raw] of this.secretRegistry.entries()) {
      unmasked = unmasked.split(token).join(raw);
    }
    return unmasked;
  }
}
