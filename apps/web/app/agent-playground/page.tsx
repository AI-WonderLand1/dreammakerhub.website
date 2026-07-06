"use client";

import { useState, useRef, useEffect } from "react";

type Persona = "spirit_guide" | "orchestrator" | "rick" | "default";

interface Message {
  id: string;
  role: "user" | "assistant";
  persona: Persona;
  content: string;
  timestamp: number;
}

interface Confession {
  id: number;
  type: "error" | "uncertainty" | "limitation" | "violation" | "admission";
  content: string;
  acknowledged: boolean;
}

type VoiceOption = "none" | "female" | "male" | "whisper";

const PERSONA_INFO = {
  default: { name: "Default", icon: "🤖", color: "from-gray-500 to-slate-600", placeholder: "Ask anything..." },
  rick: { name: "Rick", icon: "🍺", color: "from-green-500 to-emerald-600", placeholder: "Morty, I need you to..." },
  spirit_guide: { name: "Spirit Guide", icon: "🔮", color: "from-violet-500 to-purple-600", placeholder: "Ask for guidance..." },
  orchestrator: { name: "Orchestrator", icon: "⚡", color: "from-cyan-500 to-blue-600", placeholder: "Define your mission..." },
};

const VOICE_LABELS = { none: "None", female: "Female (Calm)", male: "Male (Deep)", whisper: "Whisper" };
const TYPE_ICONS = { error: "❌", uncertainty: "🤔", limitation: "⚠️", violation: "🚫", admission: "🤝" };

