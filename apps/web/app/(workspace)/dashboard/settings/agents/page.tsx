"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ProviderConfig = {
  provider?: string;
  model?: string;
  baseUrl?: string;
};

type ProviderResponse = {
  configs?: Record<string, ProviderConfig>;
  activeProvider?: string;
  error?: string;
};

type DraftConfig = {
  model: string;
  baseUrl: string;
  apiKey: string;
};

const PLATFORM_AGENTS = [
  {
    id: "wonderbuild",
    name: "WonderBuild Agent",
    description: "AI WONDERLAND's website and app builder agent.",
    href: "/wonder-build",
    capability: "Websites & apps",
  },
  {
    id: "3d-assets",
    name: "3D Asset AI",
    description: "AI WONDERLAND's 3D asset generation workflow.",
    href: "/dashboard/ai-generator",
    capability: "3D assets",
  },
  {
    id: "playground",
    name: "AI Playground",
    description: "AI WONDERLAND multi-model playground and prompt workspace.",
    href: "https://playground.dreammakerhub.website/",
    capability: "Models & prompts",
    external: true,
  },
] as const;

const PROVIDERS = [
  {
    id: "openrouter",
    name: "OpenRouter",
    defaultModel: "meta-llama/llama-3.3-70b-instruct",
    description: "Bring an OpenRouter key and choose one of the models available to your account.",
  },
  {
    id: "openai",
    name: "OpenAI-compatible",
    defaultModel: "gpt-4o-mini",
    description: "Use your own OpenAI API key.",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    defaultModel: "claude-3-5-haiku-latest",
    description: "Use your own Anthropic API key.",
  },
  {
    id: "google",
    name: "Google AI",
    defaultModel: "gemini-2.5-flash",
    description: "Use your own Google AI / Gemini key.",
  },
  {
    id: "groq",
    name: "Groq",
    defaultModel: "openai/gpt-oss-120b",
    description: "Use your own Groq key and model.",
  },
  {
    id: "custom-api",
    name: "Custom agent endpoint",
    defaultModel: "custom-model",
    description: "Connect an HTTPS OpenAI-compatible endpoint you control.",
    supportsBaseUrl: true,
  },
] as const;

function initialDrafts(): Record<string, DraftConfig> {
  return Object.fromEntries(
    PROVIDERS.map((provider) => [
      provider.id,
      { model: provider.defaultModel, baseUrl: "", apiKey: "" },
    ]),
  );
}

