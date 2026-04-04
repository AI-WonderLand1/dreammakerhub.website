import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { WonderProps } from '../../types';
import { cn } from '../../lib/utils';

export const CenterHero: React.FC<WonderProps> = ({ id, style, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={cn("relative flex flex-col items-center justify-center p-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 overflow-hidden", style)}
    >
      {children}
    </div>
  );
};
