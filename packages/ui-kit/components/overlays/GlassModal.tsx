import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'motion/react';
import { WonderProps } from '../../types';
import { cn } from '../../lib/utils';

export const GlassModal: React.FC<WonderProps> = ({ id, style, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  
  return (
    <motion.div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={cn("fixed inset-0 flex items-center justify-center p-8 bg-black/50 backdrop-blur-sm z-50", style)}
    >
      <motion.div 
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="p-8 rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20"
      >
        {children}
      </motion.div>
    </motion.div>
  );
};
