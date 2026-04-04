import React, { useEffect, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'motion/react';
import { WonderProps } from '../../types';
import { cn } from '../../lib/utils';

export const CustomCursor: React.FC<WonderProps> = ({ id, style }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  return (
    <motion.div
      ref={setNodeRef}
      style={{ 
        transform: CSS.Transform.toString(transform), 
        transition,
        left: mousePos.x,
        top: mousePos.y
      }}
      {...attributes}
      {...listeners}
      className={cn("fixed w-8 h-8 rounded-full bg-white/50 backdrop-blur-sm pointer-events-none z-[9999]", style)}
    />
  );
};
