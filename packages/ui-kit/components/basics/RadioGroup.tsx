import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { WonderProps } from '../../types';
import { cn } from '../../lib/utils';

export const RadioGroup: React.FC<WonderProps & { options: string[] }> = ({ id, options, style }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={cn("flex flex-col gap-2", style)}
    >
      {options.map((option) => (
        <label key={option} className="flex items-center gap-2">
          <input type="radio" name={id} value={option} className="h-4 w-4 text-slate-800" />
          {option}
        </label>
      ))}
    </div>
  );
};
