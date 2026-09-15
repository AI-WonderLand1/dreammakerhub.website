"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bot, Loader2 } from "lucide-react";

export default function CreateNpcPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanName = name.trim();
    if (!cleanName || saving) return;

    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/npc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: cleanName }),
      });
      const data = await response.json().catch(() => ({}));

      if (response.status === 401 || response.status === 403) {
        router.replace("/public-pages/auth?redirectTo=%2Fdashboard%2Fnpc%2Fcreate");
        return;
      }

      if (!response.ok || data?.ok === false) {
        throw new Error(data?.message || "Failed to create NPC");
      }

      router.replace("/dashboard/npc");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to create NPC");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl py-8">
      <Link href="/dashboard/npc" className="text-sm text-blue-400 hover:text-blue-300">
        ← Back to My NPCs
      </Link>

      <div className="mt-5 rounded-2xl border border-white/10 bg-[#0d1625] p-6 shadow-xl">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-orange-500/15 text-orange-300">
            <Bot size={22} />
          </span>
          <div>
            <h1 className="text-2xl font-bold">Create NPC</h1>
            <p className="mt-1 text-sm text-white/45">Create the character first, then configure its model, personality, AI, voice, and behavior.</p>
          </div>
        </div>

        <form onSubmit={submit}>
          <label htmlFor="npc-name" className="text-xs font-semibold uppercase tracking-wide text-white/55">
            NPC name
          </label>
          <input
            id="npc-name"
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Example: Guide, Merchant, Companion"
            className="mt-2 w-full rounded-lg border border-white/15 bg-white/[.035] px-3 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-orange-400"
          />

          {error && (
            <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          <div className="mt-6 flex justify-end gap-2">
            <Link href="/dashboard/npc" className="rounded-lg border border-white/10 px-4 py-2.5 text-sm text-white/65 hover:bg-white/5">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              {saving ? "Creating..." : "Create NPC"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
