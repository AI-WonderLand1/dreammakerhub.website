import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'motion/react';
import { WonderProps } from '../../types';
import { cn } from '../../lib/utils';

export const ContextChip: React.FC<WonderProps> = ({ id, style, content }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  
  return (
    <motion.div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={cn("px-4 py-2 rounded-full bg-white/10 backdrop-blur-lg border border-white/20 text-sm", style)}
    >
      {content}
    </motion.div>
  );
};
