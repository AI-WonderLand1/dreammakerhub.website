"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, ChevronDown } from "lucide-react";
import { logger } from '@/lib/logger';

type Persona = "spirit_guide" | "website_builder" | "game_builder" | "rick";

interface Confession {
  id: number;
  type: "error" | "uncertainty" | "limitation" | "violation" | "admission";
  content: string;
  acknowledged: boolean;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  persona: Persona;
  content: string;
  timestamp: number;
}

const TYPE_ICONS = { error: "❌", uncertainty: "🤔", limitation: "⚠️", violation: "🚫", admission: "🤝" };

const PERSONA_INFO = {
  spirit_guide: { 
    name: "Spirit Guide", 
    icon: "🔮", 
    color: "from-violet-600 to-purple-700", 
    placeholder: "Ask about your site, get ideas, or guidance...",
    description: "Chat about your site and get creative inspiration",
    isBuilder: false
  },
  website_builder: { 
    name: "Website Builder", 
    icon: "🌐", 
    color: "from-blue-600 to-cyan-600", 
    placeholder: "Describe the website or mobile app you want to build...",
    description: "Builds websites, landing pages, and mobile apps",
    isBuilder: true
  },
  game_builder: { 
    name: "Game Builder", 
    icon: "🎮", 
    color: "from-green-600 to-emerald-600", 
    placeholder: "Describe the game you want to create...",
    description: "Creates 2D/3D games with PlayCanvas & Three.js",
    isBuilder: true
  },
  rick: { 
    name: "Rick", 
    icon: "🍺", 
    color: "from-green-500 to-emerald-600", 
    placeholder: "Morty, I need you to...",
    description: "Rick Sanchez persona (fun mode)",
    isBuilder: false
  },
};

const DROPDOWN_OPTIONS = [
  { label: "📚 Browse Templates", href: "/library", color: "text-blue-400" },
  { label: "🌐 Create Website", href: "/wonder-build/puck", color: "text-green-400" },
  { label: "🎮 Create Game", href: "/wonder-build/playcanvas", color: "text-purple-400" },
];

type AIModel = "spirit" | "pro" | "ultra" | "reasoning";

const MODEL_INFO = {
  spirit: { 
    name: "Spirit AI", 
    icon: "🔮", 
    color: "text-violet-400",
    isFree: true,
    description: "Free - Great for general questions",
    modelId: "opencode/big-pickle"
  },
  pro: { 
    name: "Pro AI", 
    icon: "✨", 
    color: "text-yellow-400",
    isFree: false,
    description: "Premium - Better reasoning & creativity",
    modelId: "opencode/big-pickle"
  },
  ultra: { 
    name: "Ultra AI", 
    icon: "🚀", 
    color: "text-orange-400",
    isFree: false,
    description: "Ultra - Maximum power & context",
    modelId: "opencode/big-pickle"
  },
  reasoning: { 
    name: "Deep Think", 
    icon: "🧠", 
    color: "text-cyan-400",
    isFree: false,
    description: "Reasoning - Step-by-step analysis",
    modelId: "opencode/big-pickle"
  },
};

interface AIChatProps {
  compact?: boolean;
}

