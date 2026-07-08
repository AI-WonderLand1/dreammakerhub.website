export interface ErrorPattern {
  id: string;
  type: string;
  message: string;
  file?: string;
  line?: number;
  package?: string;
  count: number;
  firstSeen: number;
  lastSeen: number;
  status: 'pending' | 'fixed' | 'dismissed';
  fix?: {
    description: string;
    file: string;
    original: string;
    replacement: string;
  };
}

interface PatternRule {
  type: string;
  regex: RegExp;
  extract: (match: RegExpMatchArray) => Partial<ErrorPattern>;
}

const PATTERNS: PatternRule[] = [
  {
    type: 'MissingModule',
    regex: /Cannot find module ['"]([^'"]+)['"]/,
    extract: (m) => ({
      message: `Missing module: ${m[1]}`,
      package: m[1],
    }),
  },
  {
    type: 'SyntaxError',
    regex: /SyntaxError: (.+?)(?:\s+at\s+(.+?):(\d+))?/,
    extract: (m) => ({
      message: m[1],
      file: m[2],
      line: m[3] ? parseInt(m[3], 10) : undefined,
    }),
  },
  {
    type: 'TypeError',
    regex: /TypeError: (.+?)(?:\s+at\s+(.+?):(\d+))?/,
    extract: (m) => ({
      message: m[1],
      file: m[2],
      line: m[3] ? parseInt(m[3], 10) : undefined,
    }),
  },
  {
    type: 'ReferenceError',
    regex: /ReferenceError: (.+?)(?:\s+at\s+(.+?):(\d+))?/,
    extract: (m) => ({
      message: m[1],
      file: m[2],
      line: m[3] ? parseInt(m[3], 10) : undefined,
    }),
  },
  {
    type: 'PortInUse',
    regex: /EADDRINUSE.*:(\d+)/,
    extract: (m) => ({
      message: `Port ${m[1]} is already in use`,
    }),
  },
  {
    type: 'ImportError',
    regex: /ERR_MODULE_NOT_FOUND.*?['"]([^'"]+)['"]/,
    extract: (m) => ({
      message: `Cannot find package: ${m[1]}`,
      package: m[1],
    }),
  },
  {
    type: 'PermissionDenied',
    regex: /EACCES|permission denied/i,
    extract: () => ({
      message: 'Permission denied',
    }),
  },
  {
    type: 'NetworkError',
    regex: /ENOTFOUND|ECONNREFUSED|ETIMEDOUT/,
    extract: (m) => ({
      message: `Network error: ${m[0]}`,
    }),
  },
  {
    type: 'OutOfMemory',
    regex: /JavaScript heap out of memory|ENOMEM/,
    extract: () => ({
      message: 'Out of memory',
    }),
  },
  {
    type: 'BuildError',
    regex: /Failed to compile|Build failed|Compilation failed/i,
    extract: () => ({
      message: 'Build failed',
    }),
  },
];

export class ErrorScanner {
  private patterns: Map<string, ErrorPattern> = new Map();
  private listeners: Set<(patterns: ErrorPattern[]) => void> = new Set();
  private buffer: string = '';

  processOutput(data: string): void {
    this.buffer += data;

    // Process line by line
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() ?? '';

    for (const line of lines) {
      this.scanLine(line);
    }
  }

  private scanLine(line: string): void {
    // Strip ANSI escape codes
    const ESC = String.fromCharCode(27);
    const clean = line.replace(new RegExp(`${ESC}\\[[0-9;]*m`, 'g'), '').trim();
    if (!clean) return;

    for (const rule of PATTERNS) {
      const match = clean.match(rule.regex);
      if (!match) continue;

      const extracted = rule.extract(match);
      const key = this.buildKey(rule.type, extracted);

      const existing = this.patterns.get(key);
      if (existing) {
        existing.count++;
        existing.lastSeen = Date.now();
      } else {
        const pattern: ErrorPattern = {
          id: key,
          type: rule.type,
          message: extracted.message ?? clean.slice(0, 200),
          file: extracted.file,
          line: extracted.line,
          package: extracted.package,
          count: 1,
          firstSeen: Date.now(),
          lastSeen: Date.now(),
          status: 'pending',
        };
        this.patterns.set(key, pattern);
      }

      this.notifyListeners();
      break; // One match per line
    }
  }

  private buildKey(type: string, extracted: Partial<ErrorPattern>): string {
    const parts = [type];
    if (extracted.package) parts.push(extracted.package);
    if (extracted.file) parts.push(extracted.file);
    if (extracted.line) parts.push(String(extracted.line));
    return parts.join(':');
  }

  getPatterns(): ErrorPattern[] {
    return Array.from(this.patterns.values()).sort((a, b) => b.lastSeen - a.lastSeen);
  }

  getPending(): ErrorPattern[] {
    return this.getPatterns().filter((p) => p.status === 'pending');
  }

  getSummary(): { total: number; fixed: number; pending: number; dismissed: number } {
    const all = this.getPatterns();
    return {
      total: all.reduce((sum, p) => sum + p.count, 0),
      fixed: all.filter((p) => p.status === 'fixed').reduce((sum, p) => sum + p.count, 0),
      pending: all.filter((p) => p.status === 'pending').reduce((sum, p) => sum + p.count, 0),
      dismissed: all.filter((p) => p.status === 'dismissed').reduce((sum, p) => sum + p.count, 0),
    };
  }

  applyFix(id: string): void {
    const pattern = this.patterns.get(id);
    if (pattern) {
      pattern.status = 'fixed';
      this.notifyListeners();
    }
  }

  dismiss(id: string): void {
    const pattern = this.patterns.get(id);
    if (pattern) {
      pattern.status = 'dismissed';
      this.notifyListeners();
    }
  }

  setFix(id: string, fix: ErrorPattern['fix']): void {
    const pattern = this.patterns.get(id);
    if (pattern) {
      pattern.fix = fix;
      this.notifyListeners();
    }
  }

  subscribe(listener: (patterns: ErrorPattern[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const patterns = this.getPatterns();
    for (const listener of this.listeners) {
      listener(patterns);
    }
  }

  clear(): void {
    this.patterns.clear();
    this.buffer = '';
    this.notifyListeners();
  }

  toMarkdown(): string {
    const patterns = this.getPatterns();
    const summary = this.getSummary();
    const now = new Date().toISOString().split('T')[0];

    let md = `# Error Scan — ${now}\n\n`;
    md += `**Total**: ${summary.total} | **Fixed**: ${summary.fixed} | **Pending**: ${summary.pending} | **Dismissed**: ${summary.dismissed}\n\n`;

    if (patterns.length === 0) {
      md += 'No errors detected. Clean session!\n';
      return md;
    }

    md += '## Patterns\n\n';
    for (const p of patterns) {
      const icon = p.status === 'fixed' ? '✅' : p.status === 'dismissed' ? '❌' : '⏳';
      md += `### ${p.type} (×${p.count}) — ${icon} ${p.status}\n\n`;
      md += `- **Message**: ${p.message}\n`;
      if (p.file) md += `- **File**: ${p.file}${p.line ? `:${p.line}` : ''}\n`;
      if (p.package) md += `- **Package**: \`${p.package}\`\n`;
      if (p.fix) md += `- **Fix**: ${p.fix.description}\n`;
      md += '\n';
    }

    return md;
  }

  toJSON(): { patterns: ErrorPattern[]; summary: ReturnType<ErrorScanner['getSummary']> } {
    return {
      patterns: this.getPatterns(),
      summary: this.getSummary(),
    };
  }
}
