'use client';
import React, { useState, useEffect } from 'react';
import { Volume2, Lock, Sparkles, BookOpen } from 'lucide-react';
import { cn } from '../utils';

// Phonetic mapping based on the 24-sign Egyptian alphabet
const HIEROGLYPH_PHONETIC_MAP: Record<string, string> = {
  'a': '𓄼', 'b': '𓃀', 'c': '𓆎', 'd': '𓂝', 'e': '𓇋', 
  'f': '𓆑', 'g': '𓈖', 'h': '𓄿', 'i': '𓇝', 'j': '𓇚',
  'k': '𓎼', 'l': '𓃭', 'm': '𓅓', 'n': '𓈗', 'o': '𓊖',
  'p': '𓊪', 'q': '𓄽', 'r': '𓂋', 's': '𓊫', 't': '𓏏',
  'u': '𓅱', 'v': '𓋔', 'w': '𓌗', 'x': '𓏴', 'y': '𓇌', 'z': '𓏃'
};

interface VoiceModuleProps {
  isFeatureEnabled: boolean; // Linked to Sidebar Toggle
  onSpeechStart: () => void; // Triggers Assistant Bot Nod
  onSpeechEnd: () => void;   // Stops Assistant Bot Nod
}

export default function EgyptianVoiceModule({ 
  isFeatureEnabled, 
  onSpeechStart, 
  onSpeechEnd 
}: VoiceModuleProps) {
  const [inputText, setInputText] = useState('');
  const [hieroglyphs, setHieroglyphs] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleTranslate = (val: string) => {
    setInputText(val);
    const translated = val.toLowerCase().split('')
      .map(char => HIEROGLYPH_PHONETIC_MAP[char] || char)
      .join('');
    setHieroglyphs(translated);
  };

  const playAIVoice = () => {
    if (!inputText || !isFeatureEnabled || isSpeaking) return;

    const utterance = new SpeechSynthesisUtterance(inputText);
    utterance.pitch = 0.55; // Deep, architectural tone
    utterance.rate = 0.75; 

    const voices = window.speechSynthesis.getVoices();
    const deepVoice = voices.find(v => v.name.includes('Male') || v.name.includes('UK English'));
    if (deepVoice) utterance.voice = deepVoice;

    utterance.onstart = () => {
      setIsSpeaking(true);
      onSpeechStart(); // Sync with 3D Robot
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      onSpeechEnd(); // Return Robot to Idle
    };

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className={cn(
      "p-6 rounded-2xl border transition-all duration-500",
      isFeatureEnabled 
        ? "bg-black/40 border-amber-900/30 shadow-[0_0_30px_rgba(120,60,0,0.1)]" 
        : "bg-black/10 border-white/5 opacity-50 grayscale"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-black text-amber-500 uppercase tracking-[0.3em] flex items-center gap-2">
          <Sparkles className="h-4 w-4" /> 
          Linguistic_Anchor
        </h2>
        {!isFeatureEnabled && (
          <div className="flex items-center gap-2 text-[10px] text-amber-500/50 font-mono">
            <Lock className="h-3 w-3" /> FEATURE_LOCKED
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* Input */}
        <div className="relative">
          <input 
            type="text"
            disabled={!isFeatureEnabled}
            value={inputText}
            onChange={(e) => handleTranslate(e.target.value)}
            placeholder={isFeatureEnabled ? "Speak to the Engine..." : "Enable Egyptian Logic in Sidebar"}
            className="w-full bg-black/60 border border-white/5 p-4 rounded-xl text-amber-100 placeholder:text-white/10 focus:border-amber-500/50 outline-none transition-all font-serif text-lg"
          />
        </div>

        {/* Phonetic Result */}
        <div className="bg-black/80 p-8 rounded-xl border border-white/5 min-h-[120px] flex items-center justify-center text-6xl tracking-[0.2em] text-amber-500/90 shadow-inner">
          {hieroglyphs || "𓄿𓇋𓅱"}
        </div>

        {/* Action Button */}
        <button 
          onClick={playAIVoice}
          disabled={!isFeatureEnabled || !inputText}
          className={cn(
            "w-full py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-95",
            isFeatureEnabled && inputText 
              ? "bg-amber-600 text-white shadow-lg shadow-amber-900/20 hover:bg-amber-500" 
              : "bg-white/5 text-white/10 cursor-not-allowed"
          )}
        >
          {isSpeaking ? (
            <div className="flex gap-1">
              {[1,2,3].map(i => <div key={i} className="w-1 h-3 bg-white animate-pulse" />)}
            </div>
          ) : (
            <>
              <Volume2 className="h-4 w-4" />
              Activate_Vocal_Logic
            </>
          )}
        </button>

        {/* Doc Link */}
        <div className="flex items-center justify-center gap-2 pt-2">
          <BookOpen className="h-3 w-3 text-slate-600" />
          <span className="text-[9px] text-slate-600 uppercase font-bold tracking-widest">
            Check /Docs for Phonetic Grammar
          </span>
        </div>
      </div>
    </div>
  );
}