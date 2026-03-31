'use client';

import React, { useState, useEffect } from 'react';
import { Copy, Trash2, Plus } from 'lucide-react';
import toast, { Toaster } from '@components/ui/toast';

interface APIKey {
  id: string;
  name: string;
  created_at: string;
  last_used_at?: string | null;
}

export default function APIKeyManager() {
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchKeys();
  }, []);

  async function fetchKeys() {
    const res = await fetch('/api/keys/api');
    const data = await res.json();
    if (res.ok) setKeys(data.keys);
    else toast.error(data.error || 'Failed to load keys');
  }

  async function createKey() {
    if (!newKeyName.trim()) return toast.error('Enter a name');
    setCreating(true);
    const res = await fetch('/api/keys/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newKeyName }),
    });
    const data = await res.json();
    setCreating(false);
    if (!res.ok) return toast.error(data.error || 'Failed to create key');
    toast.success('API key created. Copy it now!');
    alert(`Your new API key:\n\n${data.key}\n\nCopy it securely — it will not be shown again.`);
    setNewKeyName('');
    fetchKeys();
  }

  async function deleteKey(id: string) {
    if (!confirm('Revoke this key?')) return;
    const res = await fetch('/api/keys/api', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error || 'Failed to revoke key');
    toast.success('Key revoked');
    setKeys((k) => k.filter((x) => x.id !== id));
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success('Copied');
  }

  return (
    <div className="p-6 bg-[#0b0015] text-gray-200 rounded-xl space-y-6">
      <Toaster />

      <div>
        <h2 className="text-lg font-semibold text-purple-300 mb-2">
          API Keys
        </h2>
        <p className="text-sm text-gray-400 mb-4">
          Manage your personal access tokens for API and automation use.
        </p>

        <div className="flex gap-2">
          <input
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="New key name"
            className="flex-1 bg-[#120028] border border-purple-800/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-600"
          />
          <button
            onClick={createKey}
            disabled={creating}
            className="flex items-center gap-1 bg-purple-700/40 hover:bg-purple-700/70 px-3 py-2 rounded-lg text-sm transition disabled:opacity-60"
          >
            <Plus size={14} />
            {creating ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {keys.length === 0 && (
          <p className="text-sm text-gray-500 italic">No API keys yet.</p>
        )}

        {keys.map((key) => (
          <div
            key={key.id}
            className="flex items-center justify-between bg-[#120028]/60 border border-purple-900/40 rounded-lg px-3 py-2"
          >
            <div className="flex flex-col">
              <span className="text-sm font-medium">{key.name}</span>
              <span className="text-xs text-gray-500">
                Created {new Date(key.created_at).toLocaleDateString()}
                {key.last_used_at && ` • Last used ${new Date(key.last_used_at).toLocaleDateString()}`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => copyToClipboard(key.id)}
                className="p-1.5 hover:bg-purple-700/40 rounded-lg"
              >
                <Copy size={14} />
              </button>
              <button
                onClick={() => deleteKey(key.id)}
                className="p-1.5 hover:bg-red-700/40 rounded-lg"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
