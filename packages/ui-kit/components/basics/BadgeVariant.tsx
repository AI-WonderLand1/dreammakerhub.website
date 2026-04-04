import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { WonderProps } from '../../types';
import { cn } from '../../lib/utils';

export const BadgeVariant: React.FC<WonderProps & { variant: 'success' | 'warning' | 'error' | 'info' }> = ({ id, content, variant, style }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  
  const colors = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  };

  return (
    <span
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={cn("px-2 py-1 rounded-full text-xs font-medium backdrop-blur-md", colors[variant], style)}
    >
      {content}
    </span>
  );
};
