import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'motion/react';
import { WonderProps } from '../../types';
import { cn } from '../../lib/utils';

export const BeforeAfterSlider: React.FC<WonderProps> = ({ id, style, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const [sliderPos, setSliderPos] = useState(50);
  
  return (
    <motion.div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={cn("relative w-full aspect-video rounded-2xl overflow-hidden border border-white/20", style)}
    >
      <div className="absolute inset-0 bg-slate-800" />
      <div 
        className="absolute inset-0 bg-slate-600" 
        style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
      />
      <input 
        type="range" 
        min="0" 
        max="100" 
        value={sliderPos} 
        onChange={(e) => setSliderPos(Number(e.target.value))}
        className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-full bg-white" />
    </motion.div>
  );
};
