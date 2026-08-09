'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [user, setUser] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [showRoleDialog, setShowRoleDialog] = useState(false)
  const [newRole, setNewRole] = useState('')

  useEffect(() => {
    api.admin.user(id).then(u => {
      setUser(u)
      setNewRole(u.role as string)
    }).catch(() => router.push('/admin/users'))
      .finally(() => setLoading(false))
  }, [id, router])

  const changeRole = async () => {
    try {
      const updated = await api.admin.updateUser(id, { role: newRole })
      setUser(updated)
      setShowRoleDialog(false)
    } catch {}
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <div className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          Loading user...
        </div>
      </div>
    )
  }

  if (!user) {
    return <div className="p-6 text-gray-400 text-sm">User not found</div>
  }

  return (
    <div className="p-6">
      <button onClick={() => router.back()} className="text-[var(--accent)] hover:underline text-sm mb-4">&larr; Back to Users</button>

      <div className="flex items-center gap-4 mb-6">
          <a href="/dashboard" className="text-[var(--accent)] hover:underline text-sm">Dashboard</a>
          <button onClick={() => router.back()} className="text-[var(--accent)] hover:underline text-sm">&larr; Back to Users</button>
          {(user.username as string)?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div>
          <h1 className="text-xl font-bold">{user.username as string}</h1>
          <p className="text-sm text-gray-400">{user.email as string}</p>
        </div>
        <StatusBadge value={user.role as string} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-lg border border-[var(--border)] p-4">
          <div className="text-xs text-gray-400 uppercase">Worlds</div>
          <div className="text-xl font-bold mt-1">{String(user.worldCount ?? '0')}</div>
        </div>
        <div className="rounded-lg border border-[var(--border)] p-4">
          <div className="text-xs text-gray-400 uppercase">Assets</div>
          <div className="text-xl font-bold mt-1">{String(user.assetCount ?? '0')}</div>
        </div>
        <div className="rounded-lg border border-[var(--border)] p-4">
          <div className="text-xs text-gray-400 uppercase">Joined</div>
          <div className="text-sm font-medium mt-1">
            {user.createdAt ? new Date(user.createdAt as string).toLocaleDateString() : '-'}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-[var(--border)] p-4">
        <h3 className="text-sm font-semibold mb-3">Role Management</h3>
        <div className="flex items-center gap-3">
          <select
            value={newRole}
            onChange={e => setNewRole(e.target.value)}
            className="text-sm py-1.5"
          >
            <option value="user">User</option>
            <option value="moderator">Moderator</option>
            <option value="admin">Admin</option>
          </select>
          <button
            onClick={() => setShowRoleDialog(true)}
            disabled={newRole === (user.role as string)}
            className="px-3 py-1.5 text-sm rounded bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-30 text-white transition-colors"
          >
            Update Role
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={showRoleDialog}
        title="Change User Role"
        message={`Change ${user.username as string}'s role from "${user.role as string}" to "${newRole}"?`}
        confirmLabel="Change Role"
        onConfirm={changeRole}
        onCancel={() => setShowRoleDialog(false)}
      />
    </div>
  )
}
