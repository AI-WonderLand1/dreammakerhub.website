import type { BlockRenderer } from './types';

export const formsRenderers: Record<string, BlockRenderer> = {
  'button': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <a {...baseProps} href={el.props.url || '#'} style={{ ...style, textDecoration: 'none' }}>{el.props.label || 'Button'}{children}</a>;
  },
  'buttons': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return (
        <div {...baseProps}>
          {(el.props.buttons as any[])?.map((btn: any, i: number) => (
            <span key={i} style={{
              backgroundColor: btn.variant === 'primary' ? '#7c3aed' : btn.variant === 'secondary' ? 'transparent' : 'transparent',
              color: btn.variant === 'outline' ? '#7c3aed' : '#fff',
              border: btn.variant === 'outline' ? '1px solid #7c3aed' : 'none',
              padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 600,
            }}>{btn.label}</span>
          ))}
          {children}
        </div>
      );
  },
  'input': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps}><label className="block text-xs text-white/50 mb-1">{el.props.label}</label><input type={el.props.type || 'text'} placeholder={el.props.placeholder} className="w-full rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-white" /></div>;
  },
  'checkbox': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><input type="checkbox" checked={el.props.checked || false} readOnly /><span className="text-xs text-white/70">{el.props.label}</span>{children}</div>;
  },
  'radio': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps}><p className="text-xs text-white/50 mb-1">{el.props.label}</p>{(el.props.options as string[] || []).map((o: string, i: number) => <label key={i} className="flex items-center gap-2 text-xs text-white/60"><input type="radio" name={el.id} defaultChecked={i === 0} />{o}</label>)}{children}</div>;
  },
  'search': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps} style={{ display: 'flex', gap: '0.5rem' }}><input type="text" placeholder={el.props.placeholder || 'Search...'} className="flex-1 rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-white" /><button className="rounded bg-purple-600 text-white px-2 text-xs">{el.props.buttonText || '🔍'}</button>{children}</div>;
  },
  'product-search': ({ el, selectedId, selectElement, baseProps, style, children }) => {
      return <div {...baseProps} style={{ display: 'flex', gap: '0.5rem' }}><input type="text" placeholder={el.props.placeholder || 'Search...'} className="flex-1 rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-white" /><button className="rounded bg-purple-600 text-white px-2 text-xs">{el.props.buttonText || '🔍'}</button>{children}</div>;
  },
};
