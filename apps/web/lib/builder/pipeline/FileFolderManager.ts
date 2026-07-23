import { getEventBus } from './EventBus';
import { EventNames } from './types';
import { useBuilderStore } from '../store';
import { logger } from '@/lib/logger';

export class FileFolderManager {
  private bus = getEventBus();
  private unsubs: Array<() => void> = [];
  private projectId: string | null = null;
  private cachedFiles = new Map<string, string>();
  private syncPending = false;

  setProjectId(id: string): void {
    this.projectId = id;
  }

  start(): void {
    this.unsubs.push(
      this.bus.on(EventNames.PROJECT_STATE_CHANGED, (event) => {
        const { elements } = event.payload;
        this.syncFilesFromState(elements);
      })
    );
    this.unsubs.push(
      this.bus.on(EventNames.ELEMENT_REMOVED, (event) => {
        const { element } = event.payload;
        this.handleElementRemoved(element);
      })
    );
    this.unsubs.push(
      this.bus.on(EventNames.ELEMENT_DUPLICATED, (event) => {
        const { originalId, newElement } = event.payload;
        this.handleElementDuplicated(originalId, newElement);
      })
    );
  }

  private syncFilesFromState(elements: any[]): void {
    if (this.syncPending) return;
    this.syncPending = true;

    queueMicrotask(() => {
      this.syncPending = false;
      const desired = this.computeDesiredFiles(elements);
      const currentPaths = new Set(this.cachedFiles.keys());
      const desiredPaths = new Set(desired.keys());
      const pid = this.projectId || 'local';

      for (const [path, content] of desired) {
        const cached = this.cachedFiles.get(path);
        if (cached === undefined) {
          this.bus.emit(EventNames.FILE_CREATED, { path, content, projectId: pid });
        } else if (cached !== content) {
          this.bus.emit(EventNames.FILE_UPDATED, { path, content, previousContent: cached, projectId: pid });
        }
        this.cachedFiles.set(path, content);
      }

      for (const path of currentPaths) {
        if (!desiredPaths.has(path)) {
          this.bus.emit(EventNames.FILE_DELETED, { path, projectId: pid });
          this.cachedFiles.delete(path);
        }
      }
    });
  }

  private computeDesiredFiles(elements: any[]): Map<string, string> {
    const files = new Map<string, string>();
    files.set('builder-state.json', JSON.stringify({ elements, version: 1 }, null, 2));
    files.set('index.html', this.generateHtml(elements));
    files.set('styles.css', this.generateCss(elements));
    elements.forEach((el, i) => {
      const name = this.sanitize(el.name || el.type);
      files.set(`components/${name}.html`, this.elementToCode(el));
    });
    return files;
  }

  private handleElementRemoved(element: any): void {
    const path = `components/${this.sanitize(element.name || element.type)}.html`;
    if (this.cachedFiles.has(path)) {
      this.bus.emit(EventNames.FILE_DELETED, { path, projectId: this.projectId || 'local' });
      this.cachedFiles.delete(path);
    }
  }

  private handleElementDuplicated(originalId: string, newElement: any): void {
    const origPath = this.findFilePathForElement(originalId);
    if (origPath && this.cachedFiles.has(origPath)) {
      const content = this.cachedFiles.get(origPath)!;
      const newPath = `components/${this.sanitize(newElement.name || newElement.type)}.html`;
      const updated = content.replace(new RegExp(`id="${originalId}"`, 'g'), `id="${newElement.id}"`);
      this.bus.emit(EventNames.FILE_CREATED, { path: newPath, content: updated, projectId: this.projectId || 'local' });
      this.cachedFiles.set(newPath, updated);
    }
  }

  private findFilePathForElement(elementId: string): string | null {
    for (const [path] of this.cachedFiles) {
      if (path.includes(elementId)) return path;
    }
    return null;
  }

