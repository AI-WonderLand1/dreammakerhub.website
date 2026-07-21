"use client";

import { useState } from "react";
import { logger } from '@/lib/logger';

export type AIChatInterfaceBlockProps = {
  agentName?: string;
  agentRole?: string;
  theme?: "hieroglyphic" | "neon" | "minimal";
  apiEndpoint?: string;
};

const themes = {
  hieroglyphic: {
    wrapper: "border-amber-500/30 bg-gradient-to-b from-amber-950/20 to-black",
    header: "border-amber-500/20 bg-amber-950/30",
    accent: "text-amber-400",
    badge: "bg-amber-500/10 border border-amber-500/30 text-amber-300",
    userMsg: "bg-amber-600/20 border border-amber-500/20",
    agentMsg: "bg-white/5 border border-white/10",
    input: "border-amber-500/30 bg-amber-950/20 focus:border-amber-400",
    btn: "bg-amber-500 hover:bg-amber-400 text-black",
  },
  neon: {
    wrapper: "border-cyan-500/30 bg-gradient-to-b from-cyan-950/20 to-black",
    header: "border-cyan-500/20 bg-cyan-950/30",
    accent: "text-cyan-400",
    badge: "bg-cyan-500/10 border border-cyan-500/30 text-cyan-300",
    userMsg: "bg-cyan-600/20 border border-cyan-500/20",
    agentMsg: "bg-white/5 border border-white/10",
    input: "border-cyan-500/30 bg-cyan-950/20 focus:border-cyan-400",
    btn: "bg-cyan-500 hover:bg-cyan-400 text-black",
  },
  minimal: {
    wrapper: "border-white/10 bg-[#0a0a10]",
    header: "border-white/10 bg-white/5",
    accent: "text-violet-400",
    badge: "bg-violet-500/10 border border-violet-500/30 text-violet-300",
    userMsg: "bg-violet-600/20 border border-violet-500/20",
    agentMsg: "bg-white/5 border border-white/10",
    input: "border-white/20 bg-white/5 focus:border-violet-400",
    btn: "bg-violet-600 hover:bg-violet-500 text-white",
  },
};

export default function AIChatInterfaceBlock({
  agentName = "Spirit Guide",
  agentRole = "AI Assistant",
  theme = "minimal",
  apiEndpoint = "/api/ai/chat",
}: AIChatInterfaceBlockProps) {
  const t = themes[theme];
  const [messages, setMessages] = useState<Array<{role: "user" | "assistant", content: string}>>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    if (!input.trim() || loading) return;
    
    const userMessage = input.trim();
    setMessages(m => [...m, { role: "user", content: userMessage }]);
    setInput("");
    setLoading(true);
    
    try {
      const res = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userMessage, agentId: "website_builder" }),
      });
      
      const data = await res.json();
      const response = data.response || "I'm here to help!";
      setMessages(m => [...m, { role: "assistant", content: response }]);
    } catch {
      setMessages(m => [...m, { role: "assistant", content: "Connection failed. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4" data-block="ai-chat-interface">
      <div className={`rounded-2xl border overflow-hidden ${t.wrapper}`}>
        <div className={`flex items-center gap-3 border-b px-4 py-3 ${t.header}`}>
          <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-sm">
            🤖
          </div>
          <div>
            <p className={`text-sm font-bold ${t.accent}`}>{agentName}</p>
            <p className="text-[10px] text-white/40">{agentRole}</p>
          </div>
          <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium ${t.badge}`}>
            AI
          </span>
        </div>

        <div className="h-48 space-y-3 overflow-y-auto p-4">
          {messages.length === 0 && (
            <div className="text-center text-white/40 text-xs py-4">
              Start a conversation with the AI
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`max-w-xs rounded-xl rounded-${msg.role === "user" ? "br" : "bl"}-sm border p-3 text-xs ${msg.role === "user" ? `ml-auto ${t.userMsg}` : `mr-auto ${t.agentMsg}`}`}
            >
              {msg.content}
            </div>
          ))}
          {loading && (
            <div className={`mr-auto max-w-xs rounded-xl rounded-bl-sm border p-3 text-xs ${t.agentMsg}`}>
              <span className="animate-pulse">Thinking...</span>
            </div>
          )}
        </div>

        <div className={`flex items-center gap-2 border-t px-4 py-3 ${t.header}`}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleSend(); }}
            placeholder="Type a message..."
            className={`flex-1 rounded-lg border bg-transparent px-3 py-2 text-xs text-white placeholder:text-white/30 outline-none transition ${t.input}`}
            disabled={loading}
          />
          <button 
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className={`rounded-lg px-3 py-2 text-xs font-semibold transition disabled:opacity-50 ${t.btn}`}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
