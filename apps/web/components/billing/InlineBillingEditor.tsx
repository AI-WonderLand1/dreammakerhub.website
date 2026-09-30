"use client";

import { useEffect, useRef, useState } from "react";

type BillingAddress = {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
};

type PaymentMethodSummary = {
  id: string;
  brand: string | null;
  funding: string | null;
  last4: string | null;
  expMonth: number | null;
  expYear: number | null;
} | null;

type Props = {
  initialName: string;
  initialPhone: string;
  initialAddress: BillingAddress;
  paymentMethod: PaymentMethodSummary;
  onSaved: () => void;
};

type StripeCardElement = {
  mount: (target: HTMLElement | string) => void;
  unmount: () => void;
  destroy?: () => void;
};

type StripeElements = {
  create: (type: "card", options?: Record<string, unknown>) => StripeCardElement;
};

type StripeClient = {
  elements: () => StripeElements;
  confirmCardSetup: (
    clientSecret: string,
    options: Record<string, unknown>,
  ) => Promise<{ error?: { message?: string }; setupIntent?: { payment_method?: string | { id?: string } | null } }>;
};

declare global {
  interface Window {
    Stripe?: (key: string) => StripeClient;
  }
}

let stripeScriptPromise: Promise<void> | null = null;

function loadStripeScript() {
  if (typeof window === "undefined") return Promise.reject(new Error("Secure card entry is unavailable"));
  if (window.Stripe) return Promise.resolve();
  if (stripeScriptPromise) return stripeScriptPromise;

  stripeScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://js.stripe.com/v3/"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Could not load secure card entry")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://js.stripe.com/v3/";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load secure card entry"));
    document.head.appendChild(script);
  });

  return stripeScriptPromise;
}

