import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'motion/react';
import { WonderProps } from '../../types';
import { cn } from '../../lib/utils';

export const SocialLinks: React.FC<WonderProps> = ({ id, style, data }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  
  return (
    <motion.div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={cn("flex gap-4 p-4 rounded-full bg-white/5 backdrop-blur-lg border border-white/10", style)}
    >
      {/* Implementation using data prop */}
    </motion.div>
  );
};
