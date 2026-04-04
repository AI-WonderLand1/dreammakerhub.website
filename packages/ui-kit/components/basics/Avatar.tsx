import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { WonderProps } from '../../types';
import { cn } from '../../lib/utils';
import { User } from 'lucide-react';

export const Avatar: React.FC<WonderProps & { src?: string }> = ({ id, src, style }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={cn("h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden", style)}
    >
      {src ? <img src={src} alt="Avatar" /> : <User className="text-slate-500" />}
    </div>
  );
};
