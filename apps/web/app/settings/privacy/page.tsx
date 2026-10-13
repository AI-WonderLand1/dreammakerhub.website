'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AI_TRAINING_CONSENT_TEXT } from '@/lib/privacy/alice-training-consent';

type Preference = { enabled: boolean; consentVersion: string; updatedAt: string | null };

export default function PrivacySettingsPage() {
  const [choice, setChoice] = useState(false);
  const [stored, setStored] = useState<boolean | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch('/api/privacy/ai-training', {
          cache: 'no-store',
          credentials: 'same-origin',
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(response.status === 401
            ? 'Sign in to manage AI training permission.'
            : 'Could not load privacy preferences. Try again later.');
        }
        const data: Preference = await response.json();
        setChoice(data.enabled);
        setStored(data.enabled);
        setUpdatedAt(data.updatedAt);
      } catch (caught) {
        if (!controller.signal.aborted) {
          setError(caught instanceof Error ? caught.message : 'Unable to load preferences.');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, []);

  async function save() {
    if (stored === null || saving) return;
    setSaving(true);
    setError('');
    setSaved('');
    try {
      const response = await fetch('/api/privacy/ai-training', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: choice }),
      });
      if (!response.ok) throw new Error('Your selection was not saved. Please try again.');
      setStored(choice);
      setUpdatedAt(new Date().toISOString());
      setSaved(choice
        ? 'You opted in. You can change this decision at any time.'
        : 'Opted out. No future shared-training collection is authorized by this preference.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="max-w-3xl space-y-5 text-white">
      <div>
        <h1 className="text-2xl font-bold">Privacy & Data</h1>
        <p className="mt-2 text-sm text-white/70">
          Decide whether your content may be used to improve Alice. This is separate
          from the processing necessary to provide your projects and AI features.
        </p>
      </div>

      <div className="space-y-5 rounded-2xl border border-white/15 bg-white/5 p-5">
        <div>
          <h2 className="text-lg font-semibold">Optional AI improvement</h2>
          <p className="mt-2 text-sm text-white/75">
            If you opt in, AI WONDERLAND may review and use your submitted prompts,
            project content, generated code and feedback for quality evaluation,
            reusable examples and future model training. We may use service providers
            described in our Privacy Policy. Never include secrets or third-party
            data you are not authorized to contribute.
          </p>
          <p className="mt-2 text-sm text-white/75">
            This is off by default. Declining does not prevent you from using the
            builder. Training consent does not make your private projects public.
          </p>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/15 bg-black/30 p-4">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 accent-violet-500"
            checked={choice}
            disabled={loading || stored === null || saving}
            onChange={(event) => {
              setChoice(event.target.checked);
              setSaved('');
            }}
          />
          <span>
            <span className="block font-semibold">I voluntarily allow AI improvement and training</span>
            <span className="mt-1 block text-sm text-white/65">{AI_TRAINING_CONSENT_TEXT}</span>
          </span>
        </label>

        {updatedAt && <p className="text-xs text-white/50">
          Last recorded choice: {new Date(updatedAt).toLocaleString()}
        </p>}

        <p className="text-sm text-white/70">
          Turning this off stops authorization for new shared-training collection.
          It does not automatically erase past training artifacts or guarantee
          removal from previously trained model weights. To request review or
          deletion, contact{' '}
          <a className="underline" href="mailto:contact@dreammakerhub.website">
            contact@dreammakerhub.website
          </a>.
        </p>

        <p className="text-sm text-white/70">
          Read the <Link className="underline" href="/privacy">Privacy Policy</Link>
          {' '}and <Link className="underline" href="/terms">Terms of Use</Link>.
        </p>

        {error && <p role="alert" className="rounded-lg bg-red-950/40 p-3 text-sm text-red-200">{error}</p>}
        {saved && <p role="status" className="rounded-lg bg-emerald-950/30 p-3 text-sm text-emerald-200">{saved}</p>}

        <button
          type="button"
          disabled={loading || stored === null || saving || choice === stored}
          onClick={() => void save()}
          className="rounded-lg bg-violet-600 px-4 py-2 font-semibold hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? 'Loading...' : saving ? 'Saving...' : 'Save privacy choice'}
        </button>
      </div>
    </section>
  );
}
