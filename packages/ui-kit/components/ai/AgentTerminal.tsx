import React, { useEffect, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'motion/react';
import { WonderProps } from '../../types';
import { cn } from '../../lib/utils';

export const AgentTerminal: React.FC<WonderProps> = ({ id, style, content }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const [text, setText] = useState('');
  
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setText((prev) => prev + (content?.[i] || ''));
      i++;
      if (i >= (content?.length || 0)) clearInterval(interval);
    }, 50);
    return () => clearInterval(interval);
  }, [content]);
  
  return (
    <motion.div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={cn("p-4 rounded-xl bg-black/80 font-mono text-green-400 border border-white/10", style)}
    >
      {text}
    </motion.div>
  );
};
