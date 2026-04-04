import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'motion/react';
import { WonderProps } from '../../types';
import { cn } from '../../lib/utils';

export const JsonTree: React.FC<WonderProps> = ({ id, style, supabaseClient }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  
  return (
    <motion.div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={cn("p-4 rounded-2xl bg-black/80 font-mono text-xs text-green-400 border border-white/10", style)}
    >
      {/* JSON tree visualization */}
    </motion.div>
  );
};
