import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'motion/react';
import { WonderProps } from '../../types';
import { cn } from '../../lib/utils';

export const SideCommandPalette: React.FC<WonderProps> = ({ id, style, data }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  
  return (
    <motion.div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={cn("fixed top-1/4 left-8 p-6 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-white/20 shadow-2xl", style)}
    >
      {/* Implementation using data prop */}
    </motion.div>
  );
};
