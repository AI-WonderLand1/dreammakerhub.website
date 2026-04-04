import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { WonderProps } from '../../types';
import { cn } from '../../lib/utils';

export const Link: React.FC<WonderProps & { href: string }> = ({ id, content, href, style }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  
  return (
    <a
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      href={href}
      className={cn("text-slate-800 hover:underline", style)}
    >
      {content}
    </a>
  );
};
