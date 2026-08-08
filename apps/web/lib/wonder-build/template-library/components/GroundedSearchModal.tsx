'use client';
import React, { useState } from 'react';
import {
  Globe,
  Search,
  X,
  ExternalLink,
  Sparkles,
  Loader2,
  FileText,
  Plus,
  Compass,
} from 'lucide-react';
import { WonderBuildTemplate } from '../types';

interface GroundedSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateFromResearch?: (topic: string, researchSummary: string) => void;
}

const PRESET_QUERIES = [
  '2026 AI SaaS landing page trends and hero designs',
  'High-converting developer portfolio sections and typography',
  'Minimalist ecommerce dark mode layouts and product grids',
  'Modern fintech dashboard metrics and color contrast guidelines',
];

export const GroundedSearchModal: React.FC<GroundedSearchModalProps> = ({
  isOpen,
  onClose,
  onGenerateFromResearch,
}) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultText, setResultText] = useState<string | null>(null);
  const [sources, setSources] = useState<Array<{ title: string; uri: string }>>([]);

  if (!isOpen) return null;

  const handleSearch = async (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/wonder-build/template-library/search-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch search grounding results');
      }

      setResultText(data.text);
      setSources(data.sources || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error executing Google Search grounding.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTemplate = () => {
    if (resultText && onGenerateFromResearch) {
      onGenerateFromResearch(query, resultText);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-lg text-white">Google Search Grounding</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase">
                  gemini-3.5-flash
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Retrieve live web data, current design trends, and grounded research citations.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Search Input */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300">
              Search Web Design Trends or Real-time Market Data
            </label>
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="e.g. 2026 AI SaaS landing page trends and hero layouts..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <button
                onClick={() => handleSearch()}
                disabled={isLoading || !query.trim()}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer shadow-md"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Search Grounding</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick preset chips */}
            <div className="flex items-center space-x-2 overflow-x-auto pt-1 pb-2">
              <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1 shrink-0">
                <Compass className="w-3 h-3" /> Preset Ideas:
              </span>
              {PRESET_QUERIES.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(p);
                    handleSearch(p);
                  }}
                  className="text-[11px] bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-full px-3 py-1 transition-colors shrink-0 cursor-pointer"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-950/50 border border-red-500/50 rounded-xl text-red-300 text-xs">
              {error}
            </div>
          )}

          {/* Search Result */}
          {resultText && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                  <h4 className="font-bold text-sm text-blue-400 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Grounded Web Intelligence
                  </h4>
                  {onGenerateFromResearch && (
                    <button
                      onClick={handleCreateTemplate}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Generate Template From Results</span>
                    </button>
                  )}
                </div>

                <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                  {resultText}
                </div>
              </div>

              {/* Grounded Web Sources / Citations */}
              {sources.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-blue-400" />
                    Grounded Web Sources ({sources.length})
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {sources.map((src, idx) => (
                      <a
                        key={idx}
                        href={src.uri}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/50 rounded-xl flex items-center justify-between transition-all group"
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <FileText className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-400" />
                          <span className="text-xs text-slate-300 font-medium truncate">
                            {src.title}
                          </span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 shrink-0 ml-2" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
