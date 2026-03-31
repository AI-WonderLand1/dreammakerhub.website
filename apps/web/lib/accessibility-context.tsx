'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { screenReader } from './screen-reader';

export type EngineType = 'playcanvas' | 'webgl' | 'puck' | 'theia';

export interface TranscriptItem {
  id: string;
  text: string;
  timestamp: number;
  type: 'ai' | 'voice-command' | 'system' | 'engine-narration';
  engineContext?: EngineType;
}

export interface AccessibilityContextType {
  // TTS Settings
  voiceEnabled: boolean;
  setVoiceEnabled: (enabled: boolean) => void;
  speak: (text: string, context?: EngineType) => void;
  stopSpeaking: () => void;

  // Captions/Transcript
  transcriptEnabled: boolean;
  setTranscriptEnabled: (enabled: boolean) => void;
  transcript: TranscriptItem[];
  addTranscript: (item: Omit<TranscriptItem, 'id' | 'timestamp'>) => void;
  clearTranscript: () => void;

  // Engine Context
  currentEngine: EngineType | null;
  setCurrentEngine: (engine: EngineType) => void;

  // Settings
  speechRate: number;
  setSpeechRate: (rate: number) => void;
  voicePitch: number;
  setVoicePitch: (pitch: number) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [transcriptEnabled, setTranscriptEnabled] = useState(true);
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [currentEngine, setCurrentEngine] = useState<EngineType | null>(null);
  const [speechRate, setSpeechRate] = useState(1);
  const [voicePitch, setVoicePitch] = useState(1);

  // Initialize keyboard shortcut
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl + Alt + V to toggle voice
      if ((e.ctrlKey || e.metaKey) && e.altKey && e.key === 'v') {
        e.preventDefault();
        setVoiceEnabled((prev) => !prev);
        screenReader.setEnabled(!voiceEnabled);
      }

      // Ctrl + Alt + C to toggle captions
      if ((e.ctrlKey || e.metaKey) && e.altKey && e.key === 'c') {
        e.preventDefault();
        setTranscriptEnabled((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [voiceEnabled]);

  const speak = useCallback(
    (text: string, context?: EngineType) => {
      if (!voiceEnabled || !screenReader.isAvailable()) return;

      // Add engine context to speech
      let fullText = text;
      if (context) {
        const contextPrefix = {
          playcanvas: 'In PlayCanvas: ',
          webgl: 'In WebGL Studio: ',
          puck: 'In Puck UI: ',
          theia: 'In Theia Editor: ',
        };
        fullText = contextPrefix[context] + text;
      }

      // Speak with configured rate and pitch
      screenReader.speak(fullText, {
        rate: speechRate,
        pitch: voicePitch,
      });

      // Add to transcript
      if (transcriptEnabled) {
        addTranscript({
          text: fullText,
          type: 'system',
          engineContext: context,
        });
      }
    },
    [voiceEnabled, transcriptEnabled, speechRate, voicePitch]
  );

  const stopSpeaking = useCallback(() => {
    screenReader.stop();
  }, []);

  const addTranscript = useCallback((item: Omit<TranscriptItem, 'id' | 'timestamp'>) => {
    const newItem: TranscriptItem = {
      ...item,
      id: `transcript-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
    };

    setTranscript((prev) => {
      // Keep only last 20 items
      const updated = [...prev, newItem].slice(-20);
      return updated;
    });
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript([]);
  }, []);

  const value: AccessibilityContextType = {
    voiceEnabled,
    setVoiceEnabled: (enabled) => {
      setVoiceEnabled(enabled);
      screenReader.setEnabled(enabled);
    },
    speak,
    stopSpeaking,
    transcriptEnabled,
    setTranscriptEnabled,
    transcript,
    addTranscript,
    clearTranscript,
    currentEngine,
    setCurrentEngine,
    speechRate,
    setSpeechRate,
    voicePitch,
    setVoicePitch,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
}
