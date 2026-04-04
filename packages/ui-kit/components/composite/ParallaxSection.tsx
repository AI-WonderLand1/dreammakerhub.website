import React, { useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, useScroll, useTransform } from 'motion/react';
import { WonderProps } from '../../types';
import { cn } from '../../lib/utils';

export const ParallaxSection: React.FC<WonderProps> = ({ id, style, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  
  return (
    <motion.div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={cn("relative overflow-hidden p-24 rounded-2xl", style)}
    >
      <motion.div style={{ y }} className="absolute inset-0 bg-[url('https://picsum.photos/seed/nature/1920/1080')] bg-cover bg-center -z-10" />
      <div className="relative z-10 p-8 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">{children}</div>
    </motion.div>
  );
};
