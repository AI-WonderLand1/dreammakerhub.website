import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { WonderProps } from '../../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Grid: React.FC<WonderProps> = ({ id, style, config, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  
  const componentStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={componentStyle}
      {...attributes}
      {...listeners}
      className={cn(
        "grid gap-4",
        config?.cols ? `grid-cols-${config.cols}` : "grid-cols-1",
        style
      )}
    >
      {children}
    </div>
  );
};
