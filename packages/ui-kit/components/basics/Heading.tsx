import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { WonderProps } from '../../types';
import { cn } from '../../lib/utils'; // Assuming I need to create this or use a helper

// I need to create a utils file for cn
export const Heading: React.FC<WonderProps & { level: 2 | 3 | 4 | 5 | 6 }> = ({ id, content, style, level }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const Tag = `h${level}` as React.ElementType;
  
  return (
    <Tag
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={cn("font-bold text-slate-900", level === 2 && "text-3xl", level === 3 && "text-2xl", level === 4 && "text-xl", level === 5 && "text-lg", level === 6 && "text-base", style)}
    >
      {content}
    </Tag>
  );
};
