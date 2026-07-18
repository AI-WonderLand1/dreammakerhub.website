'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

type Tab = 'users' | 'assets' | 'worlds' | 'listings'

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('users')
  const [stats, setStats] = useState<Record<string, number>>({})

  useEffect(() => {
    if (authLoading) return
    if (!user || user.role !== 'admin') {
      router.replace('/')
      return
    }
    api.admin.stats().then(setStats).catch(() => {})
  }, [authLoading, user, router])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
        <div>
          <a href="/" className="text-[var(--accent)] hover:underline text-sm">&larr; Home</a>
          <h1 className="text-xl font-bold mt-1">Admin Console</h1>
        </div>
        <span className="text-sm text-gray-400">{user?.username}</span>
      </header>

      <div className="px-6 py-4 border-b border-[var(--border)]">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 max-w-2xl">
          {[
            { label: 'Users', key: 'users' },
            { label: 'Worlds', key: 'worlds' },
            { label: 'Assets', key: 'assets' },
            { label: 'Listings', key: 'listings' },
            { label: 'Purchases', key: 'purchases' },
          ].map(s => (
            <div key={s.key} className="p-3 rounded border border-[var(--border)] bg-[var(--muted)]">
              <div className="text-xs text-gray-400 uppercase">{s.label}</div>
              <div className="text-xl font-bold mt-0.5">{stats[s.key] ?? '...'}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-b border-[var(--border)] px-6 flex gap-1">
        {([
          ['users', 'Users'],
          ['assets', 'Assets'],
          ['worlds', 'Worlds'],
          ['listings', 'Listings'],
        ] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === key
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <main className="flex-1 p-6 overflow-auto">
        {tab === 'users' && <UsersSection />}
        {tab === 'assets' && <AssetsSection />}
        {tab === 'worlds' && <WorldsSection />}
        {tab === 'listings' && <ListingsSection />}
      </main>
    </div>
  )
}

function Pagination({
  page, pageSize, total, setPage,
}: {
  page: number; pageSize: number; total: number; setPage: (p: number) => void
}) {
  const pages = Math.ceil(total / pageSize)
  if (pages <= 1) return null
  return (
    <div className="flex items-center gap-2 mt-4 text-sm">
      <button
        onClick={() => setPage(page - 1)}
        disabled={page <= 1}
        className="px-3 py-1 rounded border border-[var(--border)] disabled:opacity-30 hover:bg-[var(--muted)] transition-colors"
      >
        Prev
      </button>
      <span className="text-gray-400">Page {page} of {pages}</span>
      <button
        onClick={() => setPage(page + 1)}
        disabled={page >= pages}
        className="px-3 py-1 rounded border border-[var(--border)] disabled:opacity-30 hover:bg-[var(--muted)] transition-colors"
      >
        Next
      </button>
    </div>
  )
}

function UsersSection() {
  const [data, setData] = useState<{ data: Record<string, unknown>[]; total: number; page: number; pageSize: number } | null>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const pageSize = 15

  const load = useCallback(() => {
    api.admin.users({ page, pageSize, search: search || undefined }).then(setData).catch(() => {})
  }, [page, search])

  useEffect(() => { load() }, [load])

  const changeRole = async (id: string, role: string) => {
    try {
      await api.admin.updateUser(id, { role })
      load()
    } catch {}
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="max-w-xs"
        />
        <span className="text-sm text-gray-400">{data ? `${data.total} users` : ''}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-gray-400">
              <th className="pb-2 pr-4">Username</th>
              <th className="pb-2 pr-4">Email</th>
              <th className="pb-2 pr-4">Role</th>
              <th className="pb-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.data.map(u => (
              <tr key={u.id as string} className="border-b border-[var(--border)] hover:bg-[var(--muted)]">
                <td className="py-2.5 pr-4 font-medium">{u.username as string}</td>
                <td className="py-2.5 pr-4 text-gray-400">{u.email as string}</td>
                <td className="py-2.5 pr-4">
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    u.role === 'admin' ? 'bg-amber-900/40 text-amber-300' :
                    u.role === 'moderator' ? 'bg-blue-900/40 text-blue-300' :
                    'bg-gray-800 text-gray-300'
                  }`}>
                    {u.role as string}
                  </span>
                </td>
                <td className="py-2.5">
                  <select
                    value={u.role as string}
                    onChange={e => changeRole(u.id as string, e.target.value)}
                    className="text-xs py-1 px-2 rounded border border-[var(--border)] bg-[var(--background)]"
                  >
                    <option value="user">User</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} setPage={setPage} />}
    </div>
  )
}

function AssetsSection() {
  const [data, setData] = useState<{ data: Record<string, unknown>[]; total: number; page: number; pageSize: number } | null>(null)
  const [page, setPage] = useState(1)
  const pageSize = 15

  const load = useCallback(() => {
    api.admin.assets({ page, pageSize }).then(setData).catch(() => {})
  }, [page])

  useEffect(() => { load() }, [load])

  const remove = async (id: string) => {
    if (!confirm('Delete this asset? This will also remove any associated listings.')) return
    try {
      await api.admin.deleteAsset(id)
      load()
    } catch {}
  }

  return (
    <div>
      <div className="mb-4 text-sm text-gray-400">{data ? `${data.total} assets` : ''}</div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-gray-400">
              <th className="pb-2 pr-4">Name</th>
              <th className="pb-2 pr-4">Type</th>
              <th className="pb-2 pr-4">Owner</th>
              <th className="pb-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.data.map(a => (
              <tr key={a.id as string} className="border-b border-[var(--border)] hover:bg-[var(--muted)]">
                <td className="py-2.5 pr-4 font-medium">{a.name as string}</td>
                <td className="py-2.5 pr-4 text-gray-400">{a.type as string}</td>
                <td className="py-2.5 pr-4 text-gray-400">{a.ownerName as string}</td>
                <td className="py-2.5">
                  <button
                    onClick={() => remove(a.id as string)}
                    className="text-xs px-2 py-1 rounded bg-red-900/40 text-red-300 hover:bg-red-800 transition-colors"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} setPage={setPage} />}
    </div>
  )
}

function WorldsSection() {
  const [data, setData] = useState<{ data: Record<string, unknown>[]; total: number; page: number; pageSize: number } | null>(null)
  const [page, setPage] = useState(1)
  const pageSize = 15

  const load = useCallback(() => {
    api.admin.worlds({ page, pageSize }).then(setData).catch(() => {})
  }, [page])

  useEffect(() => { load() }, [load])

  const remove = async (id: string) => {
    if (!confirm('Delete this world? Associated NPCs will also be removed.')) return
    try {
      await api.admin.deleteWorld(id)
      load()
    } catch {}
  }

  return (
    <div>
      <div className="mb-4 text-sm text-gray-400">{data ? `${data.total} worlds` : ''}</div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-gray-400">
              <th className="pb-2 pr-4">Name</th>
              <th className="pb-2 pr-4">Visibility</th>
              <th className="pb-2 pr-4">Owner</th>
              <th className="pb-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.data.map(w => (
              <tr key={w.id as string} className="border-b border-[var(--border)] hover:bg-[var(--muted)]">
                <td className="py-2.5 pr-4 font-medium">{w.name as string}</td>
                <td className="py-2.5 pr-4">
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    w.visibility === 'public' ? 'bg-green-900/40 text-green-300' :
                    w.visibility === 'private' ? 'bg-red-900/40 text-red-300' :
                    'bg-gray-800 text-gray-300'
                  }`}>
                    {w.visibility as string}
                  </span>
                </td>
                <td className="py-2.5 pr-4 text-gray-400">{w.ownerName as string}</td>
                <td className="py-2.5">
                  <button
                    onClick={() => remove(w.id as string)}
                    className="text-xs px-2 py-1 rounded bg-red-900/40 text-red-300 hover:bg-red-800 transition-colors"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} setPage={setPage} />}
    </div>
  )
}

