import { getEventBus } from './EventBus';
import { EventNames } from './types';
import { useBuilderStore } from '../store';
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

    const js = `;(function(){window.__BUILDER_STATE__=${JSON.stringify({ elements, version: 1 })};if (process.env.NODE_ENV !== 'production') { console.log("[Builder] Project loaded",new Date().toISOString()); }})();`;
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
${elements.map((el) => renderEl(el, 1)).join('\n')}
  </div>
  <script>
    window.__BUILDER_STATE__ = ${JSON.stringify({ elements, version: 1 }, null, 2)};
  <\/script>
</body>
</html>`;
}

function renderEl(el: any, depth: number): string {
  const indent = '  '.repeat(depth);
  const tag = elTagGen(el);
  const attrs = elAttrsGen(el);
  const children = el.children?.map((c: any) => renderEl(c, depth + 1)).join('\n') || '';
  const content = el.props?.content || el.props?.label || '';
  const html = el.props?.html || '';

  if (html) return `${indent}<${tag}${attrs}>${html}</${tag}>`;
  if (children) return `${indent}<${tag}${attrs}>\n${children}\n${indent}</${tag}>`;
  if (content && !['img', 'input', 'hr', 'br'].includes(tag)) return `${indent}<${tag}${attrs}>${escapeHtml(content)}</${tag}>`;
  return `${indent}<${tag}${attrs} />`;
}

function elTagGen(el: any): string {
  const map: Record<string, string> = {
    heading: `h${el.props?.level?.replace('h', '') || '2'}`,
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

function elAttrsGen(el: any): string {
  const parts: string[] = [`id="${el.id}"`, `class="builder-el type-${el.type}"`];
  if (el.props?.alt) parts.push(`alt="${escapeHtml(el.props.alt)}"`);
  if (el.props?.src) parts.push(`src="${escapeHtml(el.props.src)}"`);
  if (el.props?.href || el.props?.url) parts.push(`href="${escapeHtml(el.props.href || el.props.url)}"`);
  if (el.props?.placeholder) parts.push(`placeholder="${escapeHtml(el.props.placeholder)}"`);
  if (el.props?.required) parts.push('required');
  if (el.props?.disabled) parts.push('disabled');
  if (el.props?.readonly) parts.push('readonly');
  if (el.props?.['aria-label']) parts.push(`aria-label="${escapeHtml(el.props['aria-label'])}"`);
  const style = inlineStyleGen(el.styles);
  if (style) parts.push(`style="${style}"`);
  return parts.length ? ' ' + parts.join(' ') : '';
}

function inlineStyleGen(s: Record<string, any>): string {
  if (!s) return '';
  return Object.entries(s).filter(([_, v]) => v != null && v !== '')
    .map(([k, v]) => `${camelToKebab(k)}: ${v}`).join('; ');
}

function generateFullCss(elements: any[]): string {
  const lines: string[] = [];
  lines.push('/* AI Wonderland Builder — Auto-generated */');
  lines.push('*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }');
  lines.push('body { font-family: Inter, system-ui, sans-serif; line-height: 1.6; -webkit-font-smoothing: antialiased; }');
  lines.push('#app { max-width: 1200px; margin: 0 auto; padding: 2rem 1rem; }');
  const seen = new Set<string>();
  for (const el of elements) collectStylesCssGen(el, lines, seen);
  lines.push('');
  lines.push('@media (max-width: 768px) { #app { padding: 1rem; } }');
  return lines.join('\n');
}

function collectStylesCssGen(el: any, lines: string[], seen: Set<string>): void {
  const s = el.styles;
  if (s && Object.keys(s).length > 0) {
    const key = `.type-${el.type}`;
    if (!seen.has(key)) {
      seen.add(key);
      const rules = Object.entries(s).filter(([_, v]) => v != null && v !== '')
        .map(([k, v]) => `  ${camelToKebab(k)}: ${v};`);
      if (rules.length > 0) { lines.push(''); lines.push(`${key} {`); lines.push(...rules); lines.push('}'); }
    }
  }
  if (el.children) for (const c of el.children) collectStylesCssGen(c, lines, seen);
}

function camelToKebab(s: string): string {
  return s.replace(/([A-Z])/g, '-$1').toLowerCase();
}

function escapeHtml(s: string): string {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export const codeGenerationService = new CodeGenerationService();
