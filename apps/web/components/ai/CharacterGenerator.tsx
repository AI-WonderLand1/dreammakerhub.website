'use client';

import { useState, useCallback } from 'react';
import { logger } from '@/lib/logger';

interface CharacterGeneratorProps {
  onGenerate?: (description: string) => void;
}

export function CharacterGenerator({ onGenerate }: CharacterGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState<'realistic' | 'cartoon' | 'anime' | 'lowpoly'>('realistic');
  const [action, setAction] = useState<'describe' | 'suggest' | 'enhance'>('describe');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/ai/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, style, action }),
      });
      
      const data = await res.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data.result || '');
        onGenerate?.(data.result || '');
      }
    } catch (err) {
      setError('Failed to generate character');
    } finally {
      setLoading(false);
    }
  }, [prompt, style, action, onGenerate]);

  return (
    <div className="bg-black text-white rounded-xl border border-white/20 p-4">
      <h3 className="text-lg font-semibold mb-3">🎭 AI Character Designer</h3>
      
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your character..."
            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 text-sm focus:outline-none focus:border-cyan-500"
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value as typeof style)}
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
          >
            <option value="realistic">Realistic</option>
            <option value="cartoon">Cartoon</option>
            <option value="anime">Anime</option>
            <option value="lowpoly">Low Poly</option>
          </select>
          
          <select
            value={action}
            onChange={(e) => setAction(e.target.value as typeof action)}
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
          >
            <option value="describe">Describe</option>
            <option value="suggest">Suggest</option>
            <option value="enhance">Enhance</option>
          </select>
          
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="px-4 py-2 bg-cyan-600 rounded-lg font-medium hover:bg-cyan-500 disabled:opacity-50 text-sm"
          >
            {loading ? '...' : 'Generate'}
          </button>
        </div>
        
        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}
        
        {result && (
          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <p className="text-sm text-white/80 whitespace-pre-wrap">{result}</p>
          </div>
        )}
      </div>
    </div>
  );
}