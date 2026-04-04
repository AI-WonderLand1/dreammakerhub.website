import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'motion/react';
import { WonderProps } from '../../types';
import { cn } from '../../lib/utils';

export const LogoGridStatic: React.FC<WonderProps> = ({ id, style, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  
  return (
    <motion.div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      className={cn("grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 p-8 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10", style)}
    >
      {children}
    </motion.div>
  );
};
