import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { WonderProps } from '../../types';
import { cn } from '../../lib/utils';

export const Blockquote: React.FC<WonderProps & { cite?: string }> = ({ id, content, style, cite }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  
  return (
    <blockquote
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      cite={cite}
      className={cn("border-l-4 border-slate-300 pl-4 italic text-slate-700 bg-white/10 backdrop-blur-md p-4 rounded-r-lg", style)}
    >
      <p>{content}</p>
      {cite && <cite className="block mt-2 text-sm text-slate-500">— {cite}</cite>}
    </blockquote>
  );
};
