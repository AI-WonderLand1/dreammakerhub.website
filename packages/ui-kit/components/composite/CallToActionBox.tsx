import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'motion/react';
import { WonderProps } from '../../types';
import { cn } from '../../lib/utils';

export const CallToActionBox: React.FC<WonderProps> = ({ id, style, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  
  return (
    <motion.div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      className={cn("p-12 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10", style)}
    >
      <div className="p-8 rounded-xl bg-slate-900/80 border border-white/10">
        {children}
      </div>
    </motion.div>
  );
};
