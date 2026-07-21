"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Key, Check, AlertCircle, ChevronDown, ExternalLink } from "lucide-react";
import { logger } from '@/lib/logger';

interface AIProviderConfig {
  provider: string;
  apiKey: string;
  baseUrl?: string;
  model: string;
  showKey?: boolean;
}

interface ProviderInfo {
  id: string;
  name: string;
  description: string;
  apiKeyName: string;
  defaultModel: string;
  models: string[];
  docsUrl?: string;
}

const PROVIDERS: ProviderInfo[] = [
  {
    id: "dreammakerhub",
    name: "DreamMakerHub AI",
    description: "Platform's built-in AI with multi-agent architecture",
    apiKeyName: "DREAMMAKERHUB_API_KEY",
    defaultModel: "dreammakerhub-default",
    models: ["dreammakerhub-default"],
    docsUrl: undefined,
  },
  {
    id: "opencode",
    name: "OpenCode",
    description: "Primary AI provider for WonderSpace (powered by OpenRouter)",
    apiKeyName: "OPENCODE_API_KEY",
    defaultModel: "opencode/big-pickle",
    models: ["opencode/big-pickle", "opencode/gpt-4-turbo", "opencode/claude-3-opus"],
    docsUrl: "https://opencode.ai/docs",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    description: "Access 300+ models through a single API",
    apiKeyName: "OPENROUTER_API_KEY",
    defaultModel: "google/gemini-flash-1.5",
    models: [
      "google/gemini-flash-1.5",
      "anthropic/claude-3-opus",
      "anthropic/claude-3-5-sonnet",
      "openai/gpt-4-turbo",
      "openai/gpt-4o",
      "meta/llama-3.1-405b-instruct",
    ],
    docsUrl: "https://openrouter.ai/docs",
  },
  {
    id: "groq",
    name: "GROQ",
    description: "Fast inference on open-source models",
    apiKeyName: "GROQ_API_KEY",
    defaultModel: "llama-3.1-8b-instant",
    models: [
      "llama-3.1-8b-instant",
      "llama-3.1-70b-versatile",
      "mixtral-8x7b-32768",
      "gemma2-9b-it",
    ],
    docsUrl: "https://groq.com/docs",
  },
  {
    id: "github",
    name: "GitHub Models",
    description: "Azure OpenAI models via GitHub",
    apiKeyName: "GITHUB_MODELS_API_KEY",
    defaultModel: "gpt-4o-mini",
    models: ["gpt-4o-mini", "gpt-4o", "o1-mini", "o1-preview"],
    docsUrl: "https://github.com/marketplace/models",
  },
  {
    id: "google",
    name: "Google AI",
    description: "Gemini models by Google",
    apiKeyName: "GEMINI_API_KEY",
    defaultModel: "gemini-2.5-flash",
    models: ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-1.5-flash", "gemini-1.5-pro"],
    docsUrl: "https://ai.google.dev/docs",
  },
  {
    id: "n8n",
    name: "n8n Workflows",
    description: "Classification webhook for user intent",
    apiKeyName: "N8N_API_KEY",
    defaultModel: "user-choice",
    models: ["user-choice"],
    docsUrl: "https://n8n.io",
  },
  {
    id: "cerebras",
    name: "Cerebras",
    description: "Fast inference on Cerebras hardware (Llama, etc.)",
    apiKeyName: "CEREBRAS_API_KEY",
    defaultModel: "llama-3.3-70b",
    models: ["llama-3.3-70b", "llama-3.1-8b"],
    docsUrl: "https://inference-docs.cerebras.ai",
  },
  {
    id: "openai",
    name: "OpenAI",
    description: "GPT-4o, GPT-4o-mini and other OpenAI models",
    apiKeyName: "OPENAI_API_KEY",
    defaultModel: "gpt-4o-mini",
    models: ["gpt-4o-mini", "gpt-4o", "o1-mini", "o1-preview", "gpt-4-turbo"],
    docsUrl: "https://platform.openai.com/docs",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    description: "Claude models by Anthropic",
    apiKeyName: "ANTHROPIC_API_KEY",
    defaultModel: "claude-3-5-haiku-latest",
    models: ["claude-3-5-haiku-latest", "claude-3-5-sonnet-latest", "claude-3-opus-latest"],
    docsUrl: "https://docs.anthropic.com",
  },
  {
    id: "custom-api",
    name: "Custom API",
    description: "Any OpenAI-compatible API endpoint",
    apiKeyName: "CUSTOM_API_KEY",
    defaultModel: "custom-model",
    models: [],
    docsUrl: undefined,
  },
  {
    id: "webhook",
    name: "Webhook",
    description: "Custom webhook endpoint for AI processing",
    apiKeyName: "WEBHOOK_API_KEY",
    defaultModel: "webhook",
    models: [],
    docsUrl: undefined,
  },
];

