import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { WonderProps } from '../../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Input: React.FC<WonderProps> = ({ id, content, style }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  
  const componentStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <input
      ref={setNodeRef}
      style={componentStyle}
      {...attributes}
      {...listeners}
      placeholder={content || 'Enter text...'}
      className={cn(
        "px-4 py-2 rounded-lg border border-slate-300 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-slate-400",
        style
      )}
    />
  );
};