export default function AIChat({ compact = false }: AIChatProps) {
  const [selectedPersona, setSelectedPersona] = useState<Persona>("spirit_guide");
  const [selectedModel, setSelectedModel] = useState<AIModel>("spirit");
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: "1", 
      role: "assistant", 
      content: "Welcome to AI Wonderland! I'm your Spirit Guide. Ask me anything about your site or get creative ideas!", 
      persona: "spirit_guide", 
      timestamp: Date.now() 
    },
    { 
      id: "2", 
      role: "assistant", 
      content: "Choose an AI persona:\n\n🔮 **Spirit Guide** - Chat about your site & get inspiration\n🌐 **Website Builder** - Build websites & mobile apps\n🎮 **Game Builder** - Create 2D/3D games\n🍺 **Rick** - Fun mode", 
      persona: "spirit_guide", 
      timestamp: Date.now() + 1 
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [confessions, setConfessions] = useState<Confession[]>([
    { id: 1, type: "uncertainty", content: "Limited context for complex decisions", acknowledged: false },
    { id: 2, type: "limitation", content: "API response time varies by load", acknowledged: false },
  ]);
  const [confessionsExpanded, setConfessionsExpanded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<{ showConfessions: boolean }>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ai-homepage-settings");
      if (saved) return JSON.parse(saved);
    }
    return { showConfessions: true };
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem("ai-homepage-settings", JSON.stringify(settings));
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

  function acknowledgeAll() {
    setConfessions((prev) => prev.map((c) => ({ ...c, acknowledged: true })));
  }

  const unacknowledgedCount = confessions.filter((c) => !c.acknowledged).length;
  const [showDropdown, setShowDropdown] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function sendMessage() {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { 
      id: Date.now().toString(), 
      role: "user", 
      content: input, 
      persona: selectedPersona, 
      timestamp: Date.now() 
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Use spirit-guide chat API for all personas (it's the only public one)
      const apiEndpoint = "/api/spirit-guide/chat";
      let requestBody = {};
      
      // Add persona context to the message
      let enhancedMessage = input;
      if (selectedPersona !== "spirit_guide") {
        enhancedMessage = `[${PERSONA_INFO[selectedPersona].name} mode] ${input}`;
      }
      
      requestBody = { 
        message: enhancedMessage,
        context: "homepage",
        model: MODEL_INFO[selectedModel].modelId
      };

      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      
      let assistantContent = "";
      
      if (response.ok) {
        const data = await response.json();
        assistantContent = data.response || "I'm here to help! What would you like to know?";
      } else {
        // Fallback responses for each persona
        switch(selectedPersona) {
          case "website_builder":
            assistantContent = "I'd love to help you build a website! Describe what you want to create.";
            break;
          case "game_builder":
            assistantContent = "Ready to create an amazing game! Tell me about your game idea.";
            break;
          case "rick":
            assistantContent = "*burp* Morty, I'm busy here! What do you want?";
            break;
          default:
            assistantContent = "I'm here to help! What would you like to know about your site?";
        }
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: assistantContent,
        persona: selectedPersona,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      // Fallback responses when API is unavailable
      const fallbackResponses = {
        spirit_guide: "I'm your Spirit Guide! Ask me anything about your site.",
        website_builder: "I can help you build websites! Describe your vision.",
        game_builder: "Let's create an awesome game together! What's your idea?",
        rick: "*burp* I'm Rick, Morty! What do you want?"
      };
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: fallbackResponses[selectedPersona] || "I'm here to help!",
        persona: selectedPersona,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setInput(`Uploaded file: ${file.name}. Describe what you want to do with this file...`);
      setShowFileUpload(false);
    }
  };

  const handleOptionSelect = (href: string) => {
    window.location.href = href;
  };

  return (
    <div className={`${compact ? 'max-w-2xl' : 'max-w-4xl'} mx-auto ${compact ? 'mt-6' : 'mt-10'} rounded-2xl border border-white/20 bg-gradient-to-br from-black/80 to-gray-900/90 backdrop-blur-sm p-4 sm:p-6`}>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-gradient-to-r from-violet-600 to-blue-600 p-2">
            <span className="text-lg">🤖</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">AI Assistant</h3>
            <p className="text-xs text-white/60">Describe what you want to build</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Persona Selector */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(PERSONA_INFO).map(([key, info]) => (
              <button
                key={key}
                onClick={() => setSelectedPersona(key as Persona)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  selectedPersona === key
                    ? `bg-gradient-to-r ${info.color} text-white shadow-lg`
                    : "bg-white/10 text-white/60 hover:bg-white/20"
                }`}
                title={info.description}
              >
                {info.icon} {compact ? '' : info.name}
              </button>
            ))}
          </div>
          
          {/* Settings Button */}
          <div className="relative" ref={settingsRef}>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="rounded-full bg-white/10 p-2 text-white/60 hover:bg-white/20 transition"
            >
              ⚙️
            </button>
            {showSettings && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-white/20 bg-gray-900/95 backdrop-blur-xl p-3 shadow-2xl z-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">Settings</span>
                  <button 
                    onClick={() => setShowSettings(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showConfessions}
                    onChange={(e) => setSettings(prev => ({...prev, showConfessions: e.target.checked}))}
                    className="rounded border-white/20 bg-white/10"
                  />
                  Show Confessions
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="mb-4 h-64 overflow-y-auto rounded-xl border border-white/10 bg-black/50 p-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`mb-3 ${msg.role === "user" ? "text-right" : "text-left"}`}
          >
            <div className="inline-block max-w-[80%] rounded-2xl px-4 py-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm">
                  {PERSONA_INFO[msg.persona].icon}
                </span>
                <span className="text-xs font-medium text-white/70">
                  {PERSONA_INFO[msg.persona].name}
                </span>
              </div>
              <p className="text-sm text-white">{msg.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Confessions Panel */}
      {settings.showConfessions && (
        <div className="mb-4 border border-white/20 rounded-lg overflow-hidden">
          <button 
            onClick={() => setConfessionsExpanded(!confessionsExpanded)}
            className="w-full p-3 flex items-center justify-between text-sm hover:bg-white/5"
          >
            <div className="flex items-center gap-2">
              <span className="text-orange-400">⚠️</span>
              <span className="text-gray-300">Confessions</span>
              {unacknowledgedCount > 0 && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-orange-500/20 text-orange-400">
                  {unacknowledgedCount}
                </span>
              )}
            </div>
            <span className="text-gray-400">{confessionsExpanded ? "▼" : "▲"}</span>
          </button>
          {confessionsExpanded && (
            <div className="p-3 space-y-2 max-h-48 overflow-y-auto">
              {confessions.map((c) => (
                <div 
                  key={c.id} 
                  className={`p-2 rounded-lg text-xs flex items-start gap-2 ${
                    c.acknowledged ? "bg-white/5 opacity-50" : "bg-white/10"
                  }`}
                >
                  <span>{TYPE_ICONS[c.type] || "📝"}</span>
                  <span className="flex-1 text-gray-300">{c.content}</span>
                  {!c.acknowledged && (
                    <button 
                      onClick={() => setConfessions((prev) => 
                        prev.map(conf => conf.id === c.id ? {...conf, acknowledged: true} : conf)
                      )}
                      className="text-gray-400 hover:text-white"
                    >
                      ✓
                    </button>
                  )}
                </div>
              ))}
              {unacknowledgedCount > 0 && (
                <button 
                  onClick={acknowledgeAll}
                  className="w-full p-2 text-xs text-center bg-white/10 hover:bg-white/20 rounded-lg text-gray-300"
                >
                  Acknowledge All
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Input Area with Dropdown and Upload */}
      <div className="relative">
        <div className="flex gap-2">
          {/* Model Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowModelDropdown(!showModelDropdown)}
              className="flex items-center gap-2 rounded-l-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-medium text-white hover:bg-white/20 transition"
            >
              <span>{MODEL_INFO[selectedModel].icon}</span>
              <span className={MODEL_INFO[selectedModel].color}>{MODEL_INFO[selectedModel].name}</span>
              <ChevronDown size={16} />
            </button>
            
            {showModelDropdown && (
              <div className="absolute bottom-full left-0 mb-2 w-64 rounded-xl border border-white/20 bg-gray-900/95 backdrop-blur-xl shadow-2xl z-50">
                {Object.entries(MODEL_INFO).map(([key, model]) => (
                  <button
                    key={key}
                    onClick={() => {
                      if (key !== "spirit" && selectedModel === "spirit") {
                        // Premium model clicked - redirect to subscription
                        window.location.href = '/subscription?model=' + key;
                      } else {
                        setSelectedModel(key as AIModel);
                      }
                      setShowModelDropdown(false);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/10 transition border-b border-white/10"
                  >
                    <span className="text-lg">{model.icon}</span>
                    <div className="flex-1">
                      <span className={`text-sm font-medium ${model.color} block`}>{model.name}</span>
                      <span className="text-xs text-white/50">{model.description}</span>
                    </div>
                    {key !== "spirit" && (
                      <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">PRO</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dropdown Button */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 border border-white/20 bg-white/10 px-4 py-3 text-sm font-medium text-white hover:bg-white/20 transition"
            >
              <ChevronDown size={16} />
              <span>Options</span>
            </button>
            
            {showDropdown && (
              <div className="absolute bottom-full left-0 mb-2 w-56 rounded-xl border border-white/20 bg-gray-900/95 backdrop-blur-xl shadow-2xl z-50">
                {DROPDOWN_OPTIONS.map((option) => (
                  <button
                    key={option.label}
                    onClick={() => handleOptionSelect(option.href)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/10 transition"
                  >
                    <span className="text-lg">{option.label.split(' ')[0]}</span>
                    <span className={`text-sm font-medium ${option.color}`}>
                      {option.label.split(' ').slice(1).join(' ')}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Text Input */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder={PERSONA_INFO[selectedPersona].placeholder}
              className="w-full border border-white/20 bg-black/50 px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
          </div>

          {/* Upload Button */}
          <div className="relative">
            <button
              onClick={() => setShowFileUpload(!showFileUpload)}
              className="flex items-center gap-2 rounded-r-xl border border-white/20 bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-3 text-sm font-medium text-white hover:from-green-500 hover:to-emerald-500 transition"
            >
              <Upload size={16} />
              <span>Import</span>
            </button>
            
            {showFileUpload && (
              <div className="absolute bottom-full right-0 mb-2 w-64 rounded-xl border border-white/20 bg-gray-900/95 backdrop-blur-xl p-4 shadow-2xl z-50">
                <p className="mb-3 text-sm font-medium text-white">Upload files to import</p>
                <label className="block w-full cursor-pointer rounded-lg border border-dashed border-white/30 bg-white/5 p-4 text-center hover:bg-white/10 transition">
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                    multiple
                  />
                  <Upload className="mx-auto mb-2 text-white/60" size={24} />
                  <p className="text-xs text-white/70">Click to upload files</p>
                  <p className="mt-1 text-xs text-white/50">Supports: .zip, .js, .html, .glb</p>
                </label>
              </div>
            )}
          </div>

          {/* Send Button */}
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-900/40 transition hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Sending...
              </span>
            ) : (
              "Send"
            )}
          </button>
        </div>
        
        <p className="mt-2 text-xs text-white/50 text-center">
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}