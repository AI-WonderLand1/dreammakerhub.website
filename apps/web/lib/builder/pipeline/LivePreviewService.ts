import { getEventBus } from './EventBus';
import { EventNames, type EventPayload, type PreviewUpdatedPayload } from './types';
import { useBuilderStore } from '../store';
import { logger } from '@/lib/logger';

export class LivePreviewService {
  private bus = getEventBus();
  private unsubs: Array<() => void> = [];
  private previewIframe: HTMLIFrameElement | null = null;
  private lastPreview: PreviewUpdatedPayload | null = null;
  private updateCount = 0;

  start(): void {
    // Update preview when validation passes
    this.unsubs.push(
      this.bus.on(EventNames.VALIDATION_COMPLETED, (event) => {
        const { passed } = event.payload as EventPayload<typeof EventNames.VALIDATION_COMPLETED>;
        if (passed) {
          this.updatePreview();
        }
      })
    );

    // Force reload on demand
    this.unsubs.push(
      this.bus.on(EventNames.PREVIEW_RELOAD, (event) => {
        const { full } = event.payload as EventPayload<typeof EventNames.PREVIEW_RELOAD>;
        if (full) {
          this.forceReload();
        } else {
          this.updatePreview();
        }
      })
    );
  }

  setPreviewIframe(iframe: HTMLIFrameElement | null): void {
    this.previewIframe = iframe;
  }

  private updatePreview(): void {
    const elements = useBuilderStore.getState().elements;
    const html = this.generateHtml(elements);
    const css = this.generateCss(elements);
    const js = '// AI Wonderland Builder\nconsole.log("Preview updated:", new Date().toISOString());';

    const payload: PreviewUpdatedPayload = {
      html,
      css,
      js,
      files: [
        { path: 'index.html', content: html },
        { path: 'styles.css', content: css },
      ],
    };

    this.lastPreview = payload;
    this.updateCount++;

    this.bus.emit(EventNames.PREVIEW_UPDATED, payload);
    this.renderPreview(payload);
  }

  private renderPreview(payload: PreviewUpdatedPayload): void {
    if (!this.previewIframe || !this.previewIframe.contentDocument) return;
    try {
      const doc = this.previewIframe.contentDocument;
      doc.open();
      doc.write(payload.html);
      doc.close();
    } catch (err) {
      logger.warn('[LivePreview] Could not render to iframe:', err);
    }
  }

  private forceReload(): void {
    if (!this.previewIframe) return;
    this.updatePreview();
  }

  private generateHtml(elements: any[]): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Live Preview — AI Wonderland Builder</title>
  <style>${this.generateCss(elements)}</style>
</head>
<body>
  <div id="app">
    ${elements.map((el) => this.renderEl(el, 1)).join('\n    ')}
  </div>
  <script>
    window.__BUILDER_PREVIEW__ = true;
    window.__ELEMENTS__ = ${JSON.stringify(elements)};
  <\/script>
</body>
</html>`;
  }

  private renderEl(el: any, depth: number): string {
    const indent = '  '.repeat(depth);
    const tag = this.elTag(el);
    const attrs = this.elAttrs(el);
    const content = el.props?.content || el.props?.label || el.props?.title || '';
    const html = el.props?.html || '';
    const children = el.children?.map((c: any) => this.renderEl(c, depth + 1)).join('\n' + indent) || '';

    if (html) return `${indent}<${tag}${attrs}>${html}</${tag}>`;
    if (children) return `${indent}<${tag}${attrs}>\n${children}\n${indent}</${tag}>`;
    if (['img', 'input', 'hr', 'br'].includes(tag)) return `${indent}<${tag}${attrs} />`;
    return `${indent}<${tag}${attrs}>${content || ''}</${tag}>`;
  }

  private elTag(el: any): string {
    const m: Record<string, string> = {
      heading: `h${el.props?.level?.replace('h', '') || '2'}`,
      paragraph: 'p', 'rich-text': 'div', list: el.props?.listType === 'ordered' ? 'ol' : 'ul',
      quote: 'blockquote', code: 'pre', 'custom-html': 'div', button: 'a',
      divider: 'hr', spacer: 'div', image: 'img', input: 'input',
      textarea: 'textarea', select: 'select', section: 'section',
      container: 'div', grid: 'div', columns: 'div', row: 'div', group: 'div',
    };
    return m[el.type] || 'div';
  }

  private elAttrs(el: any): string {
    const parts: string[] = [`id="${el.id}"`, `class="el-${el.type}"`];
    if (el.props?.alt) parts.push(`alt="${el.props.alt}"`);
    if (el.props?.src) parts.push(`src="${el.props.src}"`);
    if (el.props?.href || el.props?.url) parts.push(`href="${el.props.href || el.props.url}"`);
    if (el.props?.placeholder) parts.push(`placeholder="${el.props.placeholder}"`);
    if (el.props?.['aria-label']) parts.push(`aria-label="${el.props['aria-label']}"`);
    if (el.props?.required) parts.push('required');
    const s = el.styles || {};
    const styleStr = Object.entries(s)
      .filter(([_, v]) => v)
      .map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v}`)
      .join('; ');
    if (styleStr) parts.push(`style="${styleStr}"`);
    return parts.length ? ' ' + parts.join(' ') : '';
  }

  private generateCss(elements: any[]): string {
    const lines: string[] = [];
    lines.push('*, *::before, *::after { box-sizing: border-box; }');
    lines.push('body { margin: 0; font-family: Inter, system-ui, sans-serif; line-height: 1.6; background: #fff; color: #0f172a; }');
    lines.push('#app { max-width: 1200px; margin: 0 auto; padding: 2rem; }');
    lines.push('.el-heading { font-weight: 700; }');
    lines.push('.el-image { max-width: 100%; height: auto; border-radius: 0.5rem; }');
    lines.push('.el-button { display: inline-block; text-decoration: none; }');
    lines.push('@media (max-width: 768px) { #app { padding: 1rem; } }');
    return lines.join('\n');
  }

  getLastPreview(): PreviewUpdatedPayload | null {
    return this.lastPreview;
  }

  getUpdateCount(): number {
    return this.updateCount;
  }

  stop(): void {
    for (const unsub of this.unsubs) unsub();
    this.unsubs = [];
    this.previewIframe = null;
  }
}

export const livePreviewService = new LivePreviewService();
