import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'motion/react';
import { WonderProps } from '../../types';
import { cn } from '../../lib/utils';

export const GlitchText: React.FC<WonderProps> = ({ id, style, content }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  
  return (
    <motion.div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      animate={{ x: [-2, 2, -2, 0] }}
      transition={{ repeat: Infinity, duration: 0.2 }}
      className={cn("text-4xl font-bold text-white", style)}
    >
      {content}
    </motion.div>
  );
};
