import fs from 'node:fs/promises';
import path from 'node:path';

export interface KnowledgeEntry {
  title: string;
  path: string;
  description: string;
  content: string;
  sources: Array<{ session: string; captured_at: string }>;
}

export class AgentKnowledgeStore {
  private storeDir: string;

  constructor(storeDir: string) {
    this.storeDir = storeDir;
  }

  async init() {
    await fs.mkdir(this.storeDir, { recursive: true });
    await fs.mkdir(path.join(this.storeDir, 'projects'), { recursive: true });
    await fs.mkdir(path.join(this.storeDir, 'incidents'), { recursive: true });
  }

  async writeEntry(entry: KnowledgeEntry): Promise<string> {
    const fullPath = path.join(this.storeDir, entry.path);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });

    const frontmatter = [
      '---',
      `title: "${entry.title}"`,
      `description: "${entry.description}"`,
      'sources:',
      ...entry.sources.map(s => `  - session: "${s.session}"\n    captured_at: "${s.captured_at}"`),
      '---',
      '',
      entry.content
    ].join('\n');

    await fs.writeFile(fullPath, frontmatter, 'utf-8');
    return fullPath;
  }

  async search(query: string): Promise<KnowledgeEntry[]> {
    const results: KnowledgeEntry[] = [];
    const walk = async (dir: string) => {
      const files = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
      for (const file of files) {
        const p = path.join(dir, file.name);
        if (file.isDirectory()) {
          await walk(p);
        } else if (file.isFile() && file.name.endsWith('.md')) {
          const content = await fs.readFile(p, 'utf-8');
          if (content.toLowerCase().includes(query.toLowerCase())) {
            results.push({
              title: file.name,
              path: path.relative(this.storeDir, p),
              description: 'Knowledge entry',
              content,
              sources: []
            });
          }
        }
      }
    };
    await walk(this.storeDir);
    return results;
  }
}