export default function AgentSettingsPage() {
  const [drafts, setDrafts] = useState<Record<string, DraftConfig>>(initialDrafts);
  const [configured, setConfigured] = useState<Record<string, boolean>>({});
  const [activeProvider, setActiveProvider] = useState("openrouter");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const response = await fetch("/api/ai-providers/config", {
          method: "GET",
          cache: "no-store",
        });
        const data = (await response.json().catch(() => null)) as ProviderResponse | null;
        if (!response.ok || !data) {
          throw new Error(data?.error || "Could not load agent provider settings.");
        }
        if (cancelled) return;

        setActiveProvider(data.activeProvider || "openrouter");
        setConfigured(
          Object.fromEntries(Object.keys(data.configs || {}).map((provider) => [provider, true])),
        );
        setDrafts((current) => {
          const next = { ...current };
          for (const provider of PROVIDERS) {
            const saved = data.configs?.[provider.id];
            next[provider.id] = {
              model: saved?.model || current[provider.id]?.model || provider.defaultModel,
              baseUrl: saved?.baseUrl || "",
              apiKey: "",
            };
          }
          return next;
        });
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "Could not load agent settings.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const dirtyProviders = useMemo(
    () =>
      PROVIDERS.filter((provider) => {
        const draft = drafts[provider.id];
        return Boolean(
          draft &&
          (draft.apiKey.trim() || draft.model.trim() || draft.baseUrl.trim() || configured[provider.id]),
        );
      }),
    [configured, drafts],
  );

  const updateDraft = (providerId: string, patch: Partial<DraftConfig>) => {
    setDrafts((current) => ({
      ...current,
      [providerId]: {
        ...(current[providerId] || { model: "", baseUrl: "", apiKey: "" }),
        ...patch,
      },
    }));
  };

  const save = async () => {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const configs = Object.fromEntries(
        dirtyProviders.map((provider) => {
          const draft = drafts[provider.id];
          return [
            provider.id,
            {
              model: draft.model.trim() || provider.defaultModel,
              ...(provider.supportsBaseUrl && draft.baseUrl.trim()
                ? { baseUrl: draft.baseUrl.trim() }
                : {}),
              ...(draft.apiKey.trim() ? { apiKey: draft.apiKey.trim() } : {}),
            },
          ];
        }),
      );

      const response = await fetch("/api/ai-providers/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configs, activeProvider }),
      });
      const data = (await response.json().catch(() => null)) as
        | { success?: boolean; error?: string }
        | null;

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || "Could not save agent settings.");
      }

      setConfigured((current) => ({
        ...current,
        ...Object.fromEntries(dirtyProviders.map((provider) => [provider.id, true])),
      }));
      setDrafts((current) =>
        Object.fromEntries(
          Object.entries(current).map(([provider, draft]) => [
            provider,
            { ...draft, apiKey: "" },
          ]),
        ),
      );
      setMessage("Agent/provider settings saved. API keys stay encrypted server-side and are never returned to the browser.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save agent settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/10 bg-white/[.04] p-5">
        <p className="text-xs font-black uppercase tracking-[.18em] text-violet-300">
          Agent settings
        </p>
        <h1 className="mt-2 text-2xl font-bold text-white">AI WONDERLAND agents + bring your own</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-white/65">
          Use the agents AI WONDERLAND provides, or connect your own provider/model. Platform agents
          can use AI WONDERLAND-managed credentials; BYOK credentials belong to the signed-in user.
        </p>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-bold text-white">Provided by AI WONDERLAND</h2>
          <p className="mt-1 text-sm text-white/55">
            These are first-party product agents. Users do not need to paste your private platform keys.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {PLATFORM_AGENTS.map((agent) => (
            <article key={agent.id} className="rounded-2xl border border-violet-400/20 bg-violet-500/[.06] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-white">{agent.name}</h3>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-violet-200/70">
                    {agent.capability}
                  </p>
                </div>
                <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold uppercase text-emerald-200">
                  Platform
                </span>
              </div>
              <p className="mt-3 text-sm leading-5 text-white/60">{agent.description}</p>
              <Link
                href={agent.href}
                target={"external" in agent && agent.external ? "_blank" : undefined}
                rel={"external" in agent && agent.external ? "noreferrer" : undefined}
                className="mt-4 inline-flex h-9 items-center rounded-lg border border-white/15 bg-white/[.06] px-3 text-xs font-semibold text-white hover:bg-white/10"
              >
                Open
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-cyan-400/20 bg-cyan-500/[.04] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white">Bring your own agent/provider</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-white/60">
              A user may supply their own API key and model. For a private/custom agent service, choose
              <strong className="text-white/80"> Custom agent endpoint</strong> and provide an HTTPS
              OpenAI-compatible base URL.
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/55">
            Keys are write-only after save
          </div>
        </div>

        {loading ? (
          <p className="mt-5 text-sm text-white/60">Loading provider settings…</p>
        ) : (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {PROVIDERS.map((provider) => {
              const draft = drafts[provider.id] || {
                model: provider.defaultModel,
                baseUrl: "",
                apiKey: "",
              };
              const isActive = activeProvider === provider.id;

              return (
                <article
                  key={provider.id}
                  className={`rounded-xl border p-4 ${
                    isActive
                      ? "border-cyan-300/40 bg-cyan-400/[.06]"
                      : "border-white/10 bg-black/20"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-white">{provider.name}</h3>
                      <p className="mt-1 text-xs leading-5 text-white/55">{provider.description}</p>
                    </div>
                    <label className="flex items-center gap-2 text-xs font-semibold text-white/70">
                      <input
                        type="radio"
                        name="active-provider"
                        checked={isActive}
                        onChange={() => setActiveProvider(provider.id)}
                      />
                      Default
                    </label>
                  </div>

                  <div className="mt-4 space-y-3">
                    <label className="block text-xs font-semibold text-white/70">
                      Model
                      <input
                        value={draft.model}
                        onChange={(event) => updateDraft(provider.id, { model: event.target.value })}
                        placeholder={provider.defaultModel}
                        className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/50"
                      />
                    </label>

                    {provider.supportsBaseUrl ? (
                      <label className="block text-xs font-semibold text-white/70">
                        HTTPS agent/API endpoint
                        <input
                          value={draft.baseUrl}
                          onChange={(event) => updateDraft(provider.id, { baseUrl: event.target.value })}
                          placeholder="https://agent.example.com/v1"
                          className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/50"
                        />
                      </label>
                    ) : null}

                    <label className="block text-xs font-semibold text-white/70">
                      API key {configured[provider.id] ? "(saved — enter a new value only to replace it)" : ""}
                      <input
                        type="password"
                        autoComplete="new-password"
                        value={draft.apiKey}
                        onChange={(event) => updateDraft(provider.id, { apiKey: event.target.value })}
                        placeholder={configured[provider.id] ? "•••••••• saved" : "Paste your own key"}
                        className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/50"
                      />
                    </label>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {error ? (
          <p className="mt-4 rounded-lg border border-red-400/25 bg-red-500/10 px-3 py-2 text-sm text-red-100">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="mt-4 rounded-lg border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
            {message}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void save()}
            disabled={loading || saving}
            className="rounded-lg bg-gradient-to-r from-cyan-400 to-violet-500 px-5 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save agent settings"}
          </button>
          <Link href="/dashboard/agents" className="text-sm font-semibold text-cyan-200 hover:underline">
            Back to Agents
          </Link>
        </div>
      </section>
    </div>
  );
}