export default function InlineBillingEditor({
  initialName,
  initialPhone,
  initialAddress,
  paymentMethod,
  onSaved,
}: Props) {
  const [editingAddress, setEditingAddress] = useState(false);
  const [editingCard, setEditingCard] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [savingCard, setSavingCard] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [address, setAddress] = useState({
    line1: initialAddress.line1 || "",
    line2: initialAddress.line2 || "",
    city: initialAddress.city || "",
    state: initialAddress.state || "",
    postal_code: initialAddress.postal_code || "",
    country: initialAddress.country || "US",
  });

  const cardHostRef = useRef<HTMLDivElement | null>(null);
  const stripeRef = useRef<StripeClient | null>(null);
  const cardRef = useRef<StripeCardElement | null>(null);
  const clientSecretRef = useRef<string | null>(null);

  useEffect(() => {
    if (!editingCard) return;
    let cancelled = false;

    const setup = async () => {
      setMessage(null);
      const response = await fetch("/api/billing/payment-method/setup-intent", {
        method: "POST",
        credentials: "same-origin",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.clientSecret || !payload?.publishableKey) {
        throw new Error(payload?.error || "Could not initialize secure card entry.");
      }

      await loadStripeScript();
      if (cancelled || !window.Stripe || !cardHostRef.current) return;

      const stripe = window.Stripe(payload.publishableKey);
      const elements = stripe.elements();
      const card = elements.create("card", {
        hidePostalCode: true,
        style: {
          base: {
            color: "#ffffff",
            fontSize: "16px",
            "::placeholder": { color: "#64748b" },
          },
          invalid: { color: "#fca5a5" },
        },
      });
      card.mount(cardHostRef.current);
      stripeRef.current = stripe;
      cardRef.current = card;
      clientSecretRef.current = payload.clientSecret;
    };

    void setup().catch((cause) => {
      if (!cancelled) setMessage(cause instanceof Error ? cause.message : "Could not initialize secure card entry.");
    });

    return () => {
      cancelled = true;
      try { cardRef.current?.unmount(); } catch {}
      try { cardRef.current?.destroy?.(); } catch {}
      cardRef.current = null;
      stripeRef.current = null;
      clientSecretRef.current = null;
    };
  }, [editingCard]);

  const saveAddress = async () => {
    setSavingAddress(true);
    setMessage(null);
    try {
      const response = await fetch("/api/billing/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ name, phone, address }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || "Could not save billing information.");
      setEditingAddress(false);
      setMessage("Billing information saved.");
      onSaved();
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Could not save billing information.");
    } finally {
      setSavingAddress(false);
    }
  };

  const saveCard = async () => {
    const stripe = stripeRef.current;
    const card = cardRef.current;
    const clientSecret = clientSecretRef.current;
    if (!stripe || !card || !clientSecret) {
      setMessage("Secure card entry is still loading.");
      return;
    }

    setSavingCard(true);
    setMessage(null);
    try {
      const result = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card,
          billing_details: {
            name: name || undefined,
            phone: phone || undefined,
            address: {
              line1: address.line1 || undefined,
              line2: address.line2 || undefined,
              city: address.city || undefined,
              state: address.state || undefined,
              postal_code: address.postal_code || undefined,
              country: address.country || undefined,
            },
          },
        },
      });

      if (result.error) throw new Error(result.error.message || "Card setup failed.");
      const paymentMethodId = typeof result.setupIntent?.payment_method === "string"
        ? result.setupIntent.payment_method
        : result.setupIntent?.payment_method?.id || "";
      if (!paymentMethodId) throw new Error("Secure card setup did not return a payment method.");

      const response = await fetch("/api/billing/payment-method/default", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ paymentMethodId }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || "Could not save payment method.");

      setEditingCard(false);
      setMessage("Payment method saved.");
      onSaved();
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Could not save payment method.");
    } finally {
      setSavingCard(false);
    }
  };

  const fieldClass = "w-full rounded-lg border border-white/15 bg-[#07111d] px-3 py-2 text-sm text-white outline-none focus:border-violet-400/60";

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section className="rounded-lg border border-white/10 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold">Billing information</div>
          <button
            type="button"
            onClick={() => setEditingAddress((value) => !value)}
            className="rounded-md border border-white/15 px-3 py-1.5 text-xs hover:bg-white/5"
          >
            {editingAddress ? "Cancel" : "Edit"}
          </button>
        </div>

        {editingAddress ? (
          <div className="mt-4 grid gap-3">
            <label className="text-xs text-white/55">Name<input className={fieldClass} value={name} onChange={(e) => setName(e.target.value)} /></label>
            <label className="text-xs text-white/55">Phone<input className={fieldClass} value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
            <label className="text-xs text-white/55">Address<input className={fieldClass} value={address.line1} onChange={(e) => setAddress((v) => ({ ...v, line1: e.target.value }))} /></label>
            <label className="text-xs text-white/55">Address line 2<input className={fieldClass} value={address.line2} onChange={(e) => setAddress((v) => ({ ...v, line2: e.target.value }))} /></label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-white/55">City<input className={fieldClass} value={address.city} onChange={(e) => setAddress((v) => ({ ...v, city: e.target.value }))} /></label>
              <label className="text-xs text-white/55">State / region<input className={fieldClass} value={address.state} onChange={(e) => setAddress((v) => ({ ...v, state: e.target.value }))} /></label>
              <label className="text-xs text-white/55">ZIP / postal code<input className={fieldClass} value={address.postal_code} onChange={(e) => setAddress((v) => ({ ...v, postal_code: e.target.value }))} /></label>
              <label className="text-xs text-white/55">Country code<input maxLength={2} className={fieldClass} value={address.country} onChange={(e) => setAddress((v) => ({ ...v, country: e.target.value.toUpperCase() }))} /></label>
            </div>
            <button
              type="button"
              onClick={() => void saveAddress()}
              disabled={savingAddress}
              className="mt-1 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold hover:bg-violet-500 disabled:opacity-50"
            >
              {savingAddress ? "Saving…" : "Save billing information"}
            </button>
          </div>
        ) : (
          <div className="mt-3 space-y-1 text-sm text-white/60">
            <div>{initialName || "No billing name on file"}</div>
            {initialAddress.line1 && <div>{initialAddress.line1}</div>}
            {initialAddress.line2 && <div>{initialAddress.line2}</div>}
            {(initialAddress.city || initialAddress.state || initialAddress.postal_code) && (
              <div>{[initialAddress.city, initialAddress.state, initialAddress.postal_code].filter(Boolean).join(", ")}</div>
            )}
            {initialAddress.country && <div>{initialAddress.country}</div>}
          </div>
        )}
      </section>

      <section className="rounded-lg border border-white/10 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold">Payment method</div>
          <button
            type="button"
            onClick={() => setEditingCard((value) => !value)}
            className="rounded-md border border-white/15 px-3 py-1.5 text-xs hover:bg-white/5"
          >
            {editingCard ? "Cancel" : paymentMethod ? "Edit" : "Add card"}
          </button>
        </div>

        {editingCard ? (
          <div className="mt-4">
            <div className="rounded-lg border border-white/15 bg-[#07111d] p-3">
              <div ref={cardHostRef} className="min-h-6" />
            </div>
            <p className="mt-2 text-xs text-white/40">
              Card number and CVC are entered directly into Stripe's secure field and are not stored by DreamMakerHub.
            </p>
            <button
              type="button"
              onClick={() => void saveCard()}
              disabled={savingCard}
              className="mt-3 w-full rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold hover:bg-violet-500 disabled:opacity-50"
            >
              {savingCard ? "Saving…" : "Save payment method"}
            </button>
          </div>
        ) : paymentMethod ? (
          <div className="mt-3 text-sm text-white/60">
            <div className="capitalize">{paymentMethod.funding || "card"} · {paymentMethod.brand} ending in {paymentMethod.last4}</div>
            <div>Expires {String(paymentMethod.expMonth ?? "").padStart(2, "0")}/{paymentMethod.expYear}</div>
          </div>
        ) : (
          <div className="mt-3 text-sm text-white/45">No saved payment method is on file.</div>
        )}
      </section>

      {message && <div className="md:col-span-2 rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white/70">{message}</div>}
    </div>
  );
}
