"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Send, Loader2 } from "lucide-react";

export default function HeroSection() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleBuild = async () => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    // Add artificial delay or await a real API trigger here
    router.push(`/wonder-build?prompt=${encodeURIComponent(query)}`);
  };

  return (
    <section className="relative min-h-[60vh] flex items-center justify-center bg-black">
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <h1 className="mb-12">
          <span className="block text-6xl md:text-8xl bg-gradient-to-r from-pink-300 via-purple-300 to-blue-300 bg-clip-text text-transparent font-extrabold tracking-tight">
            AI Wonderland
          </span>
          <p className="mt-6 text-xl text-slate-400">Where you create a future together in AI</p>
        </h1>
        
        <div className="relative group max-w-2xl mx-auto">
          <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
          <div className="relative flex items-center bg-slate-950/90 border border-white/10 rounded-2xl p-2 shadow-2xl">
            <Sparkles className="w-6 h-6 ml-3 text-purple-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleBuild()}
              placeholder="What can I build for you today?"
              className="flex-1 bg-transparent px-4 py-3 text-white placeholder-slate-600 outline-none"
            />
            <button 
              onClick={handleBuild}
              disabled={isLoading || !query.trim()}
              className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center transition-colors disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 text-purple-400" />}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
