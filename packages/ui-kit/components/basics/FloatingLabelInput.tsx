import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { WonderProps } from '../../types';
import { cn } from '../../lib/utils';

export const FloatingLabelInput: React.FC<WonderProps> = ({ id, content, style }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={cn("relative", style)}
    >
      <input
        type="text"
        placeholder=" "
        className="peer w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
      />
      <label className="absolute left-4 -top-2.5 bg-white px-1 text-sm text-slate-500 transition-all peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-base peer-focus:-top-2.5 peer-focus:text-sm">
        {content || 'Label'}
      </label>
    </div>
  );
};
