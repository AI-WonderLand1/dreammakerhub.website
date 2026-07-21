'use client';

import React, { useState } from 'react';
import BYOCExplanation from './BYOCExplanation';
import { logger } from '@/lib/logger';

type Provider = 'supabase' | 's3' | 'gcs';

export default function ConnectCloudStoragePage() {
  const [provider, setProvider] = useState<Provider>('supabase');
  const [name, setName] = useState('');
  const [bucket, setBucket] = useState('');
  const [region, setRegion] = useState('');
  const [authMode, setAuthMode] = useState<'apiKey' | 'oauth'>('apiKey');
  const [credentialKey, setCredentialKey] = useState('');
  const [credentialValue, setCredentialValue] = useState('');
  const [credentialJson, setCredentialJson] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onConnect() {
    setSubmitting(true);
    setMessage('');

    let credentials: Record<string, string> = {};
    if (credentialJson.trim()) {
      try {
        credentials = JSON.parse(credentialJson) as Record<string, string>;
      } catch {
        setMessage('Credential JSON is invalid.');
        setSubmitting(false);
        return;
      }
    } else if (credentialKey.trim() && credentialValue.trim()) {
      credentials = { [credentialKey.trim()]: credentialValue.trim() };
    }

    try {
      const response = await fetch('/api/cloud-connections', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || `${provider}-connection`,
          provider,
          bucketOrContainer: bucket,
          region: region || null,
          authMode,
          credentials,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to connect cloud storage');
      }

      setCredentialValue('');
      setCredentialJson('');
      setMessage('Connection saved securely. Credentials were encrypted at rest.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to connect cloud storage');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-slate-50">
      <div className="max-w-3xl mx-auto p-6">
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400 mb-1">AI WONDERLAND</p>
          <h1 className="text-3xl font-bold">Connect Cloud Storage</h1>
          <p className="text-slate-400 mt-2">Link your own storage to AI Wonderland projects</p>
        </div>

        <BYOCExplanation />

        <div className="rounded-xl border border-white/10 bg-slate-900/70 p-6 mt-6">
          <h2 className="text-lg font-semibold mb-4 text-white">Connect cloud storage</h2>
          <div className="space-y-4">
            <select value={provider} onChange={(e) => setProvider(e.target.value as Provider)} className="w-full p-3 bg-slate-950 border border-white/10 rounded-lg text-white focus:outline-none focus:border-violet-500/50">
              <option value="supabase">Supabase</option>
              <option value="s3">AWS S3</option>
              <option value="gcs">GCP Storage</option>
            </select>
            <input type="text" placeholder="Connection name" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-3 bg-slate-950 border border-white/10 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50" />
            <input type="text" placeholder="Bucket name" value={bucket} onChange={(e) => setBucket(e.target.value)} className="w-full p-3 bg-slate-950 border border-white/10 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50" />
            <input type="text" placeholder="Region (optional for some providers)" value={region} onChange={(e) => setRegion(e.target.value)} className="w-full p-3 bg-slate-950 border border-white/10 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50" />
            <select value={authMode} onChange={(e) => setAuthMode(e.target.value as 'apiKey' | 'oauth')} className="w-full p-3 bg-slate-950 border border-white/10 rounded-lg text-white focus:outline-none focus:border-violet-500/50">
              <option value="apiKey">API key</option>
              <option value="oauth">OAuth</option>
            </select>
            <input type="text" placeholder="Credential key (example: accessKeyId)" value={credentialKey} onChange={(e) => setCredentialKey(e.target.value)} className="w-full p-3 bg-slate-950 border border-white/10 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50" />
            <input type="password" placeholder="Credential value" value={credentialValue} onChange={(e) => setCredentialValue(e.target.value)} className="w-full p-3 bg-slate-950 border border-white/10 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50" />
            <textarea placeholder="OR paste credential JSON" value={credentialJson} onChange={(e) => setCredentialJson(e.target.value)} className="w-full p-3 bg-slate-950 border border-white/10 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 min-h-[120px]" />
            <button onClick={() => void onConnect()} disabled={submitting} className="w-full bg-violet-600 text-white py-3 px-4 rounded-lg hover:bg-violet-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors">
              {submitting ? 'Saving…' : 'Connect securely'}
            </button>
            {message ? <p className="text-sm text-slate-300 mt-2">{message}</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
