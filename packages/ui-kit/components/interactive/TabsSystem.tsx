import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'motion/react';
import { WonderProps } from '../../types';
import { cn } from '../../lib/utils';

export const TabsSystem: React.FC<WonderProps> = ({ id, style, data }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const [activeTab, setActiveTab] = useState(0);
  
  return (
    <motion.div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={cn("p-6 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10", style)}
    >
      <div className="flex gap-4 mb-4">
        {['Tab 1', 'Tab 2'].map((tab, i) => (
          <button key={i} onClick={() => setActiveTab(i)} className="relative px-4 py-2">
            {activeTab === i && <motion.div layoutId="activeTab" className="absolute inset-0 bg-white/20 rounded-lg" />}
            {tab}
          </button>
        ))}
      </div>
      {/* Content */}
    </motion.div>
  );
};