export default function AIProvidersSettingsPage() {
  const [configs, setConfigs] = useState<Record<string, AIProviderConfig>>({});
  const [activeProvider, setActiveProvider] = useState<string>("opencode");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConfigs();
  }, []);

  async function fetchConfigs() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai-providers/config", { method: "GET" });
      if (res.ok) {
        const data = await res.json();
        setConfigs(data.configs || {});
        if (data.activeProvider) {
          setActiveProvider(data.activeProvider);
        }
      }
    } catch (err) {
      logger.error("Failed to fetch AI configs:", err);
    } finally {
      setLoading(false);
    }
  }

  async function saveConfigs() {
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch("/api/ai-providers/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configs, activeProvider }),
      });

      if (!res.ok) throw new Error("Failed to save configuration");
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  function updateConfig(providerId: string, field: keyof AIProviderConfig, value: string) {
    setConfigs(prev => ({
      ...prev,
      [providerId]: {
        ...prev[providerId],
        provider: providerId,
        apiKey: prev[providerId]?.apiKey || "",
        model: prev[providerId]?.model || PROVIDERS.find(p => p.id === providerId)?.defaultModel || "",
        baseUrl: prev[providerId]?.baseUrl || "",
        [field]: value,
      },
    }));
  }

  function toggleKeyVisibility(providerId: string) {
    setConfigs(prev => ({
      ...prev,
      [providerId]: {
        ...prev[providerId],
        showKey: !(prev[providerId]?.showKey ?? true),
      },
    }));
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/10 rounded w-1/3" />
          <div className="h-64 bg-white/5 rounded-xl" />
        </div>
      </div>
    );
  }

  const activeConfig = configs[activeProvider] || {
    provider: activeProvider,
    apiKey: "",
    model: PROVIDERS.find(p => p.id === activeProvider)?.defaultModel || "",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">AI Providers</h1>
        <p className="text-white/60">
          Configure your AI providers and API keys for WonderSpace. Your API keys are encrypted and stored securely.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/40 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} className="text-red-400" />
          <span className="text-red-300">{error}</span>
        </div>
      )}

      {saved && (
        <div className="p-4 bg-green-500/20 border border-green-500/40 rounded-lg flex items-center gap-2">
          <Check size={20} className="text-green-400" />
          <span className="text-green-300">Settings saved successfully!</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside>
          <h3 className="text-sm font-semibold text-white/50 mb-3 uppercase tracking-wider">Providers</h3>
          <ul className="space-y-1">
            {PROVIDERS.map(provider => (
              <li key={provider.id}>
                <button
                  onClick={() => setActiveProvider(provider.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition ${
                    activeProvider === provider.id
                      ? "bg-gradient-to-r from-violet-600/30 to-blue-600/30 text-white"
                      : "text-white/70 hover:bg-white/10"
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${configs[provider.id]?.apiKey ? "bg-green-400" : "bg-white/20"}`} />
                  <div>
                    <div className="font-medium">{provider.name}</div>
                    <div className="text-xs text-white/50">{provider.description}</div>
                  </div>
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-6 p-4 rounded-lg bg-white/5 border border-white/10">
            <h4 className="text-sm font-semibold mb-2">Default Provider</h4>
            <p className="text-xs text-white/60 mb-3">
              This provider will be used for AI operations when no specific model is requested.
            </p>
            <select
              value={activeProvider}
              onChange={e => setActiveProvider(e.target.value)}
              className="w-full px-3 py-2 bg-black/50 border border-white/20 rounded text-white text-sm"
            >
              {PROVIDERS.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </aside>

        <div className="space-y-6">
          {activeProvider && (
            <div className="rounded-xl border border-white/20 bg-white/5 p-6">
              {(() => {
                const provider = PROVIDERS.find(p => p.id === activeProvider)!;
                return (
                  <>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h2 className="text-xl font-bold">{provider.name}</h2>
                        <p className="text-white/60 text-sm mt-1">{provider.description}</p>
                      </div>
                      {provider.docsUrl && (
                        <Link
                          href={provider.docsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300"
                        >
                          <ExternalLink size={14} />
                          Docs
                        </Link>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          API Key ({provider.apiKeyName})
                        </label>
                        <div className="relative">
                          <Key size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                          <input
                            type={activeConfig.showKey ? "text" : "password"}
                            value={activeConfig.apiKey || ""}
                            onChange={e => updateConfig(activeProvider, "apiKey", e.target.value)}
                            placeholder={`Enter your ${provider.apiKeyName}`}
                            className="w-full pl-10 pr-12 py-2.5 bg-black/50 border border-white/20 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50"
                          />
                          {activeConfig.apiKey && (
                            <button
                              type="button"
                              onClick={() => toggleKeyVisibility(activeProvider)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs"
                            >
                              {activeConfig.showKey ? "Hide" : "Show"}
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Model</label>
                        <div className="relative">
                          {provider.models.length > 0 ? (
                            <>
                              <select
                                value={activeConfig.model || provider.defaultModel}
                                onChange={e => updateConfig(activeProvider, "model", e.target.value)}
                                className="w-full appearance-none px-4 py-2.5 bg-black/50 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500/50"
                              >
                                {provider.models.map(model => (
                                  <option key={model} value={model}>
                                    {model}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                            </>
                          ) : (
                            <input
                              type="text"
                              value={activeConfig.model || provider.defaultModel}
                              onChange={e => updateConfig(activeProvider, "model", e.target.value)}
                              placeholder={provider.defaultModel}
                              className="w-full px-4 py-2.5 bg-black/50 border border-white/20 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50"
                            />
                          )}
                        </div>
                      </div>

                      {(provider.id === "openrouter" || provider.id === "custom-api") && (
                        <div>
                          <label className="block text-sm font-medium mb-2">Base URL</label>
                          <input
                            type="text"
                            value={activeConfig.baseUrl || ""}
                            onChange={e => updateConfig(activeProvider, "baseUrl", e.target.value)}
                            placeholder={provider.id === "custom-api" ? "https://api.openai.com/v1" : "https://openrouter.ai/api/v1"}
                            className="w-full px-4 py-2.5 bg-black/50 border border-white/20 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50"
                          />
                        </div>
                      )}

                      {provider.id === "webhook" && (
                        <div>
                          <label className="block text-sm font-medium mb-2">Webhook URL</label>
                          <input
                            type="text"
                            value={activeConfig.baseUrl || ""}
                            onChange={e => updateConfig(activeProvider, "baseUrl", e.target.value)}
                            placeholder="https://your-webhook.example.com/endpoint"
                            className="w-full px-4 py-2.5 bg-black/50 border border-white/20 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50"
                          />
                        </div>
                      )}

                      <div className="pt-2">
                        <div className="flex items-center gap-2 text-sm">
                          <div className={`w-2 h-2 rounded-full ${activeConfig.apiKey ? "bg-green-400" : "bg-white/20"}`} />
                          <span className="text-white/60">
                            {activeConfig.apiKey ? "API key configured" : "No API key set"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              onClick={saveConfigs}
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check size={18} />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h3 className="font-semibold mb-3">About AI Providers</h3>
        <div className="space-y-3 text-sm text-white/60">
          <p>
            <strong className="text-white">DreamMakerHub AI</strong> is the platform's built-in AI with a multi-agent architecture (Architect → Builder → Reviewer). Best for generating websites, games, and components.
          </p>
          <p>
            <strong className="text-white">OpenCode</strong> is the default provider for WonderSpace. It provides access to multiple models through a single API key, making it easy to get started.
          </p>
          <p>
            <strong className="text-white">OpenRouter</strong> gives you access to 300+ models from different providers. You can use your own API key to access models like Claude, GPT-4, Llama, and more.
          </p>
          <p>
            <strong className="text-white">GROQ</strong> offers fast inference on open-source models like Llama and Mixtral. Great for quick responses.
          </p>
          <p>
            <strong className="text-white">GitHub Models</strong> provides Azure OpenAI models through GitHub. No credit card required for basic usage.
          </p>
          <p>
            <strong className="text-white">Google AI</strong> gives you access to Gemini models for vision and reasoning tasks.
          </p>
          <p>
            <strong className="text-white">Cerebras</strong> offers fast inference on Cerebras hardware for Llama models. Great for heavy workloads.
          </p>
          <p>
            <strong className="text-white">OpenAI</strong> provides access to GPT-4o and GPT-4o-mini models directly.
          </p>
          <p>
            <strong className="text-white">Anthropic</strong> gives you access to Claude models for advanced reasoning and safety.
          </p>
          <p>
            <strong className="text-white">Custom API</strong> lets you connect any OpenAI-compatible API endpoint. Enter your base URL, API key, and model name.
          </p>
          <p>
            <strong className="text-white">Webhook</strong> routes prompts to any webhook endpoint. The response body is parsed for text/output/response fields.
          </p>
          <p className="pt-2 text-white/40">
            Your API keys are encrypted before storage and never exposed to client-side code.
          </p>
        </div>
      </div>
    </div>
  );
}