import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'motion/react';
import { WonderProps } from '../../types';
import { cn } from '../../lib/utils';

export const AnalyticsDashboard: React.FC<WonderProps> = ({ id, style, supabaseClient }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  
  return (
    <motion.div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={cn("grid grid-cols-2 gap-4 p-4 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10", style)}
    >
      <div className="p-4 bg-white/5 rounded-xl">Metric 1</div>
      <div className="p-4 bg-white/5 rounded-xl">Metric 2</div>
    </motion.div>
  );
};
