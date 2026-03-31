"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface AiChatProps {
  embedded?: boolean;
}

export default function AiChat({ embedded = false }: AiChatProps) {
  const [open, setOpen] = useState(embedded);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([
    { role: "assistant", content: "👋 Hello, I'm your guide through AI Wonderland. What would you like to build?" }
  ]);
  const router = useRouter();

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);

    // Navigate to Wonder-Build with the prompt
    router.push(`/wonder-build?prompt=${encodeURIComponent(input)}`);
  };

  return (
    <>
      {!embedded && (
        <button
          onClick={() => setOpen(!open)}
          className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full
                     bg-gradient-to-r from-fuchsia-500 to-indigo-600 text-white text-2xl shadow-lg
                     hover:scale-110 hover:shadow-fuchsia-500/40 transition-all"
          aria-label="Open AI Chat"
        >
          💬
        </button>
      )}

      {open && (
        <div
          className={`${
            embedded
              ? "relative w-full max-w-md mx-auto"
              : "fixed bottom-24 right-6 z-40 w-80"
          } max-h-[70vh] flex flex-col
             bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl
             shadow-xl animate-fadeIn`}
        >
          <div className="p-4 border-b border-white/10 text-lg font-semibold text-white">
            AI Assistant
          </div>

          <div className="flex-1 overflow-y-auto p-3 text-gray-200 text-sm space-y-2">
            {messages.map((msg, idx) => (
              <div key={idx} className={`p-2 rounded ${msg.role === 'user' ? 'bg-blue-900/30 ml-4' : 'bg-gray-800/50'}`}>
                <p className="text-gray-200">{msg.content}</p>
              </div>
            ))}
          </div>

          <form
            className="flex border-t border-white/10"
            onSubmit={handleSend}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me to build anything..."
              className="flex-1 bg-transparent px-3 py-2 text-sm outline-none text-white placeholder:text-gray-500"
            />
            <button
              type="submit"
              className="px-4 text-fuchsia-400 font-medium hover:text-fuchsia-300 transition"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
