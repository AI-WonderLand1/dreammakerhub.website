"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
import { logger } from '@/lib/logger';
  LayoutGrid, Columns3, Rows3, Square, Type, AlignLeft, Quote, 
  Image as ImageIcon, Video, UserCircle, CheckSquare, 
  MousePointer2, ChevronDown, Menu, Link as LinkIcon, Table, 
  CreditCard, Tag, Zap, MessageSquare, Search, 
  Layers, ChevronRight, Settings, Bell, Heart, Star, 
  Calendar, MapPin, Phone, Mail, User, Globe, Shield, 
  ShoppingBag, ShoppingCart, Briefcase, GraduationCap,
  Coffee, Music, Film, Camera, Activity, PieChart, BarChart3,
  Wind, Flame, Droplets, Sun, Moon, Cloud, CloudRain, CloudLightning,
  Sparkles
} from "lucide-react";

interface ComponentsLibraryProps {
  isOpen: boolean;
  onToggle: (open: boolean) => void;
}

type ComponentCategory = "Layout" | "Typography" | "Media" | "Forms" | "Navigation" | "Data Display" | "Special";

interface Block {
  type: string;
  icon: any;
  label: string;
  category: ComponentCategory;
  color: string;
}

const BLOCKS: Block[] = [
  // Layout
  { type: "Container", icon: Square, label: "Container", category: "Layout", color: "bg-blue-500/20 text-blue-300" },
  { type: "Row", icon: Rows3, label: "Row Layout", category: "Layout", color: "bg-blue-500/20 text-blue-300" },
  { type: "Column", icon: Columns3, label: "Column Layout", category: "Layout", color: "bg-blue-500/20 text-blue-300" },
  { type: "Grid", icon: LayoutGrid, label: "Grid", category: "Layout", color: "bg-blue-500/20 text-blue-300" },
  { type: "Section", icon: Layers, label: "Section", category: "Layout", color: "bg-blue-500/20 text-blue-300" },

  // Typography
  { type: "Heading", icon: Type, label: "Heading", category: "Typography", color: "bg-purple-500/20 text-purple-300" },
  { type: "Text", icon: AlignLeft, label: "Text", category: "Typography", color: "bg-purple-500/20 text-purple-300" },
  { type: "Quote", icon: Quote, label: "Quote", category: "Typography", color: "bg-purple-500/20 text-purple-300" },

  // Media
  { type: "Image", icon: ImageIcon, label: "Image", category: "Media", color: "bg-orange-500/20 text-orange-300" },
  { type: "Video", icon: Video, label: "Video", category: "Media", color: "bg-orange-500/20 text-orange-300" },
  { type: "Avatar", icon: UserCircle, label: "Avatar", category: "Media", color: "bg-orange-500/20 text-orange-300" },

  // Forms
  { type: "Input", icon: Type, label: "Input", category: "Forms", color: "bg-green-500/20 text-green-300" },
  { type: "Checkbox", icon: CheckSquare, label: "Checkbox", category: "Forms", color: "bg-green-500/20 text-green-300" },
  { type: "Button", icon: MousePointer2, label: "Button", category: "Forms", color: "bg-green-500/20 text-green-300" },
  { type: "Select", icon: ChevronDown, label: "Select", category: "Forms", color: "bg-green-500/20 text-green-300" },

  // Navigation
  { type: "Navbar", icon: Menu, label: "Navbar", category: "Navigation", color: "bg-cyan-500/20 text-cyan-300" },
  { type: "Link", icon: LinkIcon, label: "Link", category: "Navigation", color: "bg-cyan-500/20 text-cyan-300" },

  // Data Display
  { type: "Table", icon: Table, label: "Table", category: "Data Display", color: "bg-yellow-500/20 text-yellow-300" },
  { type: "Card", icon: CreditCard, label: "Card", category: "Data Display", color: "bg-yellow-500/20 text-yellow-300" },
  { type: "Badge", icon: Tag, label: "Badge", category: "Data Display", color: "bg-yellow-500/20 text-yellow-300" },

  // Special
  { type: "Zap", icon: Zap, label: "Action", category: "Special", color: "bg-pink-500/20 text-pink-300" },
  { type: "Message", icon: MessageSquare, label: "Chat", category: "Special", color: "bg-pink-500/20 text-pink-300" },
  { type: "Search", icon: Search, label: "Search", category: "Special", color: "bg-pink-500/20 text-pink-300" },
];

export default function ComponentsLibrary({ isOpen, onToggle }: ComponentsLibraryProps) {
  const categories: ComponentCategory[] = ["Layout", "Typography", "Media", "Forms", "Navigation", "Data Display", "Special"];

  const handleDragEnd = (event: any, block: any) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('addBlock', { 
        detail: { type: block.type, props: {} } 
      }));
    }
  };

  return (
    <>
      <button
        onClick={() => onToggle(!isOpen)}
        className="absolute right-2 top-2 z-20 p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition-colors"
        title="Toggle components library"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div
        className={`h-full bg-black/60 backdrop-blur-lg border-r border-white/10 transition-all duration-300 overflow-y-auto ${isOpen ? "w-72" : "w-0"}`}
      >
        {isOpen && (
          <div className="p-4 space-y-6">
            <div>
              <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4">Components Library</h3>
              <p className="text-[10px] text-white/30 mb-4">Click or drag to add elements</p>
            </div>

            {categories.map(category => {
              const categoryBlocks = BLOCKS.filter(b => b.category === category);
              if (categoryBlocks.length === 0) return null;
              return (
                <div key={category} className="space-y-3">
                  <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] ml-1">{category}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {categoryBlocks.map((block) => (
                      <motion.div
                        key={block.type}
                        drag
                        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                        onDragEnd={() => handleDragEnd(null, block)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`${block.color} p-3 rounded-xl border border-white/10 cursor-pointer flex flex-col items-center justify-center text-center transition-all hover:shadow-lg hover:shadow-black/50`}
                        onClick={() => handleDragEnd(null, block)}
                      >
                        <block.icon className="w-5 h-5 mb-1.5 opacity-80" />
                        <span className="text-[10px] font-medium truncate w-full">{block.label}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })}

            <div className="pt-6 border-t border-white/10">
              <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">AI Magic</h4>
              <div className="bg-gradient-to-br from-violet-600/20 to-blue-600/20 rounded-2xl p-4 border border-violet-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  <span className="text-xs font-semibold text-white">AI Assistant</span>
                </div>
                <p className="text-[10px] text-white/50 mb-4">Generate complex sections instantly with natural language.</p>
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new CustomEvent('toggleAI', { detail: true }));
                    }
                  }}
                  className="w-full py-2 bg-gradient-to-r from-violet-600 to-blue-600 rounded-xl text-[11px] font-bold text-white hover:from-violet-500 hover:to-blue-500 transition-all shadow-lg shadow-violet-900/20"
                >
                  Open AI Chat
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
