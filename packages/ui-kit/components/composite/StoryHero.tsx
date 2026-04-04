import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'motion/react';
import { WonderProps } from '../../types';
import { cn } from '../../lib/utils';

export const StoryHero: React.FC<WonderProps> = ({ id, style, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  
  return (
    <motion.div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn("flex flex-col md:flex-row items-center gap-12 p-12 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10", style)}
    >
      <div className="flex-1">{children}</div>
      <div className="flex-1 grid grid-cols-2 gap-4">
        <div className="col-span-2 h-48 bg-white/10 rounded-xl border border-white/20" />
        <div className="h-32 bg-white/10 rounded-xl border border-white/20" />
        <div className="h-32 bg-white/10 rounded-xl border border-white/20" />
      </div>
    </motion.div>
  );
};
