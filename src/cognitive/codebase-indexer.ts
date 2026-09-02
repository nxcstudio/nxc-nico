import fs from 'node:fs/promises';
import path from 'node:path';

export interface IndexedFile {
  relativePath: string;
  extension: string;
  size: number;
}

export class CodebaseIndexer {
  private rootPath: string;

  constructor(rootPath: string) {
    this.rootPath = rootPath;
  }

  async scanRepository(maxDepth: number = 5): Promise<IndexedFile[]> {
    const results: IndexedFile[] = [];
    await this.walk(this.rootPath, '', 0, maxDepth, results);
    return results;
  }

  private async walk(currentDir: string, relativeDir: string, currentDepth: number, maxDepth: number, results: IndexedFile[]) {
    if (currentDepth > maxDepth) return;
    try {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') continue;
        const entryRel = path.join(relativeDir, entry.name).replace(/\\/g, '/');
        const entryFull = path.join(currentDir, entry.name);

        if (entry.isDirectory()) {
          await this.walk(entryFull, entryRel, currentDepth + 1, maxDepth, results);
        } else if (entry.isFile()) {
          const stat = await fs.stat(entryFull);
          results.push({
            relativePath: entryRel,
            extension: path.extname(entry.name),
            size: stat.size
          });
        }
      }
    } catch {
      // Directory may not exist yet or permission denied
    }
  }

  async findFileContext(targetFile: string, startLine: number, windowSize: number = 10): Promise<string> {
    try {
      const fullPath = path.isAbsolute(targetFile) ? targetFile : path.join(this.rootPath, targetFile);
      const content = await fs.readFile(fullPath, 'utf-8');
      const lines = content.split('\n');
      const start = Math.max(0, startLine - windowSize - 1);
      const end = Math.min(lines.length, startLine + windowSize);
      return lines.slice(start, end).map((l, i) => `${start + i + 1}: ${l}`).join('\n');
    } catch (err) {
      return `[File could not be read: ${targetFile}]`;
    }
  }
}
