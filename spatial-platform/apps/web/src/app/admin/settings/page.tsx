'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

type SettingItem = { key: string; value: Record<string, unknown>; updatedAt: string; updatedBy: string | null }

const DEFAULT_KEYS = [
  { key: 'registration', label: 'Registration', description: 'Allow new user registration', valueType: 'boolean' },
  { key: 'marketplace_enabled', label: 'Marketplace', description: 'Enable marketplace features', valueType: 'boolean' },
  { key: 'max_worlds_per_user', label: 'Max Worlds/User', description: 'Maximum worlds a user can create', valueType: 'number' },
  { key: 'default_credits', label: 'Default Credits', description: 'Credits awarded on registration', valueType: 'number' },
  { key: 'maintenance_mode', label: 'Maintenance Mode', description: 'Show maintenance page to users', valueType: 'boolean' },
]

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, SettingItem>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    api.admin.settings.list().then(res => {
      const map: Record<string, SettingItem> = {}
      for (const s of res.data) map[s.key] = s
      setSettings(map)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const getValue = (key: string, fallback: boolean | number) => {
    const s = settings[key]
    if (!s) return fallback
    return s.value?.value ?? fallback
  }

  const toggle = async (key: string, currentValue: boolean | number) => {
    setSaving(key)
    setMessage('')
    const newValue = typeof currentValue === 'boolean' ? !currentValue : currentValue
    try {
      const res = await api.admin.settings.update(key, { value: newValue })
      setSettings(prev => ({
        ...prev,
        [key]: {
          key, value: { value: newValue }, updatedAt: new Date().toISOString(), updatedBy: null,
        },
      }))
      setMessage(`"${key}" updated`)
    } catch { setMessage(`Failed to update "${key}"`) }
    setSaving(null)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <div className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          Loading settings...
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold">Settings</h1>
        <p className="text-sm text-gray-400 mt-0.5">Platform configuration</p>
      </div>

      {message && (
        <div className="mb-4 px-4 py-2 rounded border border-[var(--accent)]/30 bg-[var(--accent)]/5 text-sm text-gray-300">
          {message}
        </div>
      )}

      <div className="space-y-2 max-w-xl">
        {DEFAULT_KEYS.map(item => {
          const val = getValue(item.key, item.valueType === 'boolean' ? true : 10)
          const isSaving = saving === item.key
          return (
            <div key={item.key} className="flex items-center justify-between rounded-lg border border-[var(--border)] px-4 py-3 hover:border-[var(--accent)]/30 transition-colors">
              <div>
                <div className="text-sm font-medium">{item.label}</div>
                <div className="text-xs text-gray-400">{item.description}</div>
              </div>
              <div className="flex items-center gap-3">
                {item.valueType === 'boolean' ? (
                  <button
                    onClick={() => toggle(item.key, val)}
                    disabled={isSaving}
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      val ? 'bg-green-600' : 'bg-[var(--muted)]'
                    } ${isSaving ? 'opacity-50' : ''}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      val ? 'translate-x-[22px]' : 'translate-x-0.5'
                    }`} />
                  </button>
                ) : (
                  <input
                    type="number"
                    defaultValue={val as number}
                    className="w-20 text-sm text-center py-1"
                    onBlur={e => toggle(item.key, parseInt(e.target.value, 10))}
                  />
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-8 rounded-lg border border-[var(--border)] p-4">
        <h3 className="text-sm font-semibold mb-2">Raw Settings</h3>
        <pre className="text-xs text-gray-400 overflow-auto max-h-40">
          {JSON.stringify(settings, null, 2)}
        </pre>
      </div>
    </div>
  )
}
