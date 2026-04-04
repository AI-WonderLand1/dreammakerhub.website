import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'motion/react';
import { WonderProps } from '../../types';
import { cn } from '../../lib/utils';

export const SpotlightEffect: React.FC<WonderProps> = ({ id, style, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  return (
    <motion.div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
      className={cn("relative overflow-hidden p-8 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10", style)}
    >
      <div 
        className="absolute w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"
        style={{ left: mousePos.x - 128, top: mousePos.y - 128 }}
      />
      {children}
    </motion.div>
  );
};
