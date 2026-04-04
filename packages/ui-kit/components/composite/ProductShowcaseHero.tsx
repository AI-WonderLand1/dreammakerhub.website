import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'motion/react';
import { WonderProps } from '../../types';
import { cn } from '../../lib/utils';

export const ProductShowcaseHero: React.FC<WonderProps> = ({ id, style, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  
  return (
    <motion.div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex flex-col md:flex-row items-center gap-12 p-12 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10", style)}
    >
      <div className="flex-1">{children}</div>
      <motion.div 
        animate={{ y: [0, -20, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        className="flex-1 bg-white/10 p-4 rounded-xl border border-white/20 shadow-2xl"
      >
        <div className="aspect-video bg-slate-800 rounded-lg" />
      </motion.div>
    </motion.div>
  );
};
