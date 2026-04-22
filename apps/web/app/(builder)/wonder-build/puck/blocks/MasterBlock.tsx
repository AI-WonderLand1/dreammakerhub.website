'use client';

import React from 'react';
import { motion } from 'motion/react';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';

export type MasterBlockProps = {
  title: string;
  iconName: string;
  variant: 'glass' | 'neon' | 'ghost';
  glowColor?: string;
  triggerEvent: 'onClick' | 'onHover' | 'onLoad';
  children?: React.ReactNode;
};

export const MasterBlock = ({
  title,
  iconName,
  variant,
  glowColor = '#00f3ff',
  triggerEvent,
  children,
}: MasterBlockProps) => {
  const Icon = (Icons as unknown as Record<string, React.ElementType>)[iconName] || Icons.Sparkles;

  const variants = {
    glass: 'border border-white/20 bg-white/10 backdrop-blur-md shadow-xl',
    neon: 'bg-black border-2 shadow-[0_0_15px_rgba(0,0,0,0.5)]',
    ghost: 'border border-dashed border-zinc-700 bg-transparent',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={triggerEvent === 'onHover' ? { scale: 1.02 } : {}}
      style={variant === 'neon' ? { borderColor: glowColor, boxShadow: `0 0 10px ${glowColor}` } : {}}
      className={cn('group relative rounded-2xl p-6 transition-all duration-300', variants[variant])}
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-lg bg-zinc-900/50 p-2">
          <Icon size={20} style={{ color: glowColor }} />
        </div>
        <h3 className="font-bold tracking-tight text-zinc-100">{title}</h3>
      </div>

      <div className="text-sm leading-relaxed text-zinc-400">{children || 'Drop AI content or logic here...'}</div>

      <div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity group-hover:opacity-20"
        style={{ background: `radial-gradient(circle at center, ${glowColor}, transparent)` }}
      />
    </motion.div>
  );
};
