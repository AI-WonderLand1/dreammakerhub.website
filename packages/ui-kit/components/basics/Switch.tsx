import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { WonderProps } from '../../types';
import { cn } from '../../lib/utils';

export const Switch: React.FC<WonderProps> = ({ id, style }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  
  return (
    <button
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={cn("w-12 h-6 bg-slate-200 rounded-full p-1 transition-colors duration-200 ease-in-out", style)}
    >
      <div className="w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200" />
    </button>
  );
};
