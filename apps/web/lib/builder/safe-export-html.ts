/** Shared HTML-export rules for the code preview and file publisher.
 * Keep generated HTML attributes, links and CSS inert even when builder state is
 * user-authored or imported from an untrusted project.
 */

export function escapeExportHtml(value: unknown): string {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

type UrlKind = 'link' | 'image';

export function safeExportUrl(value: unknown, kind: UrlKind): string {
  if (typeof value !== 'string' || !value) return '';
  const url = value.trim();
  if (!url || /[\s\\\x00-\x1f\x7f]/u.test(url) || url.startsWith('//')) return '';

  // Base64-encoded bitmap images are supported; SVG and HTML data documents
  // are deliberately prohibited in exported content.
  if (kind === 'image' &&
      /^data:image\/(?:png|jpeg|webp|gif|avif);base64,[A-Za-z0-9+/]+={0,2}$/i.test(url)) return url;

  if (/^https?:\/\//i.test(url)) {
    try {
      const parsed = new URL(url);
      return (parsed.protocol === 'https:' || parsed.protocol === 'http:') &&
        parsed.hostname && !parsed.username && !parsed.password ? url : '';
    } catch { return ''; }
  }

  if (kind === 'link' && /^mailto:[^@/?#\s]+@[^@/?#\s]+$/i.test(url)) return url;
  if (kind === 'link' && /^tel:[+0-9()#*.-]+$/i.test(url)) return url;

  // Protocol-relative URLs and any other colon (even malformed schemes) are
  // not accepted. Relative links and assets remain valid.
  if (url.includes(':') || url.startsWith('\\')) return '';
  if (url.startsWith('#') || url.startsWith('?') || url.startsWith('/') ||
      url.startsWith('./') || url.startsWith('../') ||
      /^[\p{L}\p{N}_-]/u.test(url)) return url;
  return '';
}

export function safeClassToken(value: unknown): string {
  return String(value ?? 'element').toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '') || 'element';
}

export function elementScopeClass(path: readonly number[]): string {
  return 'aw-scope-' + path.join('-');
}

/** Keeps legitimate colors, lengths, gradients and font declarations without
 * accepting CSS declaration escapes, rule breaks, imports, or network URLs. */
export function safeCssDeclarations(styles: unknown): string[] {
  if (!styles || typeof styles !== 'object' || Array.isArray(styles)) return [];
  const declarations: string[] = [];
  for (const [name, raw] of Object.entries(styles)) {
    if (typeof raw !== 'string' && typeof raw !== 'number') continue;
    const property = name.startsWith('--')
      ? name
      : name.replace(/([A-Z])/g, '-$1').toLowerCase();
    if (!/^(?:--[a-zA-Z0-9_-]+|-?[a-z][a-z0-9-]*)$/.test(property) ||
        /^(?:behavior|-moz-binding)$/i.test(property)) continue;
    const value = String(raw).trim();
    if (!value || /[;{}<>\\\x00-\x1f\x7f]/.test(value) ||
        /\/\*|\*\//.test(value) ||
        /(?:url|expression|image-set|-webkit-image-set)\s*\(/i.test(value) ||
        /@(?:import|charset|namespace)/i.test(value)) continue;
    declarations.push(property + ': ' + value);
  }
  return declarations;
}

export function safeExportAttributes(
  el: { id?: unknown; type?: unknown; props?: Record<string, unknown>; styles?: unknown },
  path: readonly number[],
  variant: 'files' | 'preview',
): string {
  const type = safeClassToken(el.type);
  const classes = variant === 'files'
    ? ['builder-block', 'block-' + type, elementScopeClass(path)]
    : ['builder-el', 'type-' + type, elementScopeClass(path)];
  const attr = (key: string, value: unknown) => key + '="' + escapeExportHtml(value) + '"';
  const parts = [attr('id', el.id ?? ''), attr('class', classes.join(' '))];
  if (variant === 'files') parts.push(attr('data-type', el.type ?? ''));
  const props = el.props || {};
  if (typeof props.alt === 'string') parts.push(attr('alt', props.alt));
  const imageUrl = safeExportUrl(props.src, 'image');
  if (imageUrl) parts.push(attr('src', imageUrl));
  const linkUrl = safeExportUrl(props.href || props.url, 'link');
  if (linkUrl) parts.push(attr('href', linkUrl));
  if (typeof props.placeholder === 'string' && variant === 'preview')
    parts.push(attr('placeholder', props.placeholder));
  if (props.required && variant === 'preview') parts.push('required');
  if (props.disabled && variant === 'preview') parts.push('disabled');
  if (props.readonly && variant === 'preview') parts.push('readonly');
  if (typeof props['aria-label'] === 'string') parts.push(attr('aria-label', props['aria-label']));
  const style = safeCssDeclarations(el.styles).join('; ');
  if (style) parts.push(attr('style', style));
  return ' ' + parts.join(' ');
}

export function exportCssRule(el: { styles?: unknown }, path: readonly number[]): string {
  const rules = safeCssDeclarations(el.styles);
  return rules.length ? '\n.' + elementScopeClass(path) + ' {\n' +
    rules.map(rule => '  ' + rule + ';').join('\n') + '\n}' : '';
}
