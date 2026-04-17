"use client";

import { useState } from "react";

type Persona = "spirit_guide" | "orchestrator" | "rick" | "default";

interface Message {
  role: "user" | "assistant";
  content: string;
  persona: Persona;
}

const PERSONA_INFO = {
  default: {
    name: "Default",
    icon: "🤖",
    description: "Practical senior engineer",
    color: "from-gray-500 to-slate-600",
    placeholder: "Ask anything...",
  },
  rick: {
    name: "Rick",
    icon: "🍺",
    description: "Brilliant, blunt, witty",
    color: "from-green-500 to-emerald-600",
    placeholder: "Morty, I need you to...",
  },
  spirit_guide: {
    name: "Spirit Guide",
    icon: "🔮",
    description: "Mystical wisdom and intuition",
    color: "from-violet-500 to-purple-600",
    placeholder: "Ask for guidance on your path...",
  },
  orchestrator: {
    name: "Orchestrator",
    icon: "⚡",
    description: "Execution and planning",
    color: "from-cyan-500 to-blue-600",
    placeholder: "Define your mission...",
  },
};

export default function AIPersonaPlayground() {
  const [selectedPersona, setSelectedPersona] = useState<Persona>("spirit_guide");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const persona = PERSONA_INFO[selectedPersona];

  async function sendMessage() {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      persona: selectedPersona,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/agent/playground", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          persona: selectedPersona,
          question: input,
          user_id: "playground",
        }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        role: "assistant",
        content: data.ok ? data.answer : data.error || "Something went wrong",
        persona: selectedPersona,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Connection failed. Is the agent server running?",
          persona: selectedPersona,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function clearChat() {
    setMessages([]);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-4">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">AI Persona Playground</h1>
          <p className="text-gray-400">Train and interact with unique AI personas</p>
        </div>

        <div className="mb-6 flex justify-center gap-4">
          {(Object.keys(PERSONA_INFO) as Persona[]).map((p) => {
            const info = PERSONA_INFO[p];
            const isSelected = selectedPersona === p;
            return (
              <button
                key={p}
                onClick={() => setSelectedPersona(p)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                  isSelected
                    ? `bg-gradient-to-r ${info.color} border-transparent text-white`
                    : "border-white/20 text-gray-400 hover:border-white/40"
                }`}
              >
                <span>{info.icon}</span>
                <span className="font-medium">{info.name}</span>
              </button>
            );
          })}
        </div>

        <div className="mb-4 text-center">
          <span className="text-sm text-gray-500">
            {persona.description}
          </span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl overflow-hidden">
          <div className={`p-4 border-b border-white/10 bg-gradient-to-r ${persona.color}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{persona.icon}</span>
                <span className="font-semibold text-white">{persona.name}</span>
              </div>
              <button
                onClick={clearChat}
                className="text-xs text-white/60 hover:text-white"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="h-[400px] overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <span className="text-4xl mb-4">{persona.icon}</span>
                <p>Start a conversation with {persona.name}</p>
              </div>
            )}

            {messages.map((msg, idx) => {
              const personaStyle = {
                default: "from-gray-600/20 to-slate-600/20 border-gray-500/30",
                rick: "from-green-600/20 to-emerald-600/20 border-green-500/30",
                spirit_guide: "from-violet-600/20 to-purple-600/20 border-violet-500/30",
                orchestrator: "from-cyan-600/20 to-blue-600/20 border-cyan-500/30",
              }[msg.persona] || "from-gray-600/20 to-slate-600/20 border-gray-500/30";
              
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl ${
                    msg.role === "user"
                      ? "ml-12 bg-blue-600/20 border border-blue-500/30"
                      : `mr-12 bg-gradient-to-r ${personaStyle}`
                  }`}
                >
                  <p className="text-sm text-gray-200 whitespace-pre-wrap">
                    {msg.content}
                  </p>
                </div>
              );
            })}

            {isLoading && (
              <div className="mr-12 p-4 rounded-xl bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border border-cyan-500/30">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full bg-cyan-500 animate-pulse" />
                  <span className="text-sm text-gray-400">Consulting the oracle...</span>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-white/10">
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={persona.placeholder}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-500/50 resize-none"
                rows={2}
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${
                  input.trim() && !isLoading
                    ? `bg-gradient-to-r ${persona.color} text-white hover:opacity-90`
                    : "bg-gray-700 text-gray-500 cursor-not-allowed"
                }`}
              >
                {isLoading ? "..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
