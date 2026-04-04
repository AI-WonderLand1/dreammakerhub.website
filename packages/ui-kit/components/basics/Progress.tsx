import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { WonderProps } from '../../types';
import { cn } from '../../lib/utils';

export const Progress: React.FC<WonderProps & { value: number }> = ({ id, value, style }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={cn("w-full h-2 bg-slate-200 rounded-full overflow-hidden", style)}
    >
      <div className="h-full bg-slate-800 transition-all duration-300" style={{ width: `${value}%` }} />
    </div>
  );
};
