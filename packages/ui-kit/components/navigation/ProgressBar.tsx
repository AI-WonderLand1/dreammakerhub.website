import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, useScroll, useSpring } from 'motion/react';
import { WonderProps } from '../../types';
import { cn } from '../../lib/utils';

export const ProgressBar: React.FC<WonderProps> = ({ id, style }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  
  return (
    <motion.div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={cn("fixed top-0 left-0 h-1 bg-white z-[9999]", style)}
    >
      <motion.div style={{ scaleX }} className="h-full bg-blue-500" />
    </motion.div>
  );
};
