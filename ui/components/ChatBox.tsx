"use client";
import { useState } from "react";
import { logger } from "@lib/logger";

export default function ChatBox() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessage = { role: "user", content: input };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setInput("");

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      });
      const data = await res.json();
      setMessages([...updatedMessages, { role: "assistant", content: data.reply }]);
    } catch (err) {
      logger.error("Chat send failed", { error: err });
    }
  };

  return (
    <div className="rounded-2xl bg-black/70 backdrop-blur-lg border border-white/20 p-4 shadow-xl">
      <div className="h-72 overflow-y-auto space-y-3 mb-4 text-sm">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`p-2 rounded-lg ${
              m.role === "user" ? "bg-pink-600/30 text-right" : "bg-indigo-600/30 text-left"
            }`}
          >
            {m.content}
          </div>
        ))}
      </div>
      <div className="flex">
        <input
          className="flex-1 bg-black/50 border border-white/20 rounded-l-lg p-2 text-white placeholder-white/50 outline-none"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the AI Spirit..."
        />
        <button
          onClick={sendMessage}
          className="bg-pink-500 px-4 rounded-r-lg hover:bg-pink-600 transition"
        >
          Send
        </button>
      </div>
    </div>
  );
}
