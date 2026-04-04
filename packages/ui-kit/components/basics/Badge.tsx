import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { WonderProps } from '../../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Badge: React.FC<WonderProps> = ({ id, content, style }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  
  const componentStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <span
      ref={setNodeRef}
      style={componentStyle}
      {...attributes}
      {...listeners}
      className={cn(
        "px-2 py-1 rounded-full bg-slate-200 text-slate-800 text-xs font-medium backdrop-blur-md",
        style
      )}
    >
      {content || 'Badge'}
    </span>
  );
};
