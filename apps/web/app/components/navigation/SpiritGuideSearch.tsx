"use client";

import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mic, MicOff } from "lucide-react";
import { logger } from '@/lib/logger';

type Destination = {
  label: string;
  href: string;
  hints: string[];
  aliases: string[];
};

const DESTINATIONS: Destination[] = [
  { 
    label: "Home", 
    href: "/", 
    hints: ["landing", "start"], 
    aliases: [
      "homepage", "home page", "front", "front page", "main", "start here",
      "index", "root", "begin", "entry", "welcome"
    ] 
  },
  { 
    label: "Dashboard", 
    href: "/dashboard", 
    hints: ["projects", "workspace"], 
    aliases: [
      "dash", "projects", "my projects", "my work", "dashboard home",
      "overview", "summary", "control center", "hub", "console"
    ] 
  },
  { 
    label: "Wonderbuild", 
    href: "/wonder-build/agent", 
    hints: ["builder", "ai builder", "wonderbuild"], 
    aliases: [
      "build", "builder", "ai build", "wonder", "create", "design", "make",
      "create new", "new project", "start building", "generative", "ai generate",
      "wonderbuild", "wonder build", "ai-builder", "ai builder", "website builder",
      "ui builder", "web builder", "page builder", "visual builder", "puck editor",
      "live preview"
    ] 
  },
  { 
    label: "WonderPlay 3D", 
    href: "/wonder-build/playcanvas", 
    hints: ["3d", "scene", "engine", "wonderplay"], 
    aliases: [
      "3d", "3d editor", "3d builder", "threejs", "playcanvas editor", "scene", "webgl",
      "3d engine", "3d graphics", "three.js", "webgpu", "game engine", "game dev",
      "play canvas", "playcanvas 3d", "render", "3d model", "blender alternative",
      "scene editor", "world builder", "3d world", "game maker", "create game"
    ] 
  },
  { 
    label: "Wonderbuild UI", 
    href: "/wonder-build/puck", 
    hints: ["ui", "design", "blocks", "wonderbuild"], 
    aliases: [
      "puck", "ui builder", "blocks", "drag drop", "drag and drop", "web builder", "page builder",
      "visual builder", "no code", "nocode", "low code", "website builder", "website creator",
      "landing page", "website editor", "webpage builder", "layout", "components",
      "drag-and-drop", "blocks editor", "puck editor", "ui design", "wonderbuild"
    ] 
  },
  { 
    label: "Docs", 
    href: "/docs", 
    hints: ["documentation", "help"], 
    aliases: [
      "doc", "docs", "documentation", "guides", "tutorial", "tutorials", "api docs",
      "docs api", "reference", "manual", "instructions", "learning", "learn",
      "how to", "how do i", "guide", "wiki", "knowledge base", "kb"
    ] 
  },
  { 
    label: "Community", 
    href: "/community", 
    hints: ["chat", "people"], 
    aliases: [
      "forum", "social", "chat", "community forum", "discussions", "talk",
      "users", "members", "group", "slack", "discord alternative", "network"
    ] 
  },
  { 
    label: "Marketplace", 
    href: "/marketplace", 
    hints: ["assets", "templates"], 
    aliases: [
      "store", "shop", "templates", "assets", "plugins", "market",
      "themes", "extensions", "addons", "integrations", "packages",
      "downloads", "free templates", "paid templates", "asset store"
    ] 
  },
  { 
    label: "Support", 
    href: "/support", 
    hints: ["ticket", "issue"], 
    aliases: [
      "help", "contact", "issue", "bug", "problem", "question", "ticket",
      "support ticket", "submit ticket", "report bug", "feedback",
      "contact us", "get help", "troubleshoot", "resolve", "answer"
    ] 
  },
  { 
    label: "Settings", 
    href: "/settings", 
    hints: ["account", "preferences"], 
    aliases: [
      "config", "configuration", "preferences", "account settings", "profile",
      "user settings", "setup", "options", "customize", "personalize",
      "account", "my account", "profile settings", "security"
    ] 
  },
  { 
    label: "Cloud Storage", 
    href: "/settings/cloud-storage", 
    hints: ["byoc", "storage"], 
    aliases: [
      "storage", "cloud", "files", "upload", "cloud storage", "byoc",
      "bring your own cloud", "drive", "backup", "files storage",
      "my files", "documents", "media", "assets storage", "s3"
    ] 
  },
  { 
    label: "WonderSpace IDE", 
    href: "/wonderspace/ide", 
    hints: ["ide", "code", "coder"], 
    aliases: [
      "ide", "code editor", "vs code", "terminal", "ssh", "cloud ide",
      "coding", "program", "development", "dev", "dev environment",
      "code server", "remote dev", "web terminal", "bash", "shell", "wonderspace"
    ] 
  },
  { 
    label: "WonderSpace", 
    href: "/wonderspace", 
    hints: ["workspace", "cloud"], 
    aliases: [
      "wonderspace", "wonder space", "cloud workspace", "runtime",
      "cloud ide", "workspace", "online workspace", "cloud dev",
      "browser ide", "web ide", "remote workspace"
    ] 
  },
  { 
    label: "Subscription", 
    href: "/subscription", 
    hints: ["pricing", "plans"], 
    aliases: [
      "pricing", "plans", "upgrade", "subscription", "pay", "billing", "checkout",
      "subscribe", "membership", "pricing plans", "cost", "price", "how much",
      "pay", "credit card", "card", "plans", "tier", "pro", "free", "paid",
      "monthly", "yearly", "annually"
    ] 
  },
  { 
    label: "AI Chat", 
    href: "/agent-playground", 
    hints: ["ai", "chatbot"], 
    aliases: [
      "ai chat", "chatbot", "assistant", "gpt", "llm", "conversation",
      "ai assistant", "ai agent", "chat", "talk to ai", "ask ai",
      "openai", "claude", "gemini", "wizard", "magic", "ask anything",
      "prompt", "prompts", "playground", "sandbox", "test ai"
    ] 
  },
  { 
    label: "Templates", 
    href: "/scene-library", 
    hints: ["templates", "scene templates"], 
    aliases: [
      "templates", "scene library", "examples", "sample", "starter",
      "starter project", "example projects", "demo", "showcase",
      "gallery", "inspiration", "premade", "pre-built"
    ] 
  },
  { 
    label: "AI Modules", 
    href: "/ai-modules", 
    hints: ["modules", "ai extensions"], 
    aliases: [
      "modules", "ai modules", "extensions", "plugins", "integrations",
      "ai plugins", "capabilities", "features", "tools", "add-ons",
      "module library", "ai library", "ai extensions"
    ] 
  },
  { 
    label: "Status", 
    href: "/status", 
    hints: ["system status"], 
    aliases: [
      "status", "system status", "uptime", "health", "monitor",
      "is down", "is it working", "server status", "api status",
      "system health", "check status"
    ] 
  },
];

