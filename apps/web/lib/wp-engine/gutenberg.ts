import { CanvasElement, BlockDefinition } from '@/lib/builder/types';
import { BLOCKS } from '@/lib/builder/components/ComponentLibrary';

const BLOCK_NAME_MAP: Record<string, string> = {
  heading: 'core/heading',
  paragraph: 'core/paragraph',
  richText: 'core/paragraph',
  quote: 'core/quote',
  code: 'core/code',
  preformatted: 'core/preformatted',
  list: 'core/list',
  image: 'core/image',
  gallery: 'core/gallery',
  video: 'core/video',
  cover: 'core/cover',
  group: 'core/group',
  columns: 'core/columns',
  column: 'core/column',
  spacer: 'core/spacer',
  separator: 'core/separator',
  divider: 'core/separator',
  button: 'core/buttons',
  buttons: 'core/buttons',
  html: 'core/html',
  customHtml: 'core/html',
  shortcode: 'core/shortcode',
  embed: 'core/embed',
  map: 'core/embed',
  table: 'core/table',
  mediaText: 'core/media-text',
  file: 'core/file',
  audio: 'core/audio',
  search: 'core/search',
  social: 'core/social-links',
  verse: 'core/verse',
  pullquote: 'core/pullquote',
  latestPosts: 'core/latest-posts',
  category: 'core/categories',
  tag: 'core/tag-cloud',
};

const HIDDEN_TYPES = new Set([
  'meta-tags', 'schema-markup', 'ga-tracking', 'facebook-pixel', 'gtm', 'matomo',
  'login-form', 'register-form', 'password-reset', 'oauth-buttons',
  'toast', 'push-notification', 'cookie-consent', 'conditional',
  'php', 'shortcode', 'ai-image', 'ai-text', 'ai-chat', 'ai-translate',
  'ai-summarize', 'ai-code', 'ai-rewrite', 'ai-extract', 'custom-html',
]);

function blockType(el: CanvasElement): string {
  return BLOCK_NAME_MAP[el.type] || BLOCK_NAME_MAP[el.type.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] || 'core/group';
}

function attributesFor(el: CanvasElement): Record<string, any> {
  const attrs: Record<string, any> = { ...el.props };

  switch (el.type) {
    case 'heading':
      return { level: Number(String(el.props.level || 'h2').replace('h', '')) || 2, content: el.props.content || '', className: el.props.className };
    case 'paragraph':
      return { content: el.props.content || '', dropCap: !!el.props.dropCap, fontSize: el.props.size };
    case 'image':
      return { url: el.props.src || '', alt: el.props.alt || '', caption: el.props.caption || '' };
    case 'gallery':
      return { images: (el.props.images || []).map((src: string) => ({ url: src })), columns: el.props.columns || 3 };
    case 'video':
      return { src: el.props.src || '', caption: el.props.caption || '' };
    case 'button':
    case 'buttons':
      return { text: el.props.label || 'Button', url: el.props.url || '#', style: { color: { background: el.styles.backgroundColor } } };
    case 'list':
      return { ordered: el.props.listType === 'ordered', values: el.props.items || [] };
    case 'quote':
      return { value: el.props.content || '', citation: el.props.citation || '' };
    case 'columns':
      return { columns: el.children?.length || 2 };
    case 'spacer':
      return { height: el.props.height || '100px' };
    case 'separator':
    case 'divider':
      return {};
    case 'cover':
      return { url: el.props.src || '', dimRatio: 40, minHeight: el.props.minHeight || '430px', content: el.props.content || '' };
    case 'html':
    case 'customHtml':
      return { content: el.props.html || '' };
    case 'embed':
      return { url: el.props.src || el.props.url || '' };
    default:
      return attrs;
  }
}

export function elementToGutenbergBlock(el: CanvasElement, depth = 0): string {
  if (HIDDEN_TYPES.has(el.type)) return '';

  const name = blockType(el);
  const attrs = attributesFor(el);
  const innerBlocks = (el.children || [])
    .map((child) => elementToGutenbergBlock(child, depth + 1))
    .filter(Boolean)
    .join('');

  const open = `<!-- wp:${name} ${JSON.stringify(attrs)} -->`;
  const close = `<!-- /wp:${name} -->`;
  const selfClosing = innerBlocks === '' && !el.children?.length
    ? `${open}\n${close}`
    : `${open}\n${innerBlocks}${close}`;

  if (depth === 0 && !el.children?.length) {
    return selfClosing + '\n';
  }
  return selfClosing;
}

export function elementsToGutenbergContent(elements: CanvasElement[]): string {
  return elements.map((el) => elementToGutenbergBlock(el)).join('\n');
}

export function elementsToWPHtml(elements: CanvasElement[]): string {
  const blocks = elements.map((el) => elementToGutenbergBlock(el)).filter(Boolean).join('\n');
  return `<!-- wp:html -->\n<main id="main-content">\n${blocks}\n</main>\n<!-- /wp:html -->`;
}

export interface WPSerializeResult {
  gutenberg: string;
  html: string;
  blockCount: number;
}

export function serializeToWP(elements: CanvasElement[]): WPSerializeResult {
  const gutenberg = elementsToGutenbergContent(elements);
  return {
    gutenberg,
    html: elementsToWPHtml(elements),
    blockCount: elements.length,
  };
}

export function findBlockDefinition(type: string): BlockDefinition | undefined {
  return BLOCKS.find((b) => b.type === type);
}

export function blockToCanvasElement(def: BlockDefinition): CanvasElement {
  return {
    id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: def.type,
    name: def.name,
    icon: def.icon,
    props: JSON.parse(JSON.stringify(def.defaultProps || {})),
    styles: JSON.parse(JSON.stringify(def.defaultStyles || {})),
  };
}
