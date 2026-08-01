'use client';
import { useMemo } from 'react';
import { BLOCKS } from '@/lib/builder/blocks';
import { EditableProp } from '@/lib/builder/types';
import { useWpEditorStore } from '@/lib/wp-engine/editor-store';

function Field({ prop, value, onChange }: { prop: EditableProp; value: any; onChange: (v: any) => void }) {
  const labelCls = 'mb-1 block text-[10px] font-semibold uppercase tracking-wider text-white/40';
  const inputCls =
    'w-full rounded-md border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white outline-none focus:border-purple-500';

  switch (prop.type) {
    case 'toggle':
      return (
        <label className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-white/60">{prop.label}</span>
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 accent-purple-600"
          />
        </label>
      );
    case 'select':
      return (
        <div>
          <label className={labelCls}>{prop.label}</label>
          <select className={inputCls} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
            {(prop.options || []).map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      );
    case 'color':
      return (
        <div>
          <label className={labelCls}>{prop.label}</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={value || '#000000'}
              onChange={(e) => onChange(e.target.value)}
              className="h-8 w-10 shrink-0 cursor-pointer rounded border border-white/10 bg-transparent"
            />
            <input className={inputCls} value={value || ''} onChange={(e) => onChange(e.target.value)} />
          </div>
        </div>
      );
    case 'textarea':
      return (
        <div>
          <label className={labelCls}>{prop.label}</label>
          <textarea
            className={`${inputCls} min-h-[72px] resize-y`}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      );
    case 'range':
      return (
        <div>
          <label className={labelCls}>
            {prop.label} <span className="text-white/30">({value})</span>
          </label>
          <input
            type="range"
            min={0}
            max={20}
            value={Number(value) || 0}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full accent-purple-600"
          />
        </div>
      );
    case 'number':
      return (
        <div>
          <label className={labelCls}>{prop.label}</label>
          <input
            type="number"
            className={inputCls}
            value={value ?? ''}
            onChange={(e) => onChange(Number(e.target.value))}
          />
        </div>
      );
    case 'image':
    case 'video':
    case 'font':
    case 'text':
    default:
      return (
        <div>
          <label className={labelCls}>{prop.label}</label>
          <input className={inputCls} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
        </div>
      );
  }
}

const STYLE_FIELDS: { key: string; label: string; type: 'text' | 'color' | 'number' }[] = [
  { key: 'padding', label: 'Padding', type: 'text' },
  { key: 'margin', label: 'Margin', type: 'text' },
  { key: 'backgroundColor', label: 'Background', type: 'color' },
  { key: 'color', label: 'Text Color', type: 'color' },
  { key: 'fontSize', label: 'Font Size', type: 'text' },
  { key: 'fontWeight', label: 'Font Weight', type: 'text' },
  { key: 'textAlign', label: 'Text Align', type: 'text' },
  { key: 'borderRadius', label: 'Radius', type: 'text' },
  { key: 'border', label: 'Border', type: 'text' },
  { key: 'maxWidth', label: 'Max Width', type: 'text' },
];

function StyleField({
  field,
  value,
  onChange,
}: {
  field: (typeof STYLE_FIELDS)[number];
  value: any;
  onChange: (v: any) => void;
}) {
  const labelCls = 'mb-1 block text-[10px] font-semibold uppercase tracking-wider text-white/40';
  const inputCls =
    'w-full rounded-md border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white outline-none focus:border-purple-500';

  if (field.type === 'color') {
    return (
      <div>
        <label className={labelCls}>{field.label}</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={value || '#000000'}
            onChange={(e) => onChange(e.target.value)}
            className="h-8 w-10 shrink-0 cursor-pointer rounded border border-white/10 bg-transparent"
          />
          <input className={inputCls} value={value || ''} onChange={(e) => onChange(e.target.value)} />
        </div>
      </div>
    );
  }
  return (
    <div>
      <label className={labelCls}>{field.label}</label>
      <input className={inputCls} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export function BlockInspector() {
  const selectedId = useWpEditorStore((s) => s.selectedId);
  const elements = useWpEditorStore((s) => s.elements);
  const updateProps = useWpEditorStore((s) => s.updateProps);
  const updateStyles = useWpEditorStore((s) => s.updateStyles);
  const rightOpen = useWpEditorStore((s) => s.rightOpen);
  const setRightOpen = useWpEditorStore((s) => s.setRightOpen);

  const element = useMemo(() => elements.find((el) => el.id === selectedId) || null, [elements, selectedId]);
  const definition = useMemo(
    () => (element ? BLOCKS.find((b) => b.type === element.type) : undefined),
    [element]
  );

  if (!rightOpen) return null;

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-l border-white/10 bg-[#0b0f19] text-white">
      <div className="flex shrink-0 items-center justify-between border-b border-white/10 p-3">
        <h3 className="text-xs uppercase tracking-wider text-purple-400 font-bold">Inspector</h3>
        <button onClick={() => setRightOpen(false)} className="text-white/30 hover:text-white/70 text-xs px-1">
          ✕
        </button>
      </div>

      {!element ? (
        <div className="flex flex-1 items-center justify-center p-6 text-center">
          <p className="text-xs text-white/30">Select a block on the canvas to edit its settings.</p>
        </div>
      ) : (
        <div className="flex-1 space-y-6 overflow-y-auto p-3">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-white/70">
              <span className="text-base">{element.icon}</span> {element.name}
            </p>
            <p className="text-[10px] text-white/30">
              {definition?.description || `Type: ${element.type}`}
            </p>
          </div>

          {definition?.editableProps?.length ? (
            <section className="space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Content</h4>
              {definition.editableProps.map((prop) => (
                <Field
                  key={prop.key}
                  prop={prop}
                  value={element.props?.[prop.key]}
                  onChange={(v) => updateProps(element.id, { [prop.key]: v })}
                />
              ))}
            </section>
          ) : null}

          <section className="space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Styles</h4>
            {STYLE_FIELDS.map((field) => (
              <StyleField
                key={field.key}
                field={field}
                value={(element.styles as Record<string, any>)?.[field.key]}
                onChange={(v) => updateStyles(element.id, { [field.key]: v })}
              />
            ))}
          </section>
        </div>
      )}
    </aside>
  );
}
