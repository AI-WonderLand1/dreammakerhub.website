import React, { useState } from 'react';
import { WonderProps } from '../../types';
import { cn } from '../../lib/utils';
import { ChevronDown } from 'lucide-react';

export const Accordion: React.FC<WonderProps & { items: { title: string; content: string }[] }> = ({ id, items, style }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  
  return (
    <div className={cn("w-full space-y-2", style)}>
      {items.map((item, index) => (
        <div key={index} className="border border-slate-200 rounded-lg overflow-hidden bg-white/10 backdrop-blur-md">
          <button
            className="w-full flex justify-between items-center p-4 text-left font-medium"
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
          >
            {item.title}
            <ChevronDown className={cn("transition-transform", openIndex === index && "rotate-180")} />
          </button>
          {openIndex === index && <div className="p-4 border-t border-slate-200">{item.content}</div>}
        </div>
      ))}
    </div>
  );
};