  private generateHtml(elements: any[]): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AI Wonderland Builder Project</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <div id="app">
    ${elements.map((el) => this.renderEl(el, 2)).join('\n    ')}
  </div>
  <script>window.__BUILDER_STATE__ = ${JSON.stringify({ elements, version: 1 }, null, 2)};</script>
</body>
</html>`;
  }

  private renderEl(el: any, depth: number): string {
    const indent = '  '.repeat(depth);
    const tag = elTag(el);
    const attrs = elAttrs(el);
    const children = el.children?.map((c: any) => this.renderEl(c, depth + 1)).join('\n') || '';
    const content = el.props?.content || el.props?.label || el.props?.title || '';
    if (children) return `${indent}<${tag}${attrs}>\n${children}\n${indent}</${tag}>`;
    if (content && !['img', 'input', 'hr', 'br'].includes(tag)) return `${indent}<${tag}${attrs}>${escapeHtml(content)}</${tag}>`;
    return `${indent}<${tag}${attrs} />`;
  }

  private generateCss(elements: any[]): string {
    const lines: string[] = [];
    lines.push('/* Auto-generated by AI Wonderland Builder */');
    lines.push('*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }');
    lines.push('body { font-family: Inter, sans-serif; line-height: 1.6; color: #e2e8f0; background: #0a0a0a; }');
    lines.push('#app { max-width: 1200px; margin: 0 auto; padding: 2rem 1rem; }');
    const seen = new Set<string>();
    for (const el of elements) this.collectCss(el, lines, seen);
    return lines.join('\n');
  }

  private collectCss(el: any, lines: string[], seen: Set<string>): void {
    const s = el.styles;
    if (s && Object.keys(s).length > 0) {
      const key = `.type-${el.type}`;
      if (!seen.has(key)) {
        seen.add(key);
        const rules = Object.entries(s).filter(([_, v]) => v != null && v !== '')
          .map(([k, v]) => `  ${camelToKebab(k)}: ${v};`);
        lines.push(`\n${key} {`, ...rules, '}');
      }
    }
    if (el.children) for (const c of el.children) this.collectCss(c, lines, seen);
  }

  private elementToCode(el: any): string {
    return `<!-- ${el.name} (${el.type}) -->
<div class="block-${el.type}" data-type="${el.type}" data-name="${escapeHtml(el.name || '')}">
  ${escapeHtml(el.props?.content || el.props?.label || el.props?.title || '')}
</div>`;
  }

  private sanitize(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'element';
  }

  getFiles(): Map<string, string> { return new Map(this.cachedFiles); }
  getFileCount(): number { return this.cachedFiles.size; }

  stop(): void {
    for (const unsub of this.unsubs) unsub();
    this.unsubs = [];
  }
}

function elTag(el: any): string {
  const m: Record<string, string> = {
    heading: `h${el.props?.level?.replace('h', '') || '2'}`,
    paragraph: 'p', 'rich-text': 'div', list: el.props?.listType === 'ordered' ? 'ol' : 'ul',
    quote: 'blockquote', code: 'pre', image: 'img', video: 'div', button: 'a',
    divider: 'hr', spacer: 'div', input: 'input', textarea: 'textarea', select: 'select',
    section: 'section', container: 'div', grid: 'div', columns: 'div', row: 'div', group: 'div',
  };
  return m[el.type] || 'div';
}

function elAttrs(el: any): string {
  const parts: string[] = [`id="${el.id}"`, `class="builder-block block-${el.type}"`, `data-type="${el.type}"`];
  if (el.props?.alt) parts.push(`alt="${escapeHtml(el.props.alt)}"`);
  if (el.props?.src) parts.push(`src="${escapeHtml(el.props.src)}"`);
  if (el.props?.href || el.props?.url) parts.push(`href="${escapeHtml(el.props?.href || el.props?.url)}"`);
  if (el.props?.['aria-label']) parts.push(`aria-label="${escapeHtml(el.props['aria-label'])}"`);
  const s = el.styles || {};
  const styleStr = Object.entries(s).filter(([_, v]) => v).map(([k, v]) => `${camelToKebab(k)}: ${v}`).join('; ');
  if (styleStr) parts.push(`style="${styleStr}"`);
  return parts.length ? ' ' + parts.join(' ') : '';
}

function camelToKebab(s: string): string {
  return s.replace(/([A-Z])/g, '-$1').toLowerCase();
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export const fileFolderManager = new FileFolderManager();
