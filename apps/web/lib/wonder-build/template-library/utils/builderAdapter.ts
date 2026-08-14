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
    case 'footer': return 'section';
    default: return 'container';
  }
}

function toProps(el: WonderBuildElement): Record<string, any> {
  const props: Record<string, any> = {};
  switch (el.type) {
    case 'heading':
      props.content = el.content ?? 'Heading';
      break;
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
      props.columns = 2;
      break;
    case 'nav':
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
    name: NAMES[type] || el.type,
    icon: ICONS[el.type] || '▪️',
    props: toProps(el),
    styles: (el.styles || {}) as CanvasElement['styles'],
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