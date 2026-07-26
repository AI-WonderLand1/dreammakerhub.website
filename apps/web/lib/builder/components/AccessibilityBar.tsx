'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useBuilderStore } from '../store';

export default function AccessibilityBar() {
  const {
    highContrast, setHighContrast,
    uiScale, setUiScale,
    themeMode, setThemeMode,
    voiceInputEnabled, setVoiceInputEnabled,
    setShortcutsModalOpen,
  } = useBuilderStore();

  const [listening, setListening] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('high-contrast', highContrast);
  }, [highContrast]);

  useEffect(() => {
    document.documentElement.style.fontSize = `${uiScale}%`;
  }, [uiScale]);

  useEffect(() => {
    document.documentElement.classList.toggle('theme-light', themeMode === 'light');
    document.documentElement.classList.toggle('theme-dark', themeMode === 'dark');
  }, [themeMode]);

  const handleVoiceToggle = useCallback(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setVoiceInputEnabled(!voiceInputEnabled);
      if (!voiceInputEnabled) {
        setListening(true);
      }
    }
  }, [voiceInputEnabled, setVoiceInputEnabled]);

  useEffect(() => {
    if (!voiceInputEnabled) {
      setListening(false);
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const text = event.results[i][0].transcript.toLowerCase();
          if (text.includes('add block') || text.includes('insert')) {
            setListening(false);
          }
        }
      }
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => { if (voiceInputEnabled) recognition.start(); };

    recognition.start();
    return () => recognition.abort();
  }, [voiceInputEnabled]);

  return (
    <div className="flex items-center gap-1" role="toolbar" aria-label="Accessibility settings">
      {/* Theme toggle */}
      <button
        onClick={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
        className="px-1.5 py-1 rounded text-[10px] text-white/40 hover:text-white hover:bg-white/5 transition-colors"
        title={`Switch to ${themeMode === 'dark' ? 'light' : 'dark'} theme`}
        aria-label={`Switch to ${themeMode === 'dark' ? 'light' : 'dark'} theme`}
      >
        {themeMode === 'dark' ? '☀️' : '🌙'}
      </button>

      {/* High contrast */}
      <button
        onClick={() => setHighContrast(!highContrast)}
        className={`px-1.5 py-1 rounded text-[10px] font-semibold transition-colors ${
          highContrast ? 'bg-yellow-500/20 text-yellow-300' : 'text-white/40 hover:text-white hover:bg-white/5'
        }`}
        title="Toggle high contrast mode"
        aria-label="Toggle high contrast mode"
        aria-pressed={highContrast}
      >
        {highContrast ? '🔲' : '◻️'}
      </button>

      {/* UI Scale */}
      <div className="flex items-center gap-1" role="group" aria-label="UI scale">
        <button
          onClick={() => setUiScale(uiScale - 10)}
          className="px-1 py-0.5 rounded text-[10px] text-white/40 hover:text-white hover:bg-white/5 transition-colors"
          aria-label="Decrease UI size"
        >
          A-
        </button>
        <span className="text-[9px] font-mono text-white/30 w-7 text-center">{uiScale}%</span>
        <button
          onClick={() => setUiScale(uiScale + 10)}
          className="px-1 py-0.5 rounded text-[10px] text-white/40 hover:text-white hover:bg-white/5 transition-colors"
          aria-label="Increase UI size"
        >
          A+
        </button>
      </div>

      <span className="text-white/20 mx-0.5">|</span>

      {/* Keyboard shortcuts */}
      <button
        onClick={() => setShortcutsModalOpen(true)}
        className="px-1.5 py-1 rounded text-[10px] text-white/40 hover:text-white hover:bg-white/5 transition-colors"
        title="Keyboard shortcuts"
        aria-label="Show keyboard shortcuts"
      >
        ⌨️ Keys
      </button>

      {/* Voice input */}
      <button
        onClick={handleVoiceToggle}
        className={`px-1.5 py-1 rounded text-[10px] font-semibold transition-colors ${
          listening ? 'bg-green-600/30 text-green-300 animate-pulse' : 'text-white/40 hover:text-white hover:bg-white/5'
        }`}
        title={listening ? 'Voice input active' : 'Toggle voice input'}
        aria-label={listening ? 'Voice input is active' : 'Toggle voice input'}
        aria-pressed={listening}
      >
        {listening ? '🎤' : '🎙️'}
      </button>
    </div>
  );
}
