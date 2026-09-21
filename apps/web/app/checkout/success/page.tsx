"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useAuth } from "@/lib/supabase/auth-context";

type Verification = { complete: boolean; plan: string | null; message: string };

function safeRedirect(value: string | null): string {
  const path = value?.trim();
  return path && path.startsWith("/") && !path.startsWith("//") && !path.includes("://") && !/[\\\r\n\t]/.test(path)
    ? path : "/dashboard/projects";
}

function CheckoutSuccessContent() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const redirectTo = safeRedirect(params.get("redirectTo"));
  const { session, loading: authLoading } = useAuth();
  const [result, setResult] = useState<Verification | null>(null);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (authLoading || !session?.access_token) {
      if (!authLoading) setChecking(false);
      return;
    }
    if (!sessionId) {
      setError("Missing checkout session. Check your billing dashboard before trying again.");
      setChecking(false);
      return;
    }
    const controller = new AbortController();
    setChecking(true);
    setError("");
    fetch(`/api/subscription/checkout-status?session_id=${encodeURIComponent(sessionId)}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || "Checkout verification failed");
        return data as Verification;
      })
      .then((data) => { if (!controller.signal.aborted) setResult(data); })
      .catch((reason) => {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Checkout verification failed");
      })
      .finally(() => { if (!controller.signal.aborted) setChecking(false); });
    return () => controller.abort();
  }, [session?.access_token, sessionId, authLoading, attempt]);

  const returnHere = `/checkout/success?session_id=${encodeURIComponent(sessionId || "")}&redirectTo=${encodeURIComponent(redirectTo)}`;
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050508] px-5 py-12 text-white">
      <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-zinc-900 p-8">
        <h1 className="text-2xl font-bold">Checkout status</h1>
        {authLoading || checking ? (
          <p className="mt-4 text-white/75" role="status">Verifying your checkout with Stripe…</p>
        ) : !session?.access_token ? (
          <>
            <p className="mt-4 text-white/75">Sign in with the account you used to check out to verify your payment.</p>
            <Link className="mt-6 inline-block rounded-lg bg-violet-600 px-4 py-2 font-semibold" href={`/public-pages/auth?redirectTo=${encodeURIComponent(returnHere)}`}>Sign in</Link>
          </>
        ) : error ? (
          <>
            <p className="mt-4 text-red-300" role="alert">{error}</p>
            <button type="button" onClick={() => setAttempt((value) => value + 1)} className="mt-6 rounded-lg bg-violet-600 px-4 py-2 font-semibold">Check again</button>
          </>
        ) : result ? (
          <>
            <p className="mt-4 text-white/75" role="status">{result.message}</p>
            {result.complete ? (
              <Link className="mt-6 inline-block rounded-lg bg-violet-600 px-4 py-2 font-semibold" href={redirectTo}>Continue to your projects</Link>
            ) : (
              <button type="button" onClick={() => setAttempt((value) => value + 1)} className="mt-6 rounded-lg bg-violet-600 px-4 py-2 font-semibold">Check again</button>
            )}
          </>
        ) : null}
        <p className="mt-6 text-xs text-white/50">A return URL is not proof of payment. Access depends on Stripe confirmation and the subscription webhook.</p>
        <Link href="/subscription" className="mt-3 inline-block text-sm text-violet-300 underline">View plans</Link>
      </div>
    </main>
  );
}

export default function CheckoutSuccessPage() {
  return <Suspense fallback={<main className="min-h-screen bg-[#050508]" />}><CheckoutSuccessContent /></Suspense>;
}
