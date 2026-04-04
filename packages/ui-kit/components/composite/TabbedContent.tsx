import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'motion/react';
import { WonderProps } from '../../types';
import { cn } from '../../lib/utils';

export const TabbedContent: React.FC<WonderProps> = ({ id, style, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const [activeTab, setActiveTab] = useState(0);
  
  return (
    <motion.div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={cn("p-8 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10", style)}
    >
      <div className="flex gap-4 mb-8">
        {['Tab 1', 'Tab 2', 'Tab 3'].map((tab, i) => (
          <button 
            key={i} 
            onClick={() => setActiveTab(i)}
            className={cn("px-4 py-2 rounded-lg transition", activeTab === i ? "bg-white/20" : "bg-white/5")}
          >
            {tab}
          </button>
        ))}
      </div>
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
};