function normalizeQuery(query: string): string {
  return query
    .toLowerCase()
    .replace(/[.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreDestination(destination: Destination, query: string) {
  const q = normalizeQuery(query);
  if (!q) return 0;
  
  const labelLower = destination.label.toLowerCase();
  const hrefLower = destination.href.toLowerCase();
  
  // Exact match (highest priority)
  if (hrefLower === q || labelLower === q) return 100;
  
  let score = 0;
  
  // Label contains query
  if (labelLower.includes(q)) score += 50;
  
  // Label starts with query
  if (labelLower.startsWith(q)) score += 20;
  
  // Href contains query
  if (hrefLower.includes(q)) score += 40;
  
  // Hints match
  if (destination.hints.some((hint) => hint.includes(q) || q.includes(hint))) score += 25;
  
  // Aliases match
  if (destination.aliases.some((alias) => {
    const a = alias.toLowerCase();
    return a === q || a.includes(q) || q.includes(a);
  })) score += 35;
  
  // Partial word matching in label
  const qWords = q.split(" ");
  const labelWords = labelLower.split(" ");
  for (const word of qWords) {
    if (word.length < 2) continue;
    for (const labelWord of labelWords) {
      if (labelWord.includes(word) || word.includes(labelWord)) {
        score += 15;
      }
    }
  }
  
  // Check individual alias words
  for (const alias of destination.aliases) {
    const aliasWords = alias.toLowerCase().split(" ");
    for (const word of qWords) {
      if (word.length < 2) continue;
      if (aliasWords.some(aw => aw.includes(word) || word.includes(aw))) {
        score += 10;
      }
    }
  }
  
  return score;
}

export function SpiritGuideSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideAnswer, setGuideAnswer] = useState("");
  const [lastMiss, setLastMiss] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  const rankedResults = useMemo(() => {
    return DESTINATIONS
      .map((d) => ({ destination: d, score: scoreDestination(d, `${lastMiss} ${guideAnswer}`) }))
      .sort((a, b) => b.score - a.score);
  }, [guideAnswer, lastMiss]);

  const recommendation = rankedResults[0]?.score > 0 ? rankedResults[0].destination : null;

  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Voice search is not supported in your browser. Please use Chrome or Edge.");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript("");
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        }
      }
      if (finalTranscript) {
        setTranscript(finalTranscript);
        setQuery(finalTranscript);
        
        // Auto-submit after voice recognition
        setTimeout(() => {
          if (finalTranscript.trim()) {
            const ok = navigateFromQuery(finalTranscript);
            if (!ok) {
              setLastMiss(finalTranscript);
              setGuideOpen(true);
            }
          }
        }, 500);
      }
    };

    recognition.onerror = (event: any) => {
      logger.info("Speech recognition error:", event.error);
      setIsListening(false);
      if (event.error === "not-allowed") {
        alert("Please allow microphone access to use voice search.");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }, []);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const navigateFromQuery = (text: string) => {
    const ranked = DESTINATIONS
      .map((d) => ({ destination: d, score: scoreDestination(d, text) }))
      .sort((a, b) => b.score - a.score);

    const best = ranked[0];
    if (best && best.score > 0) {
      router.push(best.destination.href);
      setQuery("");
      return true;
    }

    return false;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    const ok = navigateFromQuery(query);
    if (!ok) {
      setLastMiss(query);
      setGuideAnswer("");
      setGuideOpen(true);
    }
  };

  const handleQuickNavigate = (href: string) => {
    router.push(href);
    setQuery("");
    setGuideOpen(false);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="pointer-events-auto flex items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Where do you want to go?"
          className="h-9 w-64 rounded-full border border-white/20 bg-black/65 px-4 text-sm text-white placeholder:text-white/45 backdrop-blur outline-none focus:border-cyan-400/70"
          aria-label="Navigation search"
          onKeyDown={(e) => {
            if (e.key === "Enter" && isListening) {
              stopListening();
            }
          }}
        />
        <button
          type="button"
          onClick={isListening ? stopListening : startListening}
          className={`h-9 w-9 rounded-full flex items-center justify-center transition-all ${
            isListening 
              ? "bg-red-500 animate-pulse border border-red-400" 
              : "border border-white/25 bg-white/10 hover:bg-white/15"
          }`}
          title={isListening ? "Stop listening" : "Voice search"}
        >
          {isListening ? (
            <MicOff className="w-4 h-4 text-white" />
          ) : (
            <Mic className="w-4 h-4 text-white/85" />
          )}
        </button>
        <button
          type="submit"
          className="h-9 rounded-full border border-white/25 bg-white/10 px-3 text-xs font-semibold text-white/85 hover:bg-white/15"
        >
          Go
        </button>
      </form>

      {guideOpen ? (
        <div className="pointer-events-auto fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/20 bg-[#070a14] p-4 text-white shadow-2xl">
            <p className="text-sm font-semibold text-cyan-300">✨ Spirit Guide AI</p>
            <p className="mt-2 text-sm text-white/80">
              I couldn't find "{lastMiss}". Did you mean one of these?
            </p>

            <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
              {rankedResults.slice(0, 5).filter(r => r.score > 0).map((result) => (
                <button
                  key={result.destination.href}
                  onClick={() => handleQuickNavigate(result.destination.href)}
                  className="w-full flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-sm hover:bg-white/10 transition-colors"
                >
                  <span>{result.destination.label}</span>
                  <span className="text-xs text-white/40">{result.destination.href}</span>
                </button>
              ))}
            </div>

            <input
              value={guideAnswer}
              onChange={(e) => setGuideAnswer(e.target.value)}
              placeholder="Or type what you need..."
              className="mt-3 h-10 w-full rounded-lg border border-white/20 bg-black/40 px-3 text-sm outline-none focus:border-cyan-400/70"
              autoFocus
            />

            {recommendation ? (
              <p className="mt-3 text-sm text-emerald-300">
                Best match: <span className="font-semibold">{recommendation.label}</span>
              </p>
            ) : null}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setGuideOpen(false)}
                className="rounded-lg border border-white/20 px-3 py-2 text-xs text-white/75"
              >
                Close
              </button>
              {recommendation && (
                <button
                  type="button"
                  onClick={() => {
                    router.push(recommendation.href);
                    setGuideOpen(false);
                    setQuery("");
                  }}
                  className="rounded-lg bg-cyan-500 px-3 py-2 text-xs font-semibold text-black"
                >
                  Take me there
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}