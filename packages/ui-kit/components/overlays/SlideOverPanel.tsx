import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'motion/react';
import { WonderProps } from '../../types';
import { cn } from '../../lib/utils';

export const SlideOverPanel: React.FC<WonderProps> = ({ id, style, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  
  return (
    <motion.div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      className={cn("fixed right-0 top-0 h-full w-96 p-8 bg-slate-900/90 backdrop-blur-xl border-l border-white/10 z-50", style)}
    >
      {children}
    </motion.div>
  );
};