export default function AIPersonaPlayground() {
  const [selectedPersona, setSelectedPersona] = useState<Persona>("spirit_guide");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [confessions, setConfessions] = useState<Confession[]>([
    { id: 1, type: "uncertainty", content: "Limited context for complex decisions", acknowledged: false },
    { id: 2, type: "limitation", content: "API response time varies by load", acknowledged: false },
  ]);
  const [confessionsExpanded, setConfessionsExpanded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<{ showConfessions: boolean; voice: VoiceOption }>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ai-playground-settings");
      if (saved) return JSON.parse(saved);
    }
    return { showConfessions: true, voice: "none" };
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem("ai-playground-settings", JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettings(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function sendMessage() {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: "user", content: input, persona: selectedPersona, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/agent/playground", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persona: selectedPersona, question: input, user_id: "playground" }),
      });
      const data = await response.json();

      if (!data.ok) {
        setConfessions((prev) => [...prev, { id: Date.now(), type: "error", content: data.error || "Connection failed", acknowledged: false }]);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.ok ? data.answer : "Something went wrong",
        persona: selectedPersona,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setConfessions((prev) => [...prev, { id: Date.now(), type: "error", content: "Connection failed", acknowledged: false }]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  function acknowledgeConfession(id: number) {
    setConfessions((prev) => prev.map((c) => c.id === id ? { ...c, acknowledged: true } : c));
  }

  function acknowledgeAll() {
    setConfessions((prev) => prev.map((c) => ({ ...c, acknowledged: true })));
  }

  const unacknowledgedCount = confessions.filter((c) => !c.acknowledged).length;
  const persona = PERSONA_INFO[selectedPersona];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-4">
      <div className="mx-auto max-w-3xl space-y-4">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">AI Wonderland Persona Playground</h1>
          <p className="text-gray-400">Train and interact with unique AI personas from AI Wonderland</p>
        </div>

        {/* Persona Selector */}
        <div className="flex justify-center gap-2 flex-wrap">
          {(Object.keys(PERSONA_INFO) as Persona[]).map((p) => {
            const info = PERSONA_INFO[p];
            const isSelected = selectedPersona === p;
            return (
              <button key={p} onClick={() => setSelectedPersona(p)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${isSelected ? `bg-gradient-to-r ${info.color} border-transparent text-white` : "border-white/20 text-gray-400 hover:border-white/40"}`}>
                <span>{info.icon}</span>
                <span className="font-medium hidden sm:inline">{info.name}</span>
              </button>
            );
          })}
        </div>

        {/* Chat Container */}
        <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl overflow-hidden">
          {/* Chat Header */}
          <div className={`p-4 border-b border-white/10 bg-gradient-to-r ${persona.color} flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{persona.icon}</span>
              <div>
                <div className="font-semibold text-white">{persona.name}</div>
                <div className="text-xs text-white/70">{isLoading ? "Thinking..." : "Ready"}</div>
              </div>
            </div>
            {/* Settings */}
            <div className="relative" ref={settingsRef}>
              <button onClick={() => setShowSettings(!showSettings)} className="p-2 rounded-lg bg-white/10 hover:bg-white/20">
                <span>⚙️</span>
              </button>
              {showSettings && (
                <div className="absolute right-0 top-12 w-56 bg-gray-900 border border-white/20 rounded-xl shadow-xl z-50 p-3 space-y-3">
                  <div className="text-sm font-medium text-white">⚙️ Settings</div>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm text-gray-300">Show Confessions</span>
                    <div onClick={() => setSettings({ ...settings, showConfessions: !settings.showConfessions })}
                      className={`w-10 h-6 rounded-full relative cursor-pointer transition-colors ${settings.showConfessions ? "bg-purple-500" : "bg-gray-600"}`}>
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${settings.showConfessions ? "translate-x-5" : "translate-x-1"}`} />
                    </div>
                  </label>
                  <div>
                    <label className="text-xs text-gray-400">🔊 Voice</label>
                    <select value={settings.voice} onChange={(e) => setSettings({ ...settings, voice: e.target.value as VoiceOption })}
                      className="w-full mt-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white">
                      {(Object.keys(VOICE_LABELS) as VoiceOption[]).map((v) => (
                        <option key={v} value={v}>{VOICE_LABELS[v]}</option>
                      ))}
                    </select>
                  </div>
                  <div className="pt-2 border-t border-white/10">
                    <button onClick={() => { setShowSettings(false); window.location.href = "/dashboard/settings"; }}
                      className="flex items-center gap-2 text-sm text-gray-300 hover:text-white w-full">
                      <span>🌐</span><span>Language Settings</span><span className="ml-auto">→</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="h-[400px] overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <span className="text-4xl mb-4 opacity-50">{persona.icon}</span>
                <p>Start a conversation with {persona.name}</p>
              </div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${msg.role === "user" ? "bg-blue-500/20" : "bg-white/10"}`}>
                  <span>{msg.role === "user" ? "👤" : PERSONA_INFO[msg.persona].icon}</span>
                </div>
                <div className={`max-w-[75%] rounded-2xl p-4 ${msg.role === "user" ? "bg-blue-500/20 border border-blue-500/30" : `bg-gradient-to-br ${PERSONA_INFO[msg.persona].color} bg-opacity-20 border border-white/20`}`}>
                  <p className="text-sm text-gray-200 whitespace-pre-wrap">{msg.content}</p>
                  <p className="text-xs text-gray-500 mt-2">{new Date(msg.timestamp).toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><span>{persona.icon}</span></div>
                <div className={`rounded-2xl p-4 bg-gradient-to-br ${persona.color} bg-opacity-20 border border-white/20`}>
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Confessions Panel */}
          {settings.showConfessions && confessions.length > 0 && (
            <div className="border-t border-white/10 bg-white/5">
              <button onClick={() => setConfessionsExpanded(!confessionsExpanded)}
                className="w-full p-3 flex items-center justify-between text-sm hover:bg-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-orange-400">⚠️</span>
                  <span className="text-gray-300">Confessions</span>
                  {unacknowledgedCount > 0 && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-orange-500/20 text-orange-400">{unacknowledgedCount}</span>
                  )}
                </div>
                <span className="text-gray-400">{confessionsExpanded ? "▼" : "▲"}</span>
              </button>
              {confessionsExpanded && (
                <div className="p-3 space-y-2 max-h-48 overflow-y-auto">
                  {confessions.map((c) => (
                    <div key={c.id} className={`p-2 rounded-lg text-xs flex items-start gap-2 ${c.acknowledged ? "bg-white/5 opacity-50" : "bg-white/10"}`}>
                      <span>{TYPE_ICONS[c.type] || "📝"}</span>
                      <span className="flex-1 text-gray-300">{c.content}</span>
                      {!c.acknowledged && (
                        <button onClick={() => acknowledgeConfession(c.id)} className="text-purple-400 hover:text-purple-300">✓</button>
                      )}
                    </div>
                  ))}
                  {unacknowledgedCount > 0 && (
                    <button onClick={acknowledgeAll} className="w-full text-xs text-purple-400 hover:text-purple-300 py-1">
                      Acknowledge All ({unacknowledgedCount})
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-white/10">
            <div className="flex gap-2">
              <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
                placeholder={persona.placeholder} rows={2}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 resize-none focus:outline-none focus:border-purple-500/50"
                disabled={isLoading} />
              <button onClick={sendMessage} disabled={!input.trim() || isLoading}
                className={`px-6 py-3 rounded-xl font-medium ${input.trim() && !isLoading ? `bg-gradient-to-r ${persona.color} text-white` : "bg-gray-700 text-gray-500"}`}>
                {isLoading ? "..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
