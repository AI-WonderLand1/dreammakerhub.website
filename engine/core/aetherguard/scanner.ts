import { readFileSync, readdirSync, statSync, writeFileSync } from 'fs';
import { join, relative } from 'path';
import { SUPPORTED_EXTS, IGNORE_DIRS, MAX_CONTENT_LENGTH } from './constants';
import { VirtualFile } from './types';

function isTextFile(p: string): boolean {
  const ext = p.toLowerCase().slice(p.lastIndexOf('.'));
  return SUPPORTED_EXTS.has(ext);
}

function shouldIgnoreDir(name: string): boolean {
  return IGNORE_DIRS.has(name) || name.startsWith('.');
}

const langMap: Record<string, string> = {
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.css': 'css',
  '.json': 'json',
  '.html': 'html',
  '.md': 'text',
  '.txt': 'text',
};

export function walkDir(dir: string, base: string): VirtualFile[] {
  const entries: VirtualFile[] = [];
  try {
    const names = readdirSync(dir);
    for (const name of names) {
      const fullPath = join(dir, name);
      const relPath = relative(base, fullPath);
      if (statSync(fullPath).isDirectory()) {
        if (shouldIgnoreDir(name)) continue;
        entries.push(...walkDir(fullPath, base));
      } else if (isTextFile(name)) {
        try {
          const content = readFileSync(fullPath, 'utf-8');
          const ext = name.slice(name.lastIndexOf('.'));
          entries.push({
            id: relPath.replace(/[/\\]/g, '_'),
            name,
            path: relPath,
            content,
            language: (langMap[ext] || 'text') as VirtualFile['language'],
          });
        } catch { }
      }
    }
  } catch { }
  return entries;
}

export function readTargetFile(baseDir: string, relPath: string): string | null {
  const fullPath = join(baseDir, relPath);
  if (!fullPath.startsWith(baseDir)) return null;
  try {
    return readFileSync(fullPath, 'utf-8');
  } catch {
    return null;
  }
}

export function writeTargetFile(baseDir: string, relPath: string, content: string): boolean {
  const fullPath = join(baseDir, relPath);
  if (!fullPath.startsWith(baseDir)) return false;
  try {
    writeFileSync(fullPath, content, 'utf-8');
    return true;
  } catch {
    return false;
  }
}

export function sanitizeContent(content: string): string {
  return content.replace(/\0/g, '').slice(0, MAX_CONTENT_LENGTH);
}

export function assembleRepoContentPrompt(files: VirtualFile[], activeFileId?: string): string {
  let prompt = "WORKSPACE REPOSITORY STRUCTURE & FILES:\n\n";
  for (const file of files) {
    const isActiveMarker = file.id === activeFileId ? " [ACTIVE FOCUS]" : "";
    prompt += `--- PATH: ${file.path}${isActiveMarker} ---\n`;
    prompt += `LANGUAGE: ${file.language}\n`;
    prompt += `CONTENT:\n${sanitizeContent(file.content)}\n\n`;
  }
  return prompt;
}
