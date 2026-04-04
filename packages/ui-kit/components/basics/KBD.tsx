import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { WonderProps } from '../../types';
import { cn } from '../../lib/utils';

export const KBD: React.FC<WonderProps> = ({ id, content, style }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  
  return (
    <kbd
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={cn("px-2 py-1 bg-slate-100 border border-slate-300 rounded text-xs font-mono", style)}
    >
      {content}
    </kbd>
  );
};
