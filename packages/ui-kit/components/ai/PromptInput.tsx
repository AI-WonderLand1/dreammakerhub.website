import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'motion/react';
import { WonderProps } from '../../types';
import { cn } from '../../lib/utils';

export const PromptInput: React.FC<WonderProps> = ({ id, style }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  
  return (
    <motion.div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={cn("p-4 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10", style)}
    >
      <textarea className="w-full h-24 bg-transparent border-none outline-none text-white" placeholder="Enter prompt..." />
      <div className="flex gap-2">
        <button className="px-4 py-2 rounded-lg bg-blue-500 text-white">Action 1</button>
        <button className="px-4 py-2 rounded-lg bg-purple-500 text-white">Action 2</button>
      </div>
    </motion.div>
  );
};
