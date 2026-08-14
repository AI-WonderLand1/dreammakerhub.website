'use client';
import React from 'react';
import { X } from 'lucide-react';

interface IndustryOption {
  label: string;
  emoji: string;
  batchNumber: number;
  description: string;
}

// Maps "What are you building?" industries to template library batches.
export const INDUSTRY_OPTIONS: IndustryOption[] = [
  { label: 'Business site', emoji: '💼', batchNumber: 6, description: 'Corporate / company websites' },
  { label: 'Online store', emoji: '🛍️', batchNumber: 3, description: 'E-commerce & product shops' },
  { label: 'Portfolio', emoji: '🧑‍🎨', batchNumber: 2, description: 'Agency & creative portfolios' },
  { label: 'SaaS landing', emoji: '📈', batchNumber: 1, description: 'Product & startup landings' },
  { label: 'Restaurant', emoji: '🍽️', batchNumber: 10, description: 'Food & hospitality sites' },
  { label: 'Event', emoji: '🎟️', batchNumber: 12, description: 'Conferences & entertainment' },
  { label: 'Agency', emoji: '🏢', batchNumber: 2, description: 'Studio & agency presence' },
  { label: 'Real estate', emoji: '🏠', batchNumber: 7, description: 'Property & listings' },
  { label: 'Education', emoji: '🎓', batchNumber: 8, description: 'Courses & LMS sites' },
  { label: 'Health & wellness', emoji: '🏥', batchNumber: 9, description: 'Clinics & fitness' },
  { label: 'Blog', emoji: '✍️', batchNumber: 4, description: 'Editorial & content' },
  { label: 'Finance', emoji: '🪙', batchNumber: 13, description: 'Fintech & banking' },
  { label: 'Tech / Developer', emoji: '🧑‍💻', batchNumber: 14, description: 'Dev tools & APIs' },
  { label: 'Immersive 3D', emoji: '🌌', batchNumber: 15, description: '3D website experiences' },
  { label: 'Nonprofit', emoji: '💚', batchNumber: 11, description: 'Charities & causes' },
  { label: 'Marketing', emoji: '📣', batchNumber: 5, description: 'Lead-gen & campaigns' },
];

interface IndustryPickerProps {
  isOpen: boolean;
  onSelectIndustry: (batchNumber: number) => void;
  onSkip: () => void;
}

export default function IndustryPicker({ isOpen, onSelectIndustry, onSkip }: IndustryPickerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl shadow-indigo-500/10">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/95 px-6 py-4 backdrop-blur">
          <div>
            <h2 className="text-lg font-bold text-white">What are you building?</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Pick an industry and we&apos;ll surface a matching template suite to start from.
            </p>
          </div>
          <button
            onClick={onSkip}
            aria-label="Close"
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 p-6">
          {INDUSTRY_OPTIONS.map((option) => (
            <button
              key={option.label}
              onClick={() => onSelectIndustry(option.batchNumber)}
              className="group flex flex-col items-start gap-1.5 rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-left transition-all hover:border-indigo-500/80 hover:bg-slate-900 hover:shadow-lg hover:shadow-indigo-500/10"
            >
              <span className="text-xl leading-none">{option.emoji}</span>
              <span className="text-xs font-semibold text-slate-100 group-hover:text-white">
                {option.label}
              </span>
              <span className="text-[9px] text-slate-500 leading-snug">{option.description}</span>
            </button>
          ))}
        </div>

        <div className="sticky bottom-0 flex items-center justify-between border-t border-slate-800/80 bg-slate-950/95 px-6 py-3 backdrop-blur">
          <button
            onClick={onSkip}
            className="text-[11px] font-medium text-slate-400 hover:text-white transition-colors"
          >
            Browse all templates →
          </button>
          <span className="text-[9px] text-slate-600 font-mono">{INDUSTRY_OPTIONS.length} industries</span>
        </div>
      </div>
    </div>
  );
}
