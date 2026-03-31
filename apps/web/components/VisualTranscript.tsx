'use client';

import { useAccessibility } from '@/lib/accessibility-context';
import { useEffect, useRef } from 'react';

export function VisualTranscript() {
  const { transcript, transcriptEnabled, currentEngine } = useAccessibility();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest transcript
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
    }
  }, [transcript]);

  if (!transcriptEnabled || transcript.length === 0) {
    return null;
  }

  const latestItem = transcript[transcript.length - 1];

  const typeStyles = {
    ai: 'border-purple-500/50 bg-purple-500/10 text-purple-300',
    'voice-command': 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300',
    system: 'border-green-500/50 bg-green-500/10 text-green-300',
    'engine-narration': 'border-yellow-500/50 bg-yellow-500/10 text-yellow-300',
  };

  const typeIcons = {
    ai: '🤖',
    'voice-command': '🎤',
    system: '⚙️',
    'engine-narration': '👁️',
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-4 pointer-events-none">
      {/* Transcript Bubble */}
      <div
        className={`mx-auto max-w-2xl border-2 rounded-xl p-4 backdrop-blur-lg transition-all duration-300 pointer-events-auto ${
          typeStyles[latestItem.type as keyof typeof typeStyles]
        } shadow-lg neon-glow`}
        style={{
          boxShadow: `0 0 20px ${
            latestItem.type === 'ai'
              ? '#c084fc'
              : latestItem.type === 'voice-command'
                ? '#06b6d4'
                : latestItem.type === 'system'
                  ? '#22c55e'
                  : '#eab308'
          }`,
        }}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <span className="text-xl flex-shrink-0 mt-0.5">
            {typeIcons[latestItem.type as keyof typeof typeIcons]}
          </span>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-widest opacity-70">
                {latestItem.type === 'ai'
                  ? 'AI Response'
                  : latestItem.type === 'voice-command'
                    ? 'Voice Command'
                    : latestItem.type === 'system'
                      ? 'System'
                      : 'Narration'}
              </span>

              {latestItem.engineContext && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full opacity-70 border"
                  style={{
                    borderColor: 'currentColor',
                    opacity: 0.5,
                  }}
                >
                  {latestItem.engineContext === 'playcanvas' && '🎮 PlayCanvas'}
                  {latestItem.engineContext === 'webgl' && '✨ WebGL'}
                  {latestItem.engineContext === 'puck' && '📐 Puck'}
                  {latestItem.engineContext === 'theia' && '💻 Theia'}
                </span>
              )}
            </div>

            <p className="text-sm leading-relaxed break-words font-mono">{latestItem.text}</p>
          </div>

          {/* Close */}
          <button
            onClick={() => {}}
            className="flex-shrink-0 text-lg opacity-50 hover:opacity-100 transition"
            title="Close (Esc)"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Transcript History (Scrollable) */}
      {transcript.length > 1 && (
        <div
          ref={scrollContainerRef}
          className="mt-2 max-w-2xl mx-auto flex gap-2 overflow-x-auto pb-2 scroll-smooth"
        >
          {transcript.slice(-5).map((item) => (
            <div
              key={item.id}
              className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs border backdrop-blur-sm whitespace-nowrap truncate ${
                typeStyles[item.type as keyof typeof typeStyles]
              }`}
            >
              {typeIcons[item.type as keyof typeof typeIcons]} {item.text.substring(0, 40)}...
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
