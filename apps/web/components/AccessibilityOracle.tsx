'use client';

import { useAccessibility } from '@/lib/accessibility-context';
import { useState } from 'react';

export function AccessibilityOracle() {
  const {
    voiceEnabled,
    setVoiceEnabled,
    transcriptEnabled,
    setTranscriptEnabled,
    speechRate,
    setSpeechRate,
    voicePitch,
    setVoicePitch,
    transcript,
    clearTranscript,
    speak,
  } = useAccessibility();

  const [panelOpen, setPanelOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      {/* Floating Accessibility Button */}
      <button
        onClick={() => setPanelOpen(!panelOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 transition-all duration-300 shadow-lg neon-glow flex items-center justify-center group"
        title="Accessibility Oracle (Alt + A)"
        aria-label="Open Accessibility Menu"
      >
        <span className="text-2xl group-hover:scale-110 transition">♿</span>

        {/* Notification badge */}
        {(voiceEnabled || transcriptEnabled) && (
          <span className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
        )}
      </button>

      {/* Accessibility Control Panel */}
      {panelOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 border-2 border-cyan-500/50 rounded-lg bg-black/95 backdrop-blur-xl shadow-2xl animated-in fade-in slide-in-from-bottom-4">
          {/* Header */}
          <div className="border-b border-cyan-500/30 p-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-cyan-300">⚡ Accessibility Oracle</h3>
            <button
              onClick={() => setPanelOpen(false)}
              className="text-white/60 hover:text-white transition"
            >
              ✕
            </button>
          </div>

          <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
            {/* Voice Toggle */}
            <div className="flex items-center justify-between p-3 rounded border border-cyan-500/30 bg-cyan-500/5">
              <div className="flex items-center gap-2">
                <span className="text-lg">🔊</span>
                <div>
                  <p className="font-semibold text-white">Voice (TTS)</p>
                  <p className="text-xs text-white/60">Screen reader for blind users</p>
                </div>
              </div>
              <button
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className={`w-12 h-6 rounded-full transition relative ${
                  voiceEnabled ? 'bg-green-600' : 'bg-white/20'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition ${
                    voiceEnabled ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Captions Toggle */}
            <div className="flex items-center justify-between p-3 rounded border border-cyan-500/30 bg-cyan-500/5">
              <div className="flex items-center gap-2">
                <span className="text-lg">📝</span>
                <div>
                  <p className="font-semibold text-white">Captions</p>
                  <p className="text-xs text-white/60">Visual transcripts for deaf users</p>
                </div>
              </div>
              <button
                onClick={() => setTranscriptEnabled(!transcriptEnabled)}
                className={`w-12 h-6 rounded-full transition relative ${
                  transcriptEnabled ? 'bg-green-600' : 'bg-white/20'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition ${
                    transcriptEnabled ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Speech Settings */}
            {voiceEnabled && (
              <div className="p-3 rounded border border-purple-500/30 bg-purple-500/5 space-y-3">
                <h4 className="font-semibold text-purple-300 flex items-center gap-2">
                  🎚️ Voice Settings
                </h4>

                {/* Speech Rate */}
                <div>
                  <label className="text-sm text-white/70 flex items-center justify-between mb-2">
                    <span>Speed</span>
                    <span className="text-xs bg-purple-500/20 px-2 py-1 rounded">{(speechRate * 100).toFixed(0)}%</span>
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={speechRate}
                    onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                    className="w-full h-2 bg-purple-900 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <p className="text-xs text-white/50 mt-1">0.5x - 2x speed</p>
                </div>

                {/* Pitch */}
                <div>
                  <label className="text-sm text-white/70 flex items-center justify-between mb-2">
                    <span>Pitch</span>
                    <span className="text-xs bg-purple-500/20 px-2 py-1 rounded">{voicePitch.toFixed(1)}</span>
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={voicePitch}
                    onChange={(e) => setVoicePitch(parseFloat(e.target.value))}
                    className="w-full h-2 bg-purple-900 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <p className="text-xs text-white/50 mt-1">Lower to higher</p>
                </div>

                {/* Test Button */}
                <button
                  onClick={() => speak('Testing voice settings. Adjust speed and pitch to your preference.')}
                  className="w-full py-2 rounded bg-purple-600 hover:bg-purple-700 transition text-sm font-semibold text-white"
                >
                  🔊 Test Voice
                </button>
              </div>
            )}

            {/* Transcript History */}
            {transcript.length > 0 && (
              <div className="p-3 rounded border border-green-500/30 bg-green-500/5">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-green-300 flex items-center gap-2">
                    📋 Transcript ({transcript.length})
                  </h4>
                  <button
                    onClick={clearTranscript}
                    className="text-xs bg-red-500/20 text-red-300 hover:bg-red-500/40 px-2 py-1 rounded transition"
                  >
                    Clear
                  </button>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {transcript.slice(-5).map((item) => (
                    <div key={item.id} className="text-xs p-2 rounded bg-black/50 border border-green-500/20">
                      <p className="text-green-300 font-mono">{item.text}</p>
                      <p className="text-white/40 text-xs mt-1">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Keyboard Shortcuts */}
            <div className="p-3 rounded border border-yellow-500/30 bg-yellow-500/5">
              <h4 className="font-semibold text-yellow-300 mb-2">⌨️ Shortcuts</h4>
              <div className="space-y-1 text-xs text-white/70">
                <p>
                  <kbd className="bg-black/50 px-2 py-1 rounded">Ctrl+Alt+V</kbd> Toggle voice
                </p>
                <p>
                  <kbd className="bg-black/50 px-2 py-1 rounded">Ctrl+Alt+C</kbd> Toggle captions
                </p>
                <p>
                  <kbd className="bg-black/50 px-2 py-1 rounded">Esc</kbd> Close panel
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-cyan-500/30 p-3 text-xs text-white/50 text-center">
            <p>AI-WONDERLAND Accessibility Oracle v1.0</p>
            <p>Making creation accessible to everyone</p>
          </div>
        </div>
      )}

      {/* Close on Escape */}
      {panelOpen && (
        <div
          onClick={() => setPanelOpen(false)}
          className="fixed inset-0 z-40"
          role="presentation"
        />
      )}
    </>
  );
}