function ListingsSection() {
  const [data, setData] = useState<{ data: Record<string, unknown>[]; total: number; page: number; pageSize: number } | null>(null)
  const [page, setPage] = useState(1)
  const pageSize = 15

  const load = useCallback(() => {
    api.admin.listings({ page, pageSize }).then(setData).catch(() => {})
  }, [page])

  useEffect(() => { load() }, [load])

  const remove = async (id: string) => {
    if (!confirm('Delete this listing? Associated purchases will also be removed.')) return
    try {
      await api.admin.deleteListing(id)
      load()
    } catch {}
  }

  return (
    <div>
      <div className="mb-4 text-sm text-gray-400">{data ? `${data.total} listings` : ''}</div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-gray-400">
              <th className="pb-2 pr-4">Asset</th>
              <th className="pb-2 pr-4">Type</th>
              <th className="pb-2 pr-4">Seller</th>
              <th className="pb-2 pr-4">Price</th>
              <th className="pb-2 pr-4">Status</th>
              <th className="pb-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.data.map(l => (
              <tr key={l.id as string} className="border-b border-[var(--border)] hover:bg-[var(--muted)]">
                <td className="py-2.5 pr-4 font-medium">{l.assetName as string}</td>
                <td className="py-2.5 pr-4 text-gray-400">{l.assetType as string}</td>
                <td className="py-2.5 pr-4 text-gray-400">{l.sellerName as string}</td>
                <td className="py-2.5 pr-4">{l.price as string} {l.currency as string}</td>
                <td className="py-2.5 pr-4">
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    l.status === 'active' ? 'bg-green-900/40 text-green-300' : 'bg-gray-800 text-gray-300'
                  }`}>
                    {l.status as string}
                  </span>
                </td>
                <td className="py-2.5">
                  <button
                    onClick={() => remove(l.id as string)}
                    className="text-xs px-2 py-1 rounded bg-red-900/40 text-red-300 hover:bg-red-800 transition-colors"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} setPage={setPage} />}
    </div>
  )
}
