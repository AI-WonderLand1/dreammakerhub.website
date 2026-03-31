"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Hook = {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

const ALL_EVENTS = [
  "project.created",
  "project.imported",
  "project.exported",
  "file.written",
  "snapshot.created",
] as const;

function cx(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

export default function WebhooksPage() {
  const [hooks, setHooks] = useState<Hook[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<string[]>(["project.created"]);
  const [creating, setCreating] = useState(false);
  const [secretOnce, setSecretOnce] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/webhooks", { method: "GET" });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || `Failed to load (${res.status})`);
      }
      const json = await res.json();
      setHooks(Array.isArray(json?.hooks) ? json.hooks : []);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load webhooks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const canCreate = useMemo(() => {
    const u = url.trim();
    return (u.startsWith("http://") || u.startsWith("https://")) && events.length > 0;
  }, [url, events]);

  const toggle = (ev: string) => {
    setEvents((cur) => (cur.includes(ev) ? cur.filter((x) => x !== ev) : [...cur, ev]));
  };

  const create = useCallback(async () => {
    if (!canCreate) return;
    setCreating(true);
    setSecretOnce(null);
    setErr("");
    try {
      const res = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: url.trim(), events }),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || `Create failed (${res.status})`);
      }
      const json = await res.json();
      setSecretOnce(json?.secret ?? null);
      setUrl("");
      setEvents(["project.created"]);
      await load();
    } catch (e: any) {
      setErr(e?.message ?? "Failed to create webhook");
    } finally {
      setCreating(false);
    }
  }, [canCreate, events, load, url]);

  const setActive = useCallback(
    async (id: string, active: boolean) => {
      const res = await fetch(`/api/webhooks/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ active }),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        alert(t || `Update failed (${res.status})`);
        return;
      }
      await load();
    },
    [load]
  );

  const del = useCallback(
    async (id: string) => {
      if (!confirm("Delete this webhook?")) return;
      const res = await fetch(`/api/webhooks/${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        alert(t || `Delete failed (${res.status})`);
        return;
      }
      await load();
    },
    [load]
  );

  const test = useCallback(async () => {
    const res = await fetch("/api/webhooks/test", { method: "POST" });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      alert(t || `Test failed (${res.status})`);
      return;
    }
    alert("Test sent. Check your webhook endpoint logs.");
  }, []);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-black uppercase tracking-widest text-white/70">Webhooks</div>
            <div className="mt-2 text-white/55">
              Add endpoints to receive signed event payloads.
              <div className="mt-2 text-xs text-white/40">
                Headers: <code className="text-white/70">x-wonder-event</code>,{" "}
                <code className="text-white/70">x-wonder-delivery</code>,{" "}
                <code className="text-white/70">x-wonder-signature</code>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={test}
            className="h-10 px-4 rounded-xl border border-emerald-400/25 bg-emerald-500/10 hover:bg-emerald-500/15 transition text-sm font-bold text-emerald-200"
          >
            Send Test
          </button>
        </div>

        {err ? (
          <div className="mt-4 p-3 rounded-xl border border-red-400/20 bg-red-500/10 text-red-200 text-sm">
            {err}
          </div>
        ) : null}

        {secretOnce ? (
          <div className="mt-4 p-4 rounded-2xl border border-yellow-400/20 bg-yellow-500/10">
            <div className="text-xs font-black uppercase tracking-widest text-yellow-200">Secret (shown once)</div>
            <div className="mt-2 text-sm text-yellow-100 break-all">{secretOnce}</div>
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="text-xs font-black uppercase tracking-widest text-white/60">Webhook URL</div>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/webhooks/wonder"
              className="mt-2 w-full h-11 rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white/80 outline-none focus:border-white/20"
            />
          </div>

          <div>
            <div className="text-xs font-black uppercase tracking-widest text-white/60">Events</div>
            <div className="mt-2 space-y-2">
              {ALL_EVENTS.map((ev) => {
                const on = events.includes(ev);
                return (
                  <button
                    key={ev}
                    type="button"
                    onClick={() => toggle(ev)}
                    className={cx(
                      "w-full h-10 px-3 rounded-xl border text-xs font-bold text-left",
                      on
                        ? "border-cyan-400/25 bg-cyan-500/10 text-cyan-200"
                        : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                    )}
                  >
                    {on ? "✓ " : ""}
                    {ev}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2">
          <button
            type="button"
            onClick={create}
            disabled={!canCreate || creating}
            className={cx(
              "h-10 px-5 rounded-xl border text-sm font-bold transition",
              canCreate
                ? "border-cyan-400/25 bg-cyan-500/10 hover:bg-cyan-500/15 text-cyan-200"
                : "border-white/10 bg-white/5 text-white/40 opacity-60 cursor-not-allowed"
            )}
          >
            {creating ? "Creating…" : "Create Webhook"}
          </button>

          <button
            type="button"
            onClick={load}
            className="h-10 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition text-sm font-bold text-white/80"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between">
          <div className="text-xs font-black uppercase tracking-widest text-white/70">Saved Webhooks</div>
          <div className="text-xs text-white/40">{loading ? "Loading…" : `${hooks.length} total`}</div>
        </div>

        <div className="mt-4 space-y-3">
          {loading ? (
            <div className="h-20 rounded-2xl border border-white/10 bg-white/5 animate-pulse" />
          ) : hooks.length ? (
            hooks.map((h) => (
              <div key={h.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-white/85 break-all">{h.url}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {h.events.map((ev) => (
                        <span
                          key={ev}
                          className="px-2 py-1 rounded-lg border border-white/10 bg-white/5 text-[11px] text-white/60"
                        >
                          {ev}
                        </span>
                      ))}
                    </div>
                    <div className="mt-2 text-[11px] text-white/40">
                      {h.active ? "Active" : "Disabled"} • Updated {new Date(h.updatedAt).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => setActive(h.id, !h.active)}
                      className={cx(
                        "h-9 px-3 rounded-xl border text-[12px] font-bold transition",
                        h.active
                          ? "border-yellow-400/25 bg-yellow-500/10 hover:bg-yellow-500/15 text-yellow-200"
                          : "border-emerald-400/25 bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-200"
                      )}
                    >
                      {h.active ? "Disable" : "Enable"}
                    </button>

                    <button
                      type="button"
                      onClick={() => del(h.id)}
                      className="h-9 px-3 rounded-xl border border-red-400/25 bg-red-500/10 hover:bg-red-500/15 transition text-[12px] font-bold text-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="mt-3 text-[11px] text-white/35 break-all">
                  ID: <span className="text-white/55">{h.id}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 rounded-2xl border border-white/10 bg-white/5 text-white/60">
              No webhooks yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
