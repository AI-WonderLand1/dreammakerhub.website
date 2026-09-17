"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { Mail, MessageCircle, ShieldCheck, Sparkles, Headphones } from "lucide-react";

declare global {
  interface Window {
    zE?: (...args: unknown[]) => void;
  }
}

const zendeskSupportEmail = "support@aiwonderlandinnovation.zendesk.com";
const zendeskWidgetKey = "7ec0c3b6-2513-4a6f-9530-88ca72285389";

export default function ContactPage() {
  const [scriptRequested, setScriptRequested] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState(false);
  const mounted = useRef(false);
  const chatReady = useRef(false);
  const openRequested = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      openRequested.current = false;
      // Next.js can retain third-party scripts between client-side navigations.
      // Never leave the support widget floating over the rest of DreamMakerHub.
      window.zE?.("messenger", "hide");
    };
  }, []);

  useEffect(() => {
    if (!chatLoading) return;
    const timeout = window.setTimeout(() => {
      openRequested.current = false;
      setChatLoading(false);
      setChatError(true);
    }, 15000);
    return () => window.clearTimeout(timeout);
  }, [chatLoading]);

  const openSupportChat = () => {
    if (chatLoading || chatError) return;
    if (chatReady.current && window.zE) {
      window.zE("messenger", "show");
      window.zE("messenger", "open");
      return;
    }

    // Load the third-party widget only after an explicit support-page click.
    // This prevents a second, non-draggable floating launcher site-wide.
    openRequested.current = true;
    setChatLoading(true);
    setScriptRequested(true);
  };

  const handleZendeskReady = () => {
    const zendesk = window.zE;
    if (typeof zendesk !== "function") {
      openRequested.current = false;
      setChatLoading(false);
      setChatError(true);
      return;
    }

    // Zendesk's ready callback waits for the messaging API, not just the script download.
    zendesk(() => {
      if (!mounted.current || !openRequested.current) {
        zendesk("messenger", "hide");
        return;
      }
      chatReady.current = true;
      zendesk("messenger:on", "close", () => {
        if (mounted.current) zendesk("messenger", "hide");
      });
      openRequested.current = false;
      zendesk("messenger", "show");
      zendesk("messenger", "open");
      setChatLoading(false);
    });
  };

  const handleZendeskError = () => {
    openRequested.current = false;
    setChatLoading(false);
    setChatError(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-slate-50">
      <div className="mx-auto max-w-4xl px-6 py-12 sm:px-10">
        <header className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">AI WONDERLAND INNOVATION</p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-50 sm:text-5xl">Contact</h1>
          <p className="max-w-2xl text-slate-300">
            Use the address that best matches your request. DreamMakerHub is an independently developed project, so response times can vary while development is active.
          </p>
        </header>

        <section className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-inner shadow-sky-500/5">
            <div className="flex items-center gap-2 text-sm text-slate-200">
              <Headphones className="h-4 w-4 text-sky-300" />
              Support
            </div>
            <p className="mt-2 text-sm text-slate-300">Product help, billing questions, refunds, or account issues.</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={openSupportChat}
                disabled={chatLoading || chatError}
                className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <MessageCircle className="h-4 w-4" />
                {chatLoading ? "Opening support…" : "Contact support"}
              </button>
              <button
                type="button"
                onClick={openSupportChat}
                disabled={chatLoading || chatError}
                className="inline-flex items-center gap-2 rounded-lg border border-sky-400/40 px-4 py-2 text-sm font-semibold text-sky-200 transition hover:bg-sky-400/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Live chat
              </button>
              <a
                className="inline-flex text-sm text-sky-200 hover:text-sky-100"
                href={`mailto:${zendeskSupportEmail}?subject=DreamMakerHub%20Support`}
              >
                Email support
              </a>
            </div>
            {chatError && (
              <p className="mt-3 text-sm text-amber-200" role="alert">
                Live chat could not load. Please use Email support instead.
              </p>
            )}
            <p className="mt-3 text-xs text-slate-500">Support conversations are handled through Zendesk.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-inner shadow-sky-500/5">
            <div className="flex items-center gap-2 text-sm text-slate-200">
              <Sparkles className="h-4 w-4 text-sky-300" />
              Business & Partnerships
            </div>
            <p className="mt-2 text-sm text-slate-300">Integrations, partnerships, pilots, sponsorships, or business inquiries.</p>
            <a className="mt-3 inline-flex text-sm text-sky-200 hover:text-sky-100" href="mailto:contact@dreammakerhub.website">
              contact@dreammakerhub.website
            </a>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-inner shadow-sky-500/5">
            <div className="flex items-center gap-2 text-sm text-slate-200">
              <ShieldCheck className="h-4 w-4 text-sky-300" />
              Security
            </div>
            <p className="mt-2 text-sm text-slate-300">Report a suspected vulnerability or security issue privately.</p>
            <a className="mt-3 inline-flex text-sm text-sky-200 hover:text-sky-100" href="mailto:security@dreammakerhub.website">
              security@dreammakerhub.website
            </a>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-inner shadow-sky-500/5">
            <div className="flex items-center gap-2 text-sm text-slate-200">
              <Mail className="h-4 w-4 text-sky-300" />
              General
            </div>
            <p className="mt-2 text-sm text-slate-300">General questions, feedback, roadmap questions, or other inquiries.</p>
            <a className="mt-3 inline-flex text-sm text-sky-200 hover:text-sky-100" href="mailto:hello@dreammakerhub.website">
              hello@dreammakerhub.website
            </a>
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-lg shadow-slate-900/40">
          <div className="flex items-center gap-3">
            <MessageCircle className="h-5 w-5 text-sky-300" />
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Contact policy</p>
              <h2 className="text-xl font-semibold text-slate-50">What to expect</h2>
            </div>
          </div>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            <li>Support requests are reviewed as availability allows.</li>
            <li>Security reports are prioritized and should include enough detail to reproduce the issue safely.</li>
            <li>Business and partnership messages should include the organization, proposal, and preferred contact method.</li>
          </ul>
        </section>
      </div>
      {scriptRequested && (
        <Script
          id="zendesk-support-chat"
          src={`https://static.zdassets.com/ekr/snippet.js?key=${zendeskWidgetKey}`}
          strategy="afterInteractive"
          onReady={handleZendeskReady}
          onError={handleZendeskError}
        />
      )}
    </div>
  );
}
