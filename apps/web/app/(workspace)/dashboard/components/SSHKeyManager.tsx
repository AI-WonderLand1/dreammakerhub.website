'use client';

import React, { useState, useEffect } from 'react';
import { Key, Trash2, Plus } from 'lucide-react';
import toast, { Toaster } from '@components/ui/toast';

interface SSHKey {
  id: string;
  name: string;
  key: string;
  created_at: string;
}

export default function SSHKeyManager() {
  const [keys, setKeys] = useState<SSHKey[]>([]);
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchKeys();
  }, []);

  async function fetchKeys() {
    const res = await fetch('/api/keys/ssh');
    const data = await res.json();
    if (res.ok) setKeys(data.keys);
    else toast.error(data.error || 'Failed to load SSH keys');
  }

  async function addKey() {
    if (!name.trim() || !key.trim()) {
      return toast.error('Name and key are required');
    }
    setLoading(true);
    const res = await fetch('/api/keys/ssh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, key }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return toast.error(data.error || 'Failed to add key');
    toast.success('SSH key added');
    setName('');
    setKey('');
    fetchKeys();
  }

  async function deleteKey(id: string) {
    if (!confirm('Delete this SSH key?')) return;
    const res = await fetch('/api/keys/ssh', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error || 'Failed to delete key');
    toast.success('SSH key deleted');
    setKeys((prev) => prev.filter((k) => k.id !== id));
  }

  return (
    <div className="p-6 bg-[#0b0015] text-gray-200 rounded-xl space-y-6">
      <Toaster />

      <div>
        <h2 className="text-lg font-semibold text-purple-300 mb-2 flex items-center gap-2">
          <Key size={18} /> SSH Keys
        </h2>
        <p className="text-sm text-gray-400 mb-4">
          Add or remove SSH public keys used for secure project access.
        </p>

        <div className="space-y-2">
          <input
            type="text"
            placeholder="Key name (e.g. MacBook Pro)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[#120028] border border-purple-800/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-600"
          />
          <textarea
            placeholder="ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQ..."
            value={key}
            onChange={(e) => setKey(e.target.value)}
            rows={4}
            className="w-full bg-[#120028] border border-purple-800/40 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-purple-600"
          />
          <button
            onClick={addKey}
            disabled={loading}
            className="flex items-center gap-1 bg-purple-700/40 hover:bg-purple-700/70 px-3 py-2 rounded-lg text-sm transition disabled:opacity-60"
          >
            <Plus size={14} />
            {loading ? 'Adding...' : 'Add Key'}
          </button>
        </div>
      </div>

      <div className="space-y-2 pt-4">
        {keys.length === 0 && (
          <p className="text-sm text-gray-500 italic">No SSH keys added yet.</p>
        )}

        {keys.map((k) => (
          <div
            key={k.id}
            className="flex items-start justify-between bg-[#120028]/60 border border-purple-900/40 rounded-lg px-3 py-2"
          >
            <div className="flex flex-col text-sm">
              <span className="font-medium">{k.name}</span>
              <code className="text-xs text-gray-400 break-all mt-1">
                {k.key.slice(0, 50)}...
              </code>
              <span className="text-xs text-gray-500 mt-1">
                Added {new Date(k.created_at).toLocaleDateString()}
              </span>
            </div>
            <button
              onClick={() => deleteKey(k.id)}
              className="p-1.5 hover:bg-red-700/40 rounded-lg text-gray-300"
              title="Delete key"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
