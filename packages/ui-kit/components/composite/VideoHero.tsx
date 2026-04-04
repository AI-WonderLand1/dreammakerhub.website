import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'motion/react';
import { WonderProps } from '../../types';
import { cn } from '../../lib/utils';

export const VideoHero: React.FC<WonderProps> = ({ id, style, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  
  return (
    <motion.div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("relative flex flex-col items-center justify-center p-16 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 overflow-hidden", style)}
    >
      <video className="absolute inset-0 w-full h-full object-cover -z-10" autoPlay loop muted playsInline>
        <source src="https://assets.mixkit.co/videos/preview/mixkit-abstract-waves-in-water-1294-large.mp4" type="video/mp4" />
      </video>
      {children}
    </motion.div>
  );
};
