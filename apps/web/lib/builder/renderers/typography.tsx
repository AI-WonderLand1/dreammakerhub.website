import type { BlockRenderer } from './types';
import { sanitizeBuilderHtml } from '@/lib/security/sanitize-html.client';

export const typographyRenderers: Record<string, BlockRenderer> = {
  'heading': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      const Tag = (el.props.level || 'h2') as any;
      return <Tag {...baseProps}>{el.props.content || 'Heading'}{children}</Tag>;
  },
  'paragraph': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <p {...baseProps}>{el.props.content}{children}</p>;
  },
  'rich-text': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      const safeContent = sanitizeBuilderHtml(el.props.content);
      return <div {...baseProps} dangerouslySetInnerHTML={{ __html: safeContent }} />;
  },
  'list': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      const ListTag = el.props.listType === 'ordered' ? 'ol' : 'ul';
      const items = (el.props.items as string[]) || [];
      return <ListTag {...baseProps}>{items.map((item, i) => <li key={i}>{item}</li>)}{children}</ListTag>;
  },
  'quote': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <blockquote {...baseProps}><p>{el.props.content}</p>{el.props.citation && <cite>— {el.props.citation}</cite>}{children}</blockquote>;
  },
  'code': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <pre {...baseProps}><code>{el.props.content}{children}</code></pre>;
  },
  'preformatted': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <pre {...baseProps}>{el.props.content}{children}</pre>;
  },
  'icon': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps} style={{ ...style, fontSize: el.props.size || '2rem' }}>{el.props.icon || '✨'}{children}</div>;
  },
  'badge': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      const badgeColors: Record<string, string> = { primary: '#7c3aed', success: '#22c55e', warning: '#f59e0b', danger: '#ef4444' };
      return <span {...baseProps} style={{ ...style, backgroundColor: badgeColors[el.props.variant] || badgeColors.primary }}>{el.props.content}{children}</span>;
  },
  'tooltip': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <span {...baseProps} style={{ ...style, borderBottom: '1px dashed rgba(255,255,255,0.3)' }}>{el.props.text}<span className="text-[9px] text-white/30 ml-1">ⓘ</span>{children}</span>;
  },
  'marquee': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps} style={{ ...style, overflow: 'hidden' }}><div className="animate-marquee">{el.props.content}{children}</div></div>;
  },
  'icon-list': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps}>{(el.props.items as any[] || []).map((item: any, i: number) => <div key={i} className="flex items-center gap-2 text-xs text-white/70 mb-1"><span>{item.icon}</span><span>{item.text}</span></div>)}{children}</div>;
  },
};
