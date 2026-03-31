'use client';

import React, { useState } from 'react';
import BYOCExplanation from './BYOCExplanation';

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
    <div style={{ padding: '20px' }}>
      <BYOCExplanation />

      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2>Connect cloud storage</h2>
        <select value={provider} onChange={(e) => setProvider(e.target.value as Provider)} style={{ display: 'block', width: '100%', marginBottom: '10px' }}>
          <option value="supabase">Supabase</option>
          <option value="s3">AWS S3</option>
          <option value="gcs">GCP Storage</option>
        </select>
        <input type="text" placeholder="Connection name" value={name} onChange={(e) => setName(e.target.value)} style={{ display: 'block', width: '100%', marginBottom: '10px' }} />
        <input type="text" placeholder="Bucket name" value={bucket} onChange={(e) => setBucket(e.target.value)} style={{ display: 'block', width: '100%', marginBottom: '10px' }} />
        <input type="text" placeholder="Region (optional for some providers)" value={region} onChange={(e) => setRegion(e.target.value)} style={{ display: 'block', width: '100%', marginBottom: '10px' }} />
        <select value={authMode} onChange={(e) => setAuthMode(e.target.value as 'apiKey' | 'oauth')} style={{ display: 'block', width: '100%', marginBottom: '10px' }}>
          <option value="apiKey">API key</option>
          <option value="oauth">OAuth</option>
        </select>
        <input type="text" placeholder="Credential key (example: accessKeyId)" value={credentialKey} onChange={(e) => setCredentialKey(e.target.value)} style={{ display: 'block', width: '100%', marginBottom: '10px' }} />
        <input type="password" placeholder="Credential value" value={credentialValue} onChange={(e) => setCredentialValue(e.target.value)} style={{ display: 'block', width: '100%', marginBottom: '10px' }} />
        <textarea placeholder='OR paste credential JSON' value={credentialJson} onChange={(e) => setCredentialJson(e.target.value)} style={{ display: 'block', width: '100%', minHeight: '120px', marginBottom: '10px' }} />
        <button onClick={() => void onConnect()} disabled={submitting}>{submitting ? 'Saving…' : 'Connect securely'}</button>
        {message ? <p style={{ marginTop: '10px' }}>{message}</p> : null}
      </div>
    </div>
  );
}
