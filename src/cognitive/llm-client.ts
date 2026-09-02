import { getConfig } from '../config/index.js';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMPromptOptions {
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

export interface ILLMClient {
  generateText(messages: LLMMessage[], options?: LLMPromptOptions): Promise<string>;
  generateStructured<T>(messages: LLMMessage[], schemaDescription: string): Promise<T>;
}

export class CognitiveLLMClient implements ILLMClient {
  private provider: string;

  constructor() {
    const config = getConfig();
    this.provider = config.LLM_PROVIDER;
  }

  async generateText(messages: LLMMessage[], options?: LLMPromptOptions): Promise<string> {
    const config = getConfig();

    if (this.provider === 'gemini' && config.GEMINI_API_KEY) {
      // Gemini REST API invocation
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${config.LLM_MODEL}:generateContent?key=${config.GEMINI_API_KEY}`;
      const contents = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents, generationConfig: { temperature: options?.temperature ?? 0.2 } })
      });
      if (!res.ok) throw new Error(`Gemini API error: ${res.statusText}`);
      const data = await res.json() as any;
      return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    }

    if (this.provider === 'openai' && config.OPENAI_API_KEY) {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages,
          temperature: options?.temperature ?? 0.2,
          ...(options?.jsonMode ? { response_format: { type: 'json_object' } } : {})
        })
      });
      if (!res.ok) throw new Error(`OpenAI API error: ${res.statusText}`);
      const data = await res.json() as any;
      return data.choices?.[0]?.message?.content ?? '';
    }

    // Default Deterministic Cognitive Mock for test environments and simulations
    return this.fallbackDeterministicReasoning(messages);
  }

  async generateStructured<T>(messages: LLMMessage[], schemaDescription: string): Promise<T> {
    const prompt: LLMMessage[] = [
      ...messages,
      {
        role: 'user',
        content: `You must reply STRICTLY in valid JSON matching this schema:\n${schemaDescription}\nDo not wrap in backticks or markdown, just return raw JSON.`
      }
    ];

    const raw = await this.generateText(prompt, { jsonMode: true, temperature: 0.1 });
    try {
      const sanitized = raw.replace(/```json\s*|\s*```/g, '').trim();
      return JSON.parse(sanitized) as T;
    } catch (err) {
      throw new Error(`Failed to parse LLM structured output: ${raw}`);
    }
  }

  private fallbackDeterministicReasoning(messages: LLMMessage[]): string {
    const userPrompt = messages.map(m => m.content).join(' ');
    
    // Check if prompt is requesting triage/fix
    if (userPrompt.includes('Sentry') || userPrompt.includes('TypeError') || userPrompt.includes('null pointer')) {
      return JSON.stringify({
        repository: "nxc-auth-service",
        affectedFile: "src/services/token-verifier.ts",
        line: 42,
        errorType: "TypeError: Cannot read properties of undefined (reading 'split')",
        rootCause: "Authorization header was missing or improperly formatted bearer token before calling .split(' ')[1].",
        confidenceScore: 0.98,
        proposedFixDescription: "Added defensive optional chaining and null check for authorization header before string split.",
        patchDiff: `--- a/src/services/token-verifier.ts\n+++ b/src/services/token-verifier.ts\n@@ -40,3 +40,7 @@ export function verifyToken(authHeader?: string) {\n-  const token = authHeader.split(' ')[1];\n+  if (!authHeader || !authHeader.startsWith('Bearer ')) {\n+    throw new Error('Authentication header missing or malformed');\n+  }\n+  const token = authHeader.split(' ')[1];`
      });
    }

    return JSON.stringify({
      status: "analyzed",
      verdict: "Ready for orchestration"
    });
  }
}
