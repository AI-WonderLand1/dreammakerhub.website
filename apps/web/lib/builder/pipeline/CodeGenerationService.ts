import { getEventBus } from './EventBus';
import { EventNames } from './types';
import { useBuilderStore } from '../store';
import { normalizeHeadingLevel } from '../heading-level';
import { imageBlockHtml } from '../image-block-html';
import { escapeExportHtml, exportCssRule, safeExportAttributes } from '../safe-export-html';
import { logger } from '@/lib/logger';

export class CodeGenerationService {
  private bus = getEventBus();
  private unsubs: Array<() => void> = [];
  private generationCount = 0;
  private pendingEmit: ReturnType<typeof setTimeout> | null = null;

  start(): void {
    this.unsubs.push(
      this.bus.on(EventNames.VALIDATION_COMPLETED, (event) => {
        const { passed } = event.payload;
        if (passed) {
          this.schedulePreviewEmit();
        }
      })
    );
    this.unsubs.push(
      this.bus.on(EventNames.PROJECT_STATE_CHANGED, (event) => {
        const { elements } = event.payload;
        this.generationCount++;
        this.bus.emit(EventNames.CODE_GENERATION_STARTED, {
          elementIds: elements.map((e: any) => e.id),
        }, { batch: true });
      })
    );
  }

  private schedulePreviewEmit(): void {
    if (this.pendingEmit) return;
    this.pendingEmit = setTimeout(() => {
      this.pendingEmit = null;
      this.emitPreviewUpdate();
    }, 50);
  }

  private emitPreviewUpdate(): void {
    const elements = useBuilderStore.getState().elements;
    const html = generateFullHtml(elements);
    const css = generateFullCss(elements);

    const js = getBuilderStateBootstrapJs();
    const payload = {
      html, css, js,
      files: [
        { path: 'index.html', content: html },
        { path: 'styles.css', content: css },
      ],
    };

    this.bus.emit(EventNames.PREVIEW_UPDATED, payload);
    logger.info(`[CodeGen] Preview emitted (${elements.length} elements)`);
  }

  getGenerationCount(): number { return this.generationCount; }

  stop(): void {
    if (this.pendingEmit) {
      clearTimeout(this.pendingEmit);
      this.pendingEmit = null;
    }
    for (const unsub of this.unsubs) unsub();
    this.unsubs = [];
  }
}

function generateFullHtml(elements: any[]): string {
  const serializedState = escapeExportHtml(JSON.stringify({ elements, version: 1 }));

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AI Wonderland Project</title>
  <style>${generateFullCss(elements)}</style>
</head>
<body>
  <div id="app">
${elements.map((el, i) => renderEl(el, 1, [i])).join('\n')}
  </div>
  <textarea id="builder-state-data" hidden aria-hidden="true">${serializedState}</textarea>
  <script>
    ${getBuilderStateBootstrapJs()}
  <\/script>
</body>
</html>`;
}

function getBuilderStateBootstrapJs(): string {
  return `;(function(){
    var stateNode = document.getElementById("builder-state-data");
    var fallback = { elements: [], version: 1 };
    try {
      window.__BUILDER_STATE__ = stateNode
        ? JSON.parse(stateNode.value || "{}")
        : fallback;
    } catch {
      window.__BUILDER_STATE__ = fallback;
    }
  })();`;
}

function renderEl(el: any, depth: number, path: number[]): string {
  const indent = '  '.repeat(depth);
  const tag = elTagGen(el);
  const attrs = safeExportAttributes(el, path, 'preview');
  const children = el.children?.map((c: any, i: number) => renderEl(c, depth + 1, [...path, i])).join('\n') || '';
  const content = el.props?.content || el.props?.label || '';
  const html = el.props?.html || '';

  const imageContent = imageBlockHtml(el.type, el.props || {});
  if (imageContent !== null) return `${indent}<${tag}${attrs}>${imageContent}${children}</${tag}>`;

  // Untrusted custom HTML is displayed as text unless processed by a separate
  // vetted rich-HTML sanitizer. Raw markup must not execute in previews.
  if (html) return `${indent}<${tag}${attrs}>${escapeExportHtml(html)}</${tag}>`;
  if (children) return `${indent}<${tag}${attrs}>\n${children}\n${indent}</${tag}>`;
  if (content && !['img', 'input', 'hr', 'br'].includes(tag)) return `${indent}<${tag}${attrs}>${escapeExportHtml(content)}</${tag}>`;
  return `${indent}<${tag}${attrs} />`;
}

function elTagGen(el: any): string {
  const map: Record<string, string> = {
    heading: normalizeHeadingLevel(el.props?.level),
    paragraph: 'p', 'rich-text': 'div', list: el.props?.listType === 'ordered' ? 'ol' : 'ul',
    quote: 'blockquote', code: 'pre', 'custom-html': 'div', image: 'img', video: 'div',
    button: 'a', divider: 'hr', spacer: 'div', input: 'input', textarea: 'textarea',
    select: 'select', checkbox: 'label', radio: 'fieldset', toggle: 'label',
    'contact-form': 'form', newsletter: 'form', 'wp-login': 'form',
    'wp-menu': 'nav', 'wp-breadcrumbs': 'nav', pagination: 'nav',
    'back-to-top': 'a', section: 'section', container: 'div', columns: 'div',
    row: 'div', group: 'div', grid: 'div', flex: 'div', table: 'table',
    'icon-list': 'ul', steps: 'div', faq: 'div', accordion: 'div', tabs: 'div',
    'product-card': 'div', 'product-grid': 'div', 'add-to-cart': 'button',
    'author-box': 'div', 'logo-cloud': 'div', 'team-grid': 'div',
    hero: 'section', cta: 'section', modal: 'div', card: 'div',
  };
  return map[el.type] || 'div';
}

function generateFullCss(elements: any[]): string {
  const lines: string[] = [];
  lines.push('/* AI Wonderland Builder — Auto-generated */');
  lines.push('*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }');
  lines.push('body { font-family: Inter, system-ui, sans-serif; line-height: 1.6; -webkit-font-smoothing: antialiased; }');
  lines.push('#app { max-width: 1200px; margin: 0 auto; padding: 2rem 1rem; }');
  for (const [i, el] of elements.entries()) collectStylesCssGen(el, lines, [i]);
  lines.push('');
  lines.push('@media (max-width: 768px) { #app { padding: 1rem; } }');
  return lines.join('\n');
}

function collectStylesCssGen(el: any, lines: string[], path: number[]): void {
  const rule = exportCssRule(el, path);
  if (rule) lines.push(rule);
  if (Array.isArray(el.children)) {
    el.children.forEach((child: any, i: number) => collectStylesCssGen(child, lines, [...path, i]));
  }
}

export const codeGenerationService = new CodeGenerationService();
