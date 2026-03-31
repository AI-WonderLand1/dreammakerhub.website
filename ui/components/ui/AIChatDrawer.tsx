"use client";
import { useEffect, useRef, useState } from "react";
import { X, Send } from "lucide-react";

interface AIChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AIChatDrawer({ isOpen, onClose }: AIChatDrawerProps) {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  async function sendMessage() {
    if (!input.trim()) return;
    const newMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, newMsg] }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply ?? "No response" }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "⚠️ Error contacting AI endpoint" }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`fixed top-0 right-0 h-full w-96 bg-[#0c0018] border-l border-fuchsia-800/60 text-gray-200 transform transition-transform duration-500 ${
        isOpen ? "translate-x-0" : "translate-x-full"
      } z-50 flex flex-col`}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-fuchsia-900/40">
        <h2 className="text-fuchsia-300 font-semibold">AI Assistant</h2>
        <button onClick={onClose} className="hover:text-fuchsia-400">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-2 rounded-md ${
              msg.role === "user"
                ? "bg-fuchsia-900/40 text-fuchsia-200 self-end"
                : "bg-gray-900/60 text-gray-100"
            }`}
          >
            {msg.content}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
        className="border-t border-fuchsia-900/40 p-3 flex items-center gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-[#100028] text-gray-200 text-sm px-3 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-fuchsia-400"
          placeholder="Ask AI..."
        />
        <button
          type="submit"
          disabled={loading}
          className="p-2 bg-gradient-to-br from-[#ff1a1a] via-[#b30000] to-black hover:from-[#b30000] hover:to-black rounded-md text-white disabled:opacity-50"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
        }
