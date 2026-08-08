'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  X,
  Volume2,
  Sparkles,
  Loader2,
  Radio,
  MessageSquare,
  Activity,
  Bot,
  User,
} from 'lucide-react';

interface VoiceCoPilotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceCoPilotModal: React.FC<VoiceCoPilotModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcripts, setTranscripts] = useState<
    Array<{ sender: 'user' | 'gemini'; text: string }>
  >([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const [inputText, setInputText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  if (!isOpen) return null;

  const pcmToBase64 = (float32Array: Float32Array): string => {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    let binary = '';
    const bytes = new Uint8Array(int16Array.buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const sendChunk = (base64Audio: string) => {
    if (abortRef.current && abortRef.current.signal) {
      // No-op: audio streaming via WebSocket is not available in this Next.js build.
      // The server side of the co-pilot returns text transcripts via SSE.
    }
  };

  const handleUserText = async (text?: string) => {
    const message = (text ?? inputText).trim();
    if (!message) return;

    setTranscripts((prev) => [...prev, { sender: 'user', text: message }]);
    setInputText('');
    setIsConnecting(true);
    setError(null);

    const controller = new AbortController();
    abortRef.current = controller;
    setIsConnected(true);

    try {
      const res = await fetch('/api/wonder-build/template-library/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Voice co-pilot request failed.');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE format: "data: {...}\n\n"
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const chunk of lines) {
          const dataLine = chunk.split('\n').find((l) => l.startsWith('data:'));
          if (!dataLine) continue;
          const payload = dataLine.replace(/^data:\s*/, '');
          try {
            const json = JSON.parse(payload);
            if (json.transcript) {
              setTranscripts((prev) => {
                const last = prev[prev.length - 1];
                if (last && last.sender === 'gemini') {
                  return [
                    ...prev.slice(0, -1),
                    { sender: 'gemini', text: last.text + json.transcript },
                  ];
                }
                return [...prev, { sender: 'gemini', text: json.transcript }];
              });
            }
            if (json.done) {
              setAudioLevel(0);
            }
          } catch {
            // ignore partial json
          }
        }
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.error('Voice Co-Pilot error:', err);
        setError(err.message || 'Voice Co-Pilot connection failed.');
        setTranscripts((prev) => [
          ...prev,
          {
            sender: 'gemini',
            text: err.message || 'Voice Co-Pilot connection failed.',
          },
        ]);
      }
    } finally {
      setIsConnecting(false);
      setIsConnected(false);
    }
  };

  const startVoiceSession = async () => {
    // Keep mic capture for visual feedback but drive the conversation via text (SSE).
    setIsConnecting(true);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const inputCtx = new (window.AudioContext ||
        (window as any).webkitAudioContext)({ sampleRate: 16000 });
      inputAudioCtxRef.current = inputCtx;

      const sourceNode = inputCtx.createMediaStreamSource(stream);
      const processorNode = inputCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processorNode;

      sourceNode.connect(processorNode);
      processorNode.connect(inputCtx.destination);

      processorNode.onaudioprocess = (e) => {
        const channelData = e.inputBuffer.getChannelData(0);
        let sum = 0;
        for (let i = 0; i < channelData.length; i++) {
          sum += channelData[i] * channelData[i];
        }
        const rms = Math.sqrt(sum / channelData.length);
        setAudioLevel(Math.min(100, Math.round(rms * 250)));
      };

      setIsConnected(true);
      setTranscripts((prev) => [
        ...prev,
        { sender: 'gemini', text: 'Hello! I am WonderVoice Co-Pilot. How can I help customize your template?' },
      ]);
    } catch (err: any) {
      console.error('Mic access failed:', err);
      setError(err.message || 'Microphone access was denied. You can still type a message below.');
      setIsConnecting(false);
    }
  };

  const stopVoiceSession = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close();
      inputAudioCtxRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
    setAudioLevel(0);
  };

  useEffect(() => {
    return () => {
      stopVoiceSession();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Radio className="w-5 h-5 text-slate-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-lg text-white">WonderVoice Co-Pilot</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                  gemini-live
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Streaming text conversation powered by Gemini Live API.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopVoiceSession();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 flex flex-col items-center justify-between space-y-6 overflow-y-auto">
          {/* Animated Voice Orb Visualizer */}
          <div className="flex flex-col items-center justify-center space-y-4 my-2">
            <div
              style={{
                transform: `scale(${1 + audioLevel / 180})`,
                boxShadow: isConnected
                  ? `0 0 ${20 + audioLevel}px rgba(16, 185, 129, 0.5)`
                  : 'none',
              }}
              className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-150 ${
                isConnected
                  ? 'bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 text-slate-950'
                  : 'bg-slate-800 text-slate-500 border border-slate-700'
              }`}
            >
              {isConnecting ? (
                <Loader2 className="w-10 h-10 animate-spin text-emerald-400" />
              ) : isConnected ? (
                <Mic className="w-10 h-10 animate-pulse" />
              ) : (
                <MicOff className="w-10 h-10" />
              )}
            </div>

            <div className="text-center space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {isConnected
                  ? 'Live Co-Pilot Session Active'
                  : isConnecting
                  ? 'Streaming Response...'
                  : 'Voice Co-Pilot Offline'}
              </span>
              <p className="text-xs text-slate-500">
                {isConnected
                  ? 'Type a message below to talk with WonderVoice AI.'
                  : 'Click Start below or just type a message to begin.'}
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="w-full p-3 bg-red-950/50 border border-red-500/50 rounded-xl text-red-300 text-xs">
              {error}
            </div>
          )}

          {/* Transcript Box */}
          <div className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 max-h-48 overflow-y-auto space-y-3 text-xs">
            <div className="flex items-center space-x-1.5 text-slate-400 font-bold text-[11px] uppercase pb-2 border-b border-slate-900">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>Real-time Live Transcript</span>
            </div>

            {transcripts.length === 0 ? (
              <p className="text-slate-600 italic text-center py-4">
                Transcripts will appear here in real-time as you converse.
              </p>
            ) : (
              transcripts.map((t, idx) => (
                <div
                  key={idx}
                  className={`flex items-start space-x-2 ${
                    t.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {t.sender === 'gemini' && (
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-3 h-3" />
                    </div>
                  )}
                  <div
                    className={`p-2.5 rounded-xl max-w-[80%] ${
                      t.sender === 'user'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-900 text-slate-200 border border-slate-800'
                    }`}
                  >
                    {t.text}
                  </div>
                  {t.sender === 'user' && (
                    <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-3 h-3" />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Text Input */}
          <div className="w-full flex items-center space-x-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUserText()}
              placeholder="Type a message for WonderVoice AI..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <button
              onClick={() => handleUserText()}
              disabled={isConnecting || !inputText.trim()}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </div>

          {/* Controls */}
          <div className="w-full pt-2 flex items-center justify-center space-x-3">
            {!isConnected && !isConnecting ? (
              <button
                onClick={startVoiceSession}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Mic className="w-4 h-4" />
                <span>Start Live Co-Pilot Session</span>
              </button>
            ) : (
              <button
                onClick={stopVoiceSession}
                disabled={isConnecting}
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                <MicOff className="w-4 h-4" />
                <span>{isConnecting ? 'Streaming...' : 'Disconnect Co-Pilot'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
