import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'motion/react';
import { WonderProps } from '../../types';
import { cn } from '../../lib/utils';

export const VoiceVisualizer: React.FC<WonderProps> = ({ id, style }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  
  return (
    <motion.div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={cn("flex gap-1 p-4 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10", style)}
    >
      {[...Array(10)].map((_, i) => (
        <motion.div
          key={i}
          animate={{ height: [10, 30, 10] }}
          transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.05 }}
          className="w-2 bg-blue-500 rounded-full"
        />
      ))}
    </motion.div>
  );
};
