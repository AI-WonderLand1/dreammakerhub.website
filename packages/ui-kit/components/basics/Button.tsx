import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { WonderProps } from '../../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Button: React.FC<WonderProps> = ({ id, content, style }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  
  const componentStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <button
      ref={setNodeRef}
      style={componentStyle}
      {...attributes}
      {...listeners}
      className={cn(
        "px-4 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-all backdrop-blur-md",
        style
      )}
    >
      {content || 'Button'}
    </button>
  );
};
