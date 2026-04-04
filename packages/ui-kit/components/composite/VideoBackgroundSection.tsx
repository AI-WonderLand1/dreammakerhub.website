import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'motion/react';
import { WonderProps } from '../../types';
import { cn } from '../../lib/utils';

export const VideoBackgroundSection: React.FC<WonderProps> = ({ id, style, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  
  return (
    <motion.div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={cn("relative p-12 rounded-2xl overflow-hidden", style)}
    >
      <iframe 
        className="absolute inset-0 w-full h-full object-cover -z-10"
        src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1&loop=1&playlist=dQw4w9WgXcQ"
        title="Video Background"
        allow="autoplay; encrypted-media"
      />
      <div className="relative z-10 bg-white/10 backdrop-blur-md p-8 rounded-xl border border-white/20">{children}</div>
    </motion.div>
  );
};
