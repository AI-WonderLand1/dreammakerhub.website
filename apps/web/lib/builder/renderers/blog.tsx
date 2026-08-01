import type { BlockRenderer } from './types';

export const blogRenderers: Record<string, BlockRenderer> = {
  'faq': ({ el, selectedId, selectElement, baseProps, children }) => {
      const accItems = (el.props.items as any[]) || [];
      return (
        <div {...baseProps} role="region" aria-label={el.props.title || 'Accordion'}>
          {accItems.map((item: any, i: number) => (
            <AccordionItem key={i} title={item.q || item.title} content={item.a || item.content} />
          ))}
        </div>
      );
  },
  'step': ({ el, selectedId, selectElement, baseProps, children }) => {

  },
  'steps': ({ el, selectedId, selectElement, baseProps, children }) => {
      return <div {...baseProps}><div className="flex gap-4">{(el.props.steps as any[] || []).map((s: any, i: number) => <div key={i} className="flex-1 text-center"><div className="w-8 h-8 rounded-full bg-purple-600/30 text-purple-400 flex items-center justify-center mx-auto text-sm font-bold">{i + 1}</div><p className="text-xs font-medium mt-1">{s.title}</p><p className="text-[10px] text-white/40">{s.desc}</p></div>)}</div>{children}</div>;
  },
  'author-box': ({ el, selectedId, selectElement, baseProps, children }) => {
      return <div {...baseProps} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}><div className="w-12 h-12 rounded-full bg-white/10 shrink-0" /><div><p className="text-sm font-semibold">{el.props.name}</p><p className="text-[10px] text-white/40">{el.props.role}</p><p className="text-xs text-white/50 mt-1">{el.props.bio}</p></div>{children}</div>;
  },
};
