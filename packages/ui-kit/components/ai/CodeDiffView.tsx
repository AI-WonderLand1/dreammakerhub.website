import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'motion/react';
import { WonderProps } from '../../types';
import { cn } from '../../lib/utils';

export const CodeDiffView: React.FC<WonderProps> = ({ id, style, content }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  
  return (
    <motion.div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={cn("p-4 rounded-xl bg-black/90 font-mono text-xs border border-white/10", style)}
    >
      <pre className="text-red-400">- {content}</pre>
      <pre className="text-green-400">+ {content}</pre>
    </motion.div>
  );
};
