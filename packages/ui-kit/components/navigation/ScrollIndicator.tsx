import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'motion/react';
import { WonderProps } from '../../types';
import { cn } from '../../lib/utils';

export const ScrollIndicator: React.FC<WonderProps> = ({ id, style }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  
  return (
    <motion.div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      animate={{ y: [0, 10, 0] }}
      transition={{ repeat: Infinity, duration: 2 }}
      className={cn("fixed bottom-8 left-8 p-4 rounded-full bg-white/10 backdrop-blur-lg border border-white/20", style)}
    >
      {/* Icon */}
    </motion.div>
  );
};
