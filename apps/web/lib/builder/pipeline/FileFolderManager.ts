import { getEventBus } from './EventBus';
import { EventNames, type EventPayload, type FileCreatedPayload, type FileUpdatedPayload, type FileDeletedPayload } from './types';
import { useBuilderStore } from '../store';
import { logger } from '@/lib/logger';

interface FileEntry {
  path: string;
  content: string;
}

export class FileFolderManager {
  private bus = getEventBus();
  private unsubs: Array<() => void> = [];
  private projectId: string | null = null;
  private cachedFiles: Map<string, string> = new Map();

  setProjectId(id: string): void {
    this.projectId = id;
  }

  start(): void {
    // When project state changes, compute required files and sync
    this.unsubs.push(
      this.bus.on(EventNames.PROJECT_STATE_CHANGED, (event) => {
        const { elements } = event.payload as EventPayload<typeof EventNames.PROJECT_STATE_CHANGED>;
        this.syncFilesFromState(elements);
      })
    );

    // Handle element removed — check for dangling references
    this.unsubs.push(
      this.bus.on(EventNames.ELEMENT_REMOVED, (event) => {
        const { element } = event.payload as EventPayload<typeof EventNames.ELEMENT_REMOVED>;
        this.handleElementRemoved(element);
      })
    );

    // Handle element duplicated — copy any associated files
    this.unsubs.push(
      this.bus.on(EventNames.ELEMENT_DUPLICATED, (event) => {
        const { originalId, newElement } = event.payload as EventPayload<typeof EventNames.ELEMENT_DUPLICATED>;
        this.handleElementDuplicated(originalId, newElement);
      })
    );
  }

  private syncFilesFromState(elements: any[]): void {
    const desiredFiles = new Map<string, string>();

    // Generate builder-state.json
    desiredFiles.set('builder-state.json', JSON.stringify({ elements, version: 1 }, null, 2));

    // Generate index.html from elements
    const html = this.generateHtml(elements);
    desiredFiles.set('index.html', html);

    // Generate individual component files for top-level elements
    elements.forEach((el, index) => {
      const fileName = this.elementToFileName(el, index);
      if (fileName) {
        const code = this.elementToCode(el);
        desiredFiles.set(`components/${fileName}`, code);
      }
    });

    // Generate style.css
    const css = this.generateCss(elements);
    desiredFiles.set('styles.css', css);

    // Diff with cached files and emit create/update/delete events
    const currentPaths = new Set(this.cachedFiles.keys());
    const desiredPaths = new Set(desiredFiles.keys());

    // Files to create or update
    for (const [path, content] of desiredFiles) {
      const cached = this.cachedFiles.get(path);
      if (cached === undefined) {
        this.bus.emit(EventNames.FILE_CREATED, { path, content, projectId: this.projectId || 'local' });
      } else if (cached !== content) {
        this.bus.emit(EventNames.FILE_UPDATED, { path, content, previousContent: cached, projectId: this.projectId || 'local' });
      }
      this.cachedFiles.set(path, content);
    }

    // Files to delete (no longer in state)
    for (const path of currentPaths) {
      if (!desiredPaths.has(path)) {
        this.bus.emit(EventNames.FILE_DELETED, { path, projectId: this.projectId || 'local' });
        this.cachedFiles.delete(path);
      }
    }
  }

  private handleElementRemoved(element: any): void {
    // Emit delete for any associated files
    const filePath = `components/${this.sanitizeFileName(element.name || element.type)}.html`;
    if (this.cachedFiles.has(filePath)) {
      this.bus.emit(EventNames.FILE_DELETED, { path: filePath, projectId: this.projectId || 'local' });
      this.cachedFiles.delete(filePath);
    }
  }

