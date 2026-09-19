import type { CanvasElement } from '@/lib/builder/types';
import type { WonderBuildElement, WonderBuildTemplate } from '../types';

const ICONS: Record<string, string> = {
  section: '📦',
  div: '▭',
  heading: '𝗛',
  text: '¶',
  button: '🔘',
  image: '🖼️',
  grid: '⊞',
  card: '▢',
  nav: '≡',
  footer: '⌄',
};

const NAMES: Record<string, string> = {
  section: 'Section',
  container: 'Container',
  heading: 'Heading',
  paragraph: 'Paragraph',
  button: 'Button',
  image: 'Image',
  columns: 'Columns',
  card: 'Card',
  navbar: 'Navbar',
};

function mapType(t: WonderBuildElement['type']): string {
  switch (t) {
    case 'section': return 'section';
    case 'div': return 'container';
    case 'heading': return 'heading';
    case 'text': return 'paragraph';
    case 'button': return 'button';
    case 'image': return 'image';
    case 'grid': return 'columns';
    case 'card': return 'card';
    case 'nav': return 'navbar';
    // Preserve nesting in the existing section renderer. The semantic footer
    // marker is rendered as <footer> by the editor and the published output.
    case 'footer': return 'section';
    default: return 'container';
  }
}

function gridColumnCount(el: WonderBuildElement): number {
  const template = String(el.styles?.gridTemplateColumns || '');
  const repeatMatch = template.match(/repeat\(\s*(\d+)/i);
  if (!repeatMatch) return 2;
  const parsed = Number.parseInt(repeatMatch[1], 10);
  return Number.isFinite(parsed) ? Math.min(12, Math.max(1, parsed)) : 2;
}

function toProps(el: WonderBuildElement): Record<string, any> {
  const props: Record<string, any> = {};
  switch (el.type) {
    case 'heading': {
      props.content = el.content ?? 'Heading';
      // The template thumbnail selects a heading tag from font size. Use the
      // same rule when opening that template in the real builder.
      const size = typeof el.styles?.fontSize === 'number'
        ? el.styles.fontSize
        : typeof el.styles?.fontSize === 'string'
          ? Number.parseFloat(el.styles.fontSize)
          : 0;
      props.level = size > 28 ? 'h1' : size > 20 ? 'h2' : 'h3';
      break;
    }
    case 'text':
      props.content = el.content ?? '';
      break;
    case 'button':
      props.label = el.content ?? 'Button';
      if (el.href) props.url = el.href;
      break;
    case 'image':
      if (el.src) props.src = el.src;
      if (el.alt) props.alt = el.alt;
      break;
    case 'grid':
      props.columns = gridColumnCount(el);
      break;
    case 'div':
      // Native builder containers add max-width and auto margins. Imported
      // template divs must retain their authored layout instead.
      props.preserveTemplateLayout = true;
      break;
    case 'footer':
      props.semanticTag = 'footer';
      break;
    case 'nav':
      // These props remain as a fallback for native navbar blocks. Imported
      // WonderBuild navs keep their original child tree and the renderer now
      // prefers that tree, avoiding duplicated synthetic navigation content.
      props.logo = 'Brand';
      props.links = (el.children || []).map((c, i) => ({ id: `l${i}`, label: c.content || `Link ${i + 1}` }));
      break;
    default:
      break;
  }
  return props;
}

function visit(el: WonderBuildElement, ctx: { tplId: string; parent: string }, index: number): CanvasElement {
  const type = mapType(el.type);
  const children = el.children
    ? el.children.map((c, i) => visit(c, { tplId: ctx.tplId, parent: `${ctx.parent}-${index}` }, i))
    : undefined;
  return {
    id: `${ctx.tplId}__${ctx.parent}-${index}`,
    type,
    name: el.type === 'footer' ? 'Footer' : NAMES[type] || el.type,
    icon: ICONS[el.type] || '▪️',
    props: toProps(el),
    // Template preview defaults grid elements to CSS grid. Without this,
    // imported grids silently become block layouts in the real editor.
    styles: {
      ...(el.type === 'grid' && !el.styles?.display ? { display: 'grid' } : {}),
      ...(el.styles || {}),
    } as CanvasElement['styles'],
    children,
  };
}

export function templateToCanvasElements(tpl: WonderBuildTemplate): CanvasElement[] {
  const tplId = (tpl.id || 'template').replace(/[^a-zA-Z0-9_-]/g, '-');
  return (tpl.elements || []).map((el, i) => visit(el, { tplId, parent: 'el' }, i));
}

export function buildBuilderStatePayload(tpl: WonderBuildTemplate): string {
  return JSON.stringify(
    {
      version: 1,
      elements: templateToCanvasElements(tpl),
      theme: {},
      activeBreakpoint: 'desktop',
      zoom: 1,
      pan: { x: 0, y: 0 },
      showGrid: true,
      snapToGrid: true,
    },
    null,
    2
  );
}
