"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { MessageCircle, Bug, Gift, ExternalLink, X, Send } from "lucide-react";

export default function SupportPage() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ type: "feedback", subject: "", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) return;

    setSending(true);
    const supabase = createClient();
    
    if (supabase) {
      await supabase.from("support_tickets").insert({
        subject: form.subject,
        message: form.message,
        type: form.type,
        priority: "normal",
        status: "open",
      });
    }

    setSubmitted(true);
    setSending(false);
  };

  if (submitted) {
    return (
      <div className="p-6 max-w-2xl">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
          <p className="text-white/50 mb-6">Your feedback has been submitted. We'll review it shortly.</p>
          <Link href="/dashboard" className="text-orange-400 hover:underline">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Feedback & Bugs</h1>
        <p className="text-sm text-white/50">Help us improve WonderSpace</p>
      </div>

      {/* Alpha Tester Incentive */}
      <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-orange-500/10 to-purple-500/10 border border-orange-500/30">
        <div className="flex items-start gap-3">
          <Gift className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-orange-400 text-sm">Alpha Tester Reward</h3>
            <p className="text-xs text-white/70 mt-1">
              Report 3 confirmed bugs and get 3 months of "The Architect" ($105 value) free!
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setForm(f => ({ ...f, type: "feedback" }))}
            className={`flex-1 py-2 rounded-lg text-sm ${
              form.type === "feedback" 
                ? "bg-orange-500 text-white" 
                : "bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            <MessageCircle size={14} className="inline mr-2" />
            Feedback
          </button>
          <button
            type="button"
            onClick={() => setForm(f => ({ ...f, type: "bug" }))}
            className={`flex-1 py-2 rounded-lg text-sm ${
              form.type === "bug" 
                ? "bg-red-500 text-white" 
                : "bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            <Bug size={14} className="inline mr-2" />
            Bug Report
          </button>
        </div>

        <input
          type="text"
          value={form.subject}
          onChange={(e) => setForm(f => ({ ...f, subject: e.target.value }))}
          placeholder={form.type === "bug" ? "Bug title (e.g., Can't save project)" : "Feedback title"}
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-orange-500"
        />

        <textarea
          value={form.message}
          onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
          placeholder={form.type === "bug" 
            ? "Steps to reproduce:\n1. Go to...\n2. Click on...\n\nExpected: ...\nActual: ..." 
            : "Share your thoughts..."
          }
          rows={6}
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-orange-500 resize-none"
        />

        <button
          type="submit"
          disabled={sending || !form.subject.trim() || !form.message.trim()}
          className="w-full py-3 rounded-xl bg-orange-500 text-white font-medium disabled:opacity-50 hover:bg-orange-600"
        >
          {sending ? "Sending..." : "Submit"}
        </button>
      </form>

      {/* Discord Link */}
      <div className="mt-8 pt-6 border-t border-white/10">
        <a 
          href="https://discord.gg/wonderspace" 
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#5865F2]/20 border border-[#5865F2]/30 text-[#5865F2] hover:bg-[#5865F2]/30"
        >
          <MessageCircle size={16} />
          Join our Discord community
          <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
}