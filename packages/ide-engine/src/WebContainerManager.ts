import { WebContainer, type FileSystemTree } from '@webcontainer/api';

const DEFAULT_PROJECT: FileSystemTree = {
  'package.json': {
    file: {
      contents: JSON.stringify(
        {
          name: 'wonderspace-project',
          version: '1.0.0',
          type: 'module',
          scripts: {
            dev: 'node server.js',
          },
          dependencies: {
            express: 'latest',
          },
        },
        null,
        2
      ),
    },
  },
  'server.js': {
    file: {
      contents: `import express from 'express';

const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
  res.send('<h1>Hello from WonderSpace!</h1><p>Edit this file and restart to see changes.</p>');
});

app.listen(PORT, () => {
  console.log(\`Server running at http://localhost:\${PORT}\`);
});
`,
    },
  },
  'index.html': {
    file: {
      contents: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WonderSpace Project</title>
</head>
<body>
  <h1>Welcome to WonderSpace</h1>
  <p>Start editing to build something amazing!</p>
</body>
</html>
`,
    },
  },
  'README.md': {
    file: {
      contents: `# WonderSpace Project\n\nBuilt with WonderSpace IDE\n`,
    },
  },
};

export interface FileNode {
  name: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

export class WebContainerManager {
  private instance: WebContainer | null = null;
  private booted = false;

  async boot(): Promise<WebContainer> {
    if (this.instance) return this.instance;

    this.instance = await WebContainer.boot({ workdirName: 'wonderspace' });
    this.booted = true;

    return this.instance;
  }

  async mountProject(tree?: FileSystemTree): Promise<void> {
    if (!this.instance) throw new Error('WebContainer not booted');
    await this.instance.mount(tree || DEFAULT_PROJECT);
  }

  async readFile(path: string): Promise<string> {
    if (!this.instance) throw new Error('WebContainer not booted');
    return this.instance.fs.readFile(path, 'utf-8');
  }

  async writeFile(path: string, content: string): Promise<void> {
    if (!this.instance) throw new Error('WebContainer not booted');
    await this.instance.fs.writeFile(path, content);
  }

  async deleteFile(path: string): Promise<void> {
    if (!this.instance) throw new Error('WebContainer not booted');
    await this.instance.fs.rm(path, { force: true });
  }

  async createDirectory(path: string): Promise<void> {
    if (!this.instance) throw new Error('WebContainer not booted');
    await this.instance.fs.mkdir(path, { recursive: true });
  }

  async getFileTree(path = '.'): Promise<FileNode[]> {
    if (!this.instance) throw new Error('WebContainer not booted');
    return this.buildTree(this.instance, path);
  }

  async spawn(command: string, args: string[] = []) {
    if (!this.instance) throw new Error('WebContainer not booted');
    return this.instance.spawn(command, args);
  }

  onServerReady(callback: (port: number, url: string) => void): () => void {
    if (!this.instance) throw new Error('WebContainer not booted');
    return this.instance.on('server-ready', callback);
  }

  watchFile(path: string, callback: (event: string, filename: string) => void) {
    if (!this.instance) throw new Error('WebContainer not booted');
    return this.instance.fs.watch(path, { recursive: true }, (event, filename) => {
      callback(event, typeof filename === 'string' ? filename : new TextDecoder().decode(filename));
    });
  }

  teardown(): void {
    if (this.instance) {
      this.instance.teardown();
      this.instance = null;
      this.booted = false;
    }
  }

  isReady(): boolean {
    return this.booted && this.instance !== null;
  }

  getInstance(): WebContainer {
    if (!this.instance) throw new Error('WebContainer not booted');
    return this.instance;
  }

  private async buildTree(wc: WebContainer, path: string): Promise<FileNode[]> {
    const entries = await wc.fs.readdir(path, { withFileTypes: true });
    const nodes: FileNode[] = [];

    for (const entry of entries) {
      const name = typeof entry.name === 'string' ? entry.name : new TextDecoder().decode(entry.name);
      if (name.startsWith('.') && name !== '.env') continue;
      const fullPath = path === '.' ? name : `${path}/${name}`;

      if (entry.isDirectory()) {
        const children = await this.buildTree(wc, fullPath);
        nodes.push({ name, type: 'directory', children });
      } else {
        nodes.push({ name, type: 'file' });
      }
    }

    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    return nodes;
  }
}
