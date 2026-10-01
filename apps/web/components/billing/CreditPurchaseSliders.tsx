"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Box, Coins, ExternalLink } from "lucide-react";

type Pack = {
  id: string;
  label: string;
  available: boolean;
  amount: number | null;
  currency: string | null;
  tokens?: number | null;
  credits?: number | null;
};

type Balance = {
  purchased_tokens: number;
  purchased_render_credits: number;
};

function formatMoney(amount: number | null, currency: string | null) {
  if (amount == null) return "Not configured";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: (currency || "usd").toUpperCase(),
  }).format(amount / 100);
}

function formatAmount(value: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value);
}

function PurchaseSlider({
  title,
  description,
  icon,
  packs,
  unitKey,
  balance,
  endpoint,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  packs: Pack[];
  unitKey: "tokens" | "credits";
  balance: number;
  endpoint: string;
}) {
  const available = useMemo(
    () => packs.filter((pack) => pack.available && Number(pack[unitKey] || 0) > 0 && pack.amount != null),
    [packs, unitKey],
  );
  const [index, setIndex] = useState(0);
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (index > Math.max(available.length - 1, 0)) setIndex(0);
  }, [available.length, index]);

  const selected = available[index] || null;
  const units = Number(selected?.[unitKey] || 0);

  const buy = async () => {
    if (!selected) return;
    setBuying(true);
    setError(null);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ pack: selected.id }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || typeof payload?.url !== "string") {
        throw new Error(payload?.error || "Could not start secure checkout.");
      }
      window.location.assign(payload.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not start secure checkout.");
    } finally {
      setBuying(false);
    }
  };

  return (
    <section className="rounded-xl border border-white/10 bg-black/15 p-4">
      <div className="flex items-center gap-2">
        {icon}
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-xs text-white/45">{description}</p>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-white/10 bg-white/[.025] p-3">
        <div className="text-xs uppercase tracking-wide text-white/40">Purchased balance</div>
        <div className="mt-1 text-xl font-semibold">{formatAmount(balance)}</div>
      </div>

      {selected ? (
        <>
          <div className="mt-5">
            <input
              type="range"
              min={0}
              max={Math.max(available.length - 1, 0)}
              step={1}
              value={index}
              onChange={(event) => setIndex(Number(event.target.value))}
              className="w-full accent-violet-500"
              aria-label={title}
            />
            <div className="mt-2 flex justify-between text-[10px] text-white/35">
              {available.map((pack) => (
                <span key={pack.id}>{formatAmount(Number(pack[unitKey] || 0))}</span>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-white/10 p-3">
              <div className="text-xs text-white/40">Amount</div>
              <div className="mt-1 text-lg font-semibold">{formatAmount(units)}</div>
            </div>
            <div className="rounded-lg border border-white/10 p-3">
              <div className="text-xs text-white/40">Cost</div>
              <div className="mt-1 text-lg font-semibold">{formatMoney(selected.amount, selected.currency)}</div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void buy()}
            disabled={buying}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold hover:bg-violet-500 disabled:opacity-50"
          >
            <ExternalLink size={14} />
            {buying ? "Opening secure checkout…" : "Buy " + formatAmount(units)}
          </button>
        </>
      ) : (
        <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-amber-100/70">
          No purchasable packs are configured for this credit type.
        </div>
      )}

      {error && <div className="mt-3 text-sm text-red-300">{error}</div>}
    </section>
  );
}

export default function CreditPurchaseSliders() {
  const [tokens, setTokens] = useState<Pack[]>([]);
  const [render, setRender] = useState<Pack[]>([]);
  const [balance, setBalance] = useState<Balance>({ purchased_tokens: 0, purchased_render_credits: 0 });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void Promise.all([
      fetch("/api/billing/token-packs", { credentials: "same-origin", cache: "no-store" }).then((r) => r.json()),
      fetch("/api/billing/render-credit-packs", { credentials: "same-origin", cache: "no-store" }).then((r) => r.json()),
      fetch("/api/usage", { credentials: "same-origin", cache: "no-store" }).then(async (r) => {
        const payload = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(payload?.error || "Could not load credit balances.");
        return payload;
      }),
    ]).then(([tokenPayload, renderPayload, usagePayload]) => {
      if (!active) return;
      setTokens(Array.isArray(tokenPayload?.packs) ? tokenPayload.packs : []);
      setRender(Array.isArray(renderPayload?.packs) ? renderPayload.packs : []);
      setBalance({
        purchased_tokens: Number(usagePayload?.usage?.purchased_tokens || 0),
        purchased_render_credits: Number(usagePayload?.usage?.purchased_render_credits || 0),
      });
    }).catch((cause) => {
      if (active) setError(cause instanceof Error ? cause.message : "Could not load credit purchases.");
    });
    return () => { active = false; };
  }, []);

  return (
    <div className="mt-6">
      <div>
        <h2 className="text-lg font-semibold">Buy additional usage</h2>
        <p className="mt-1 text-sm text-white/45">
          Add AI tokens or 3D/render credits to the same AI WONDERLAND account used across all connected product services.
        </p>
      </div>
      {error && <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <PurchaseSlider
          title="AI tokens"
          description="Used by AI WONDERLAND, AI Playground, and NPC AI calls."
          icon={<Coins size={18} className="text-amber-300" />}
          packs={tokens}
          unitKey="tokens"
          balance={balance.purchased_tokens}
          endpoint="/api/billing/token-packs"
        />
        <PurchaseSlider
          title="3D AI / render credits"
          description="Used by metered 3D generation and rendering operations."
          icon={<Box size={18} className="text-cyan-300" />}
          packs={render}
          unitKey="credits"
          balance={balance.purchased_render_credits}
          endpoint="/api/billing/render-credit-packs"
        />
      </div>
    </div>
  );
}
