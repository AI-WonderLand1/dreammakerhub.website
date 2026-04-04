import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { WonderProps } from '../../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Typography: React.FC<WonderProps> = ({ id, content, style, config }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  
  const componentStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const Tag = config?.tag || 'p';

  return (
    <Tag
      ref={setNodeRef}
      style={componentStyle}
      {...attributes}
      {...listeners}
      className={cn(
        "text-slate-900",
        Tag === 'h1' && "text-4xl font-bold",
        Tag === 'p' && "text-base",
        style
      )}
    >
      {content || 'Typography'}
    </Tag>
  );
};
