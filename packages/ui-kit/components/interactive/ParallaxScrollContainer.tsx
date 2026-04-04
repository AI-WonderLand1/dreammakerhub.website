import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, useScroll, useTransform } from 'motion/react';
import { WonderProps } from '../../types';
import { cn } from '../../lib/utils';

export const ParallaxScrollContainer: React.FC<WonderProps> = ({ id, style, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  
  return (
    <motion.div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={cn("p-8 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 overflow-hidden", style)}
    >
      <motion.div style={{ y }}>{children}</motion.div>
    </motion.div>
  );
};
