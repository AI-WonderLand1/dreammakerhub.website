import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { WonderProps } from '../../types';
import { cn } from '../../lib/utils';
import * as LucideIcons from 'lucide-react';

export const IconWrapper: React.FC<WonderProps & { iconName: keyof typeof LucideIcons }> = ({ id, iconName, style }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const Icon = LucideIcons[iconName] as React.ElementType;
  
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={cn("p-2 bg-white/10 backdrop-blur-md rounded-lg inline-block", style)}
    >
      <Icon />
    </div>
  );
};
