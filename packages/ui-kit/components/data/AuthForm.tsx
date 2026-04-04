import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'motion/react';
import { WonderProps } from '../../types';
import { cn } from '../../lib/utils';

export const AuthForm: React.FC<WonderProps> = ({ id, style, supabaseClient }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  
  return (
    <motion.div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={cn("p-8 rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 shadow-xl", style)}
    >
      <input type="email" placeholder="Email" className="w-full p-2 mb-4 bg-white/5 rounded-lg border border-white/10" />
      <input type="password" placeholder="Password" className="w-full p-2 mb-4 bg-white/5 rounded-lg border border-white/10" />
      <button className="w-full p-2 rounded-lg bg-blue-500 text-white">Login</button>
    </motion.div>
  );
};
