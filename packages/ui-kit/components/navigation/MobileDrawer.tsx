import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'motion/react';
import { WonderProps } from '../../types';
import { cn } from '../../lib/utils';

export const MobileDrawer: React.FC<WonderProps> = ({ id, style, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  
  return (
    <motion.div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      initial={{ x: '-100%' }}
      animate={{ x: 0 }}
      className={cn("fixed left-0 top-0 h-full w-64 p-8 bg-slate-900/90 backdrop-blur-xl border-r border-white/10 z-50", style)}
    >
      {children}
    </motion.div>
  );
};
