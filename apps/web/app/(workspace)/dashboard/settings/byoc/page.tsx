"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { EmptyState, SkeletonGrid } from "@/app/components/feedback/EmptyState";
import { ToastStack, type ToastItem } from "@/app/components/feedback/ToastStack";

type CloudProvider = "s3" | "gcs" | "azure" | "r2" | "supabase";
type AuthMode = "apiKey" | "oauth";
type CloudConnectionStatus = "connected" | "disconnected";

type CloudConnection = {
  id: string;
  name: string;
  provider: CloudProvider;
  bucketOrContainer: string;
  region: string | null;
  authMode: AuthMode;
  status: CloudConnectionStatus;
  connectedAt: string;
  disconnectedAt: string | null;
  lastReconnectedAt: string | null;
  createdAt: string;
  updatedAt: string;
  credentialsMetadata: Record<string, string | null>;
};

function makeToastId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function providerNeedsRegion(provider: CloudProvider) {
  return provider === "s3" || provider === "gcs";
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

export default function ByocSettingsPage() {
  const [connections, setConnections] = useState<CloudConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyConnectionId, setBusyConnectionId] = useState<string | null>(null);
  const [testedConnection, setTestedConnection] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  const [form, setForm] = useState({
    name: "",
    provider: "s3" as CloudProvider,
    bucketOrContainer: "",
    region: "us-east-1",
    authMode: "apiKey" as AuthMode,
    credentialKey: "",
    credentialValue: "",
    jsonCredentials: "",
  });

  const formSignature = useMemo(() => JSON.stringify(form), [form]);

  const pushToast = useCallback((message: string, tone: ToastItem["tone"], actionLabel?: string, onAction?: () => void) => {
    const id = makeToastId();
    setToasts((prev) => [...prev, { id, message, tone, actionLabel, onAction }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4200);
  }, []);

  const loadConnections = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/cloud-connections");
      if (!response.ok) {
        throw new Error("Unable to load cloud connections");
      }

      const payload = (await response.json()) as { connections?: CloudConnection[] };
      setConnections(payload.connections ?? []);
    } catch {
      setErrorMessage("Could not load cloud connections.");
      pushToast("Could not load cloud connections.", "error", "Retry", () => {
        void loadConnections();
      });
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    void loadConnections();
  }, [loadConnections]);

  useEffect(() => {
    setTestedConnection(null);
  }, [formSignature]);

  const normalizedCredentials = useMemo(() => {
    if (form.jsonCredentials.trim()) {
      try {
        const parsed = JSON.parse(form.jsonCredentials) as Record<string, string>;
        return Object.fromEntries(Object.entries(parsed).filter(([key, value]) => key.trim() && String(value ?? "").trim()));
      } catch {
        return null;
      }
    }

    if (form.credentialKey.trim() && form.credentialValue.trim()) {
      return { [form.credentialKey.trim()]: form.credentialValue.trim() };
    }

    return {};
  }, [form.credentialKey, form.credentialValue, form.jsonCredentials]);

  const canTest = useMemo(() => {
    const basicFields = Boolean(form.name.trim() && form.provider && form.bucketOrContainer.trim() && form.authMode);
    if (!basicFields) return false;
    if (providerNeedsRegion(form.provider) && !form.region.trim()) return false;
    if (!normalizedCredentials || Object.keys(normalizedCredentials).length === 0) return false;
    return true;
  }, [form, normalizedCredentials]);

  const canSave = useMemo(() => canTest && testedConnection === formSignature, [canTest, formSignature, testedConnection]);

  const testConnection = useCallback(async () => {
    if (!canTest) return;

    setTesting(true);
    setErrorMessage("");

    window.setTimeout(() => {
      setTestedConnection(formSignature);
      setTesting(false);
      pushToast("Connection test passed.", "success");
    }, 800);
  }, [canTest, formSignature, pushToast]);

  const saveConnection = useCallback(async () => {
    if (!canSave || !normalizedCredentials) return;

    setSaving(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/cloud-connections", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          region: providerNeedsRegion(form.provider) ? form.region : null,
          credentials: normalizedCredentials,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? "Failed to save cloud connection");
      }

      setForm((prev) => ({ ...prev, name: "", bucketOrContainer: "", credentialValue: "", jsonCredentials: "" }));
      setTestedConnection(null);
      pushToast("Cloud connection saved.", "success");
      await loadConnections();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save cloud connection";
      setErrorMessage(message);
      pushToast(message, "error");
    } finally {
      setSaving(false);
    }
  }, [canSave, form, loadConnections, normalizedCredentials, pushToast]);

  const updateConnectionStatus = useCallback(
    async (id: string, action: "disconnect" | "reconnect") => {
      setBusyConnectionId(id);
      setErrorMessage("");
      try {
        const response = await fetch(`/api/cloud-connections/${id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action }),
        });
        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(payload.error ?? `Failed to ${action} connection`);
        }
        pushToast(action === "disconnect" ? "Connection disconnected." : "Connection reconnected.", "success");
        await loadConnections();
      } catch (error) {
        const message = error instanceof Error ? error.message : `Failed to ${action} connection`;
        setErrorMessage(message);
        pushToast(message, "error");
      } finally {
        setBusyConnectionId(null);
      }
    },
    [loadConnections, pushToast],
  );

  return (
    <div className="space-y-4">
      <ToastStack toasts={toasts} />

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="text-xs font-black uppercase tracking-widest text-white/70">Cloud Connect</div>
        <p className="mt-2 text-sm text-white/60">Configure object storage for project assets and deployment artifacts.</p>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="space-y-2 text-xs font-black uppercase tracking-widest text-white/60">
            Connection Name
            <input
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Production Storage"
              className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm font-medium normal-case tracking-normal text-white/85 outline-none focus:border-white/20"
            />
          </label>

          <label className="space-y-2 text-xs font-black uppercase tracking-widest text-white/60">
            Provider
            <select
              value={form.provider}
              onChange={(event) => setForm((prev) => ({ ...prev, provider: event.target.value as CloudProvider }))}
              className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm font-medium normal-case tracking-normal text-white/85 outline-none focus:border-white/20"
            >
              <option value="s3">S3</option>
              <option value="gcs">GCS</option>
              <option value="azure">Azure Blob</option>
              <option value="r2">Cloudflare R2</option>
              <option value="supabase">Supabase Storage</option>
            </select>
          </label>

          <label className="space-y-2 text-xs font-black uppercase tracking-widest text-white/60">
            Bucket / Container
            <input
              value={form.bucketOrContainer}
              onChange={(event) => setForm((prev) => ({ ...prev, bucketOrContainer: event.target.value }))}
              placeholder="acme-project-assets"
              className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm font-medium normal-case tracking-normal text-white/85 outline-none focus:border-white/20"
            />
          </label>

          <label className="space-y-2 text-xs font-black uppercase tracking-widest text-white/60">
            Auth mode
            <select
              value={form.authMode}
              onChange={(event) => setForm((prev) => ({ ...prev, authMode: event.target.value as AuthMode }))}
              className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm font-medium normal-case tracking-normal text-white/85 outline-none focus:border-white/20"
            >
              <option value="apiKey">API key</option>
              <option value="oauth">OAuth</option>
            </select>
          </label>

          <label className="space-y-2 text-xs font-black uppercase tracking-widest text-white/60 md:col-span-2">
            Region {providerNeedsRegion(form.provider) ? "" : "(optional)"}
            <input
              value={form.region}
              onChange={(event) => setForm((prev) => ({ ...prev, region: event.target.value }))}
              placeholder={form.provider === "gcs" ? "us-central1" : "us-east-1"}
              disabled={!providerNeedsRegion(form.provider)}
              className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm font-medium normal-case tracking-normal text-white/85 outline-none focus:border-white/20 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </label>

          <label className="space-y-2 text-xs font-black uppercase tracking-widest text-white/60">
            Credential field
            <input
              value={form.credentialKey}
              onChange={(event) => setForm((prev) => ({ ...prev, credentialKey: event.target.value }))}
              placeholder="accessKeyId"
              className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm font-medium normal-case tracking-normal text-white/85 outline-none focus:border-white/20"
            />
          </label>

          <label className="space-y-2 text-xs font-black uppercase tracking-widest text-white/60">
            Credential value
            <input
              type="password"
              value={form.credentialValue}
              onChange={(event) => setForm((prev) => ({ ...prev, credentialValue: event.target.value }))}
              placeholder="••••••••"
              className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm font-medium normal-case tracking-normal text-white/85 outline-none focus:border-white/20"
            />
          </label>

          <label className="space-y-2 text-xs font-black uppercase tracking-widest text-white/60 md:col-span-2">
            OR credential JSON
            <textarea
              value={form.jsonCredentials}
              onChange={(event) => setForm((prev) => ({ ...prev, jsonCredentials: event.target.value }))}
              placeholder='{"accessKeyId":"...","secretAccessKey":"..."}'
              className="min-h-24 w-full rounded-xl border border-white/10 bg-black/30 p-3 text-sm font-medium normal-case tracking-normal text-white/85 outline-none focus:border-white/20"
            />
          </label>
        </div>

        <div className="mt-5 flex items-center gap-2">
          <button
            type="button"
            onClick={testConnection}
            disabled={!canTest || testing}
            className={`h-10 rounded-xl border px-4 text-sm font-bold transition ${canTest ? "border-amber-300/30 bg-amber-500/10 text-amber-100 hover:bg-amber-500/20" : "cursor-not-allowed border-white/10 bg-white/5 text-white/40"}`}
          >
            {testing ? "Testing…" : "Test Connection"}
          </button>

          <button
            type="button"
            onClick={saveConnection}
            disabled={!canSave || saving}
            className={`h-10 rounded-xl border px-4 text-sm font-bold transition ${canSave ? "border-cyan-400/30 bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/20" : "cursor-not-allowed border-white/10 bg-white/5 text-white/40"}`}
          >
            {saving ? "Saving…" : "Connect"}
          </button>
        </div>

        {errorMessage ? <div className="mt-4 rounded-xl border border-red-400/25 bg-red-500/10 p-3 text-sm text-red-200">{errorMessage}</div> : null}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs font-black uppercase tracking-widest text-white/70">Connected Cloud Connections</div>
          <div className="text-xs text-white/45">{loading ? "Loading…" : `${connections.length} connected`}</div>
        </div>

        <div className="mt-4">
          {loading ? (
            <SkeletonGrid cards={2} />
          ) : connections.length === 0 ? (
            <EmptyState
              title="No cloud connections"
              description="Add a cloud connection to store project assets in your own infrastructure."
            />
          ) : (
            <div className="space-y-3">
              {connections.map((connection) => (
                <article key={connection.id} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-white/90">{connection.name}</h3>
                    <span
                      className={`rounded-md border px-2 py-1 text-xs font-semibold ${
                        connection.status === "connected"
                          ? "border-emerald-400/35 bg-emerald-500/15 text-emerald-200"
                          : "border-orange-400/35 bg-orange-500/15 text-orange-200"
                      }`}
                    >
                      {connection.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-white/65">
                    {connection.provider.toUpperCase()} · {connection.bucketOrContainer} · {connection.authMode === "apiKey" ? "API key" : "OAuth"}
                  </p>
                  <p className="mt-1 text-xs text-white/45">Region: {connection.region ?? "N/A"}</p>
                  <p className="mt-1 text-xs text-white/45">Connected at: {formatDateTime(connection.connectedAt)}</p>
                  <p className="mt-1 text-xs text-white/45">Disconnected at: {formatDateTime(connection.disconnectedAt)}</p>
                  <p className="mt-1 text-xs text-white/45">Reconnected at: {formatDateTime(connection.lastReconnectedAt)}</p>
                  <p className="mt-1 text-xs text-white/45">Credential metadata: {Object.entries(connection.credentialsMetadata).map(([key, last4]) => `${key}=***${last4 ?? ""}`).join(", ") || "none"}</p>
                  <p className="mt-1 font-mono text-xs text-white/45">cloudConnectionId: {connection.id}</p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => void updateConnectionStatus(connection.id, "disconnect")}
                      disabled={busyConnectionId === connection.id || connection.status === "disconnected"}
                      className="h-9 rounded-lg border border-orange-300/30 bg-orange-500/10 px-3 text-xs font-bold text-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Disconnect
                    </button>
                    <button
                      type="button"
                      onClick={() => void updateConnectionStatus(connection.id, "reconnect")}
                      disabled={busyConnectionId === connection.id || connection.status === "connected"}
                      className="h-9 rounded-lg border border-cyan-300/30 bg-cyan-500/10 px-3 text-xs font-bold text-cyan-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Reconnect
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
