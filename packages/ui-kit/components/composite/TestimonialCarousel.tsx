import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'motion/react';
import { WonderProps } from '../../types';
import { cn } from '../../lib/utils';

export const TestimonialCarousel: React.FC<WonderProps> = ({ id, style, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  
  return (
    <motion.div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={cn("overflow-hidden p-8 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10", style)}
    >
      <motion.div
        className="flex gap-8"
        drag="x"
        dragConstraints={{ right: 0, left: -1000 }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
};