  private handleElementDuplicated(originalId: string, newElement: any): void {
    const origPath = this.findFilePathForElement(originalId);
    if (origPath && this.cachedFiles.has(origPath)) {
      const content = this.cachedFiles.get(origPath)!;
      const newPath = `components/${this.sanitizeFileName(newElement.name || newElement.type)}.html`;
      const updated = content.replace(
        new RegExp(`id="${originalId}"`, 'g'),
        `id="${newElement.id}"`
      ).replace(
        new RegExp(`name="${newElement.name}"`, 'g'),
        `name="${newElement.name}"`
      );
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
    ${elements.map((el) => this.elementToHtml(el, 0)).join('\n    ')}
  </div>
  <script src="builder-state.json" type="application/json"></script>
</body>
</html>`;
  }

  private elementToHtml(el: any, depth: number): string {
    const indent = '    '.repeat(depth + 2);
    const tag = this.elementTag(el);
    const attrs = this.elementAttributes(el);
    const children = el.children?.map((c: any) => this.elementToHtml(c, depth + 1)).join('\n') || '';
    const content = el.props?.content || el.props?.label || el.props?.title || '';
    if (children) {
      return `${indent}<${tag}${attrs}>\n${children}\n${indent}</${tag}>`;
    }
    if (content && !tag.startsWith('img') && !tag.startsWith('input')) {
      return `${indent}<${tag}${attrs}>${content}</${tag}>`;
    }
    return `${indent}<${tag}${attrs} />`;
  }

  private elementTag(el: any): string {
    const typeMap: Record<string, string> = {
      heading: `h${el.props?.level?.replace('h', '') || '2'}`,
      paragraph: 'p', rich_text: 'div', list: el.props?.listType === 'ordered' ? 'ol' : 'ul',
      quote: 'blockquote', code: 'pre', image: 'img', video: 'div',
      button: 'a', divider: 'hr', spacer: 'div', icon: 'span',
      input: 'input', textarea: 'textarea', select: 'select',
      section: 'section', container: 'div', grid: 'div', flex: 'div',
      card: 'div', columns: 'div', row: 'div', group: 'div',
    };
    return typeMap[el.type] || 'div';
  }

  private elementAttributes(el: any): string {
    const attrs: string[] = [];
    attrs.push(`id="${el.id}"`);
    attrs.push(`class="builder-block block-${el.type}"`);
    attrs.push(`data-type="${el.type}"`);
    attrs.push(`data-name="${el.name}"`);
    if (el.props?.alt) attrs.push(`alt="${el.props.alt}"`);
    if (el.props?.src) attrs.push(`src="${el.props.src}"`);
    if (el.props?.href || el.props?.url) attrs.push(`href="${el.props?.href || el.props?.url}"`);
    if (el.props?.placeholder) attrs.push(`placeholder="${el.props.placeholder}"`);
    if (el.props?.ariaLabel || el.props?.['aria-label']) attrs.push(`aria-label="${el.props.ariaLabel || el.props?.['aria-label']}"`);
    const style = this.elementInlineStyle(el);
    if (style) attrs.push(`style="${style}"`);
    return attrs.length ? ' ' + attrs.join(' ') : '';
  }

  private elementInlineStyle(el: any): string {
    const s = el.styles || {};
    return Object.entries(s)
      .filter(([_, v]) => v)
      .map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v}`)
      .join('; ');
  }

  private generateCss(elements: any[]): string {
    const styles: string[] = [];
    styles.push('/* Auto-generated by AI Wonderland Builder */');
    styles.push('* { box-sizing: border-box; margin: 0; padding: 0; }');
    styles.push('body { font-family: Inter, sans-serif; line-height: 1.6; color: #e2e8f0; background: #0a0a0a; }');
    styles.push('#app { max-width: 1200px; margin: 0 auto; padding: 2rem 1rem; }');
    elements.forEach((el) => {
      const s = el.styles || {};
      const cssRules = Object.entries(s)
        .filter(([_, v]) => v)
        .map(([k, v]) => `  ${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v};`)
        .join('\n');
      if (cssRules) {
        styles.push(`.block-${el.type}[data-name="${el.name}"] {\n${cssRules}\n}`);
      }
    });
    return styles.join('\n\n');
  }

  private elementToFileName(el: any, index: number): string | null {
    const name = el.name || el.type;
    return `${this.sanitizeFileName(name)}.html`;
  }

  private elementToCode(el: any): string {
    return `<!-- ${el.name} (${el.type}) -->
<div class="block-${el.type}" data-type="${el.type}" data-name="${el.name}">
  ${el.props?.content || el.props?.label || el.props?.title || ''}
</div>`;
  }

  private sanitizeFileName(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'element';
  }

  getFiles(): Map<string, string> {
    return new Map(this.cachedFiles);
  }

  getFileCount(): number {
    return this.cachedFiles.size;
  }

  stop(): void {
    for (const unsub of this.unsubs) unsub();
    this.unsubs = [];
  }
}

export const fileFolderManager = new FileFolderManager();
