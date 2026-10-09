import { getEventBus } from './EventBus';
import { EventNames } from './types';
import { useBuilderStore } from '../store';
import { normalizeHeadingLevel } from '../heading-level';
import { imageBlockHtml } from '../image-block-html';
import { escapeExportHtml, exportCssRule, safeClassToken, safeExportAttributes } from '../safe-export-html';
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
      const updated = content.replaceAll(`id="${escapeExportHtml(originalId)}"`, `id="${escapeExportHtml(newElement.id)}"`);
      this.bus.emit(EventNames.FILE_CREATED, { path: newPath, content: updated, projectId: this.projectId || 'local' });
      this.cachedFiles.set(newPath, updated);
    }
  }

  private findFilePathForElement(elementId: string): string | null {
    const needle = `id="${escapeExportHtml(elementId)}"`;
    for (const [path, content] of this.cachedFiles) {
      if (content.includes(needle)) return path;
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
    ${elements.map((el, i) => this.renderEl(el, 2, [i])).join('\n    ')}
  </div>
  <script>window.__BUILDER_STATE__ = ${JSON.stringify({ elements, version: 1 }, null, 2).replace(/</g, '\\u003c')};</script>
</body>
</html>`;
  }

  private renderEl(el: any, depth: number, path: number[]): string {
    const indent = '  '.repeat(depth);
    const tag = elTag(el);
    const attrs = safeExportAttributes(el, path, 'files');
    const children = el.children?.map((c: any, i: number) => this.renderEl(c, depth + 1, [...path, i])).join('\n') || '';
    const content = el.props?.content || el.props?.label || el.props?.title || '';
    const imageContent = imageBlockHtml(el.type, el.props || {});
    if (imageContent !== null) return `${indent}<${tag}${attrs}>${imageContent}${children}</${tag}>`;
    if (children) return `${indent}<${tag}${attrs}>\n${children}\n${indent}</${tag}>`;
    if (content && !['img', 'input', 'hr', 'br'].includes(tag)) return `${indent}<${tag}${attrs}>${escapeExportHtml(content)}</${tag}>`;
    return `${indent}<${tag}${attrs} />`;
  }

  private generateCss(elements: any[]): string {
    const lines: string[] = [];
    lines.push('/* Auto-generated by AI Wonderland Builder */');
    lines.push('*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }');
    lines.push('body { font-family: Inter, sans-serif; line-height: 1.6; color: #e2e8f0; background: #0a0a0a; }');
    lines.push('#app { max-width: 1200px; margin: 0 auto; padding: 2rem 1rem; }');
    for (const [i, el] of elements.entries()) this.collectCss(el, lines, [i]);
    return lines.join('\n');
  }

  private collectCss(el: any, lines: string[], path: number[]): void {
    const rule = exportCssRule(el, path);
    if (rule) lines.push(rule);
    if (Array.isArray(el.children)) {
      el.children.forEach((child: any, i: number) => this.collectCss(child, lines, [...path, i]));
    }
  }

  private elementToCode(el: any): string {
    return `<!-- Exported builder component -->
<div class="block-${safeClassToken(el.type)}" data-type="${escapeExportHtml(el.type)}" data-name="${escapeExportHtml(el.name || '')}">
  ${escapeExportHtml(el.props?.content || el.props?.label || el.props?.title || '')}
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
  if (el.type === 'section' && el.props?.semanticTag === 'footer') return 'footer';
  const m: Record<string, string> = {
    heading: normalizeHeadingLevel(el.props?.level),
    paragraph: 'p', 'rich-text': 'div', list: el.props?.listType === 'ordered' ? 'ol' : 'ul',
    quote: 'blockquote', code: 'pre', image: 'img', video: 'div', button: 'a',
    divider: 'hr', spacer: 'div', input: 'input', textarea: 'textarea', select: 'select',
    section: 'section', container: 'div', grid: 'div', columns: 'div', row: 'div', group: 'div',
  };
  return m[el.type] || 'div';
}

export const fileFolderManager = new FileFolderManager();
