import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'motion/react';
import { WonderProps } from '../../types';
import { cn } from '../../lib/utils';

export const ConfettiExplosion: React.FC<WonderProps> = ({ id, style, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  
  return (
    <motion.div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      whileTap={{ scale: 0.95 }}
      className={cn("p-4 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 cursor-pointer", style)}
      onClick={() => { /* Confetti logic */ }}
    >
      {children}
    </motion.div>
  );
};
