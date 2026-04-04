import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'motion/react';
import { WonderProps } from '../../types';
import { cn } from '../../lib/utils';

export const UserPresence: React.FC<WonderProps> = ({ id, style, supabaseClient }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  
  return (
    <motion.div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={cn("flex gap-2 p-4 rounded-full bg-white/5 backdrop-blur-lg border border-white/10", style)}
    >
      <div className="w-8 h-8 rounded-full bg-blue-500" />
      <div className="w-8 h-8 rounded-full bg-green-500" />
    </motion.div>
  );
};
