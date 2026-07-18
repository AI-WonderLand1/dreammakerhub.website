'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { Pagination } from '@/components/admin/Pagination'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'

export default function AdminUsersPage() {
  const [data, setData] = useState<{ data: Record<string, unknown>[]; total: number; page: number; pageSize: number } | null>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState('')
  const [showRoleDialog, setShowRoleDialog] = useState(false)
  const pageSize = 20

  const load = useCallback(() => {
    api.admin.users({ page, pageSize, search: search || undefined, role: roleFilter || undefined })
      .then(setData).catch(() => {})
  }, [page, search, roleFilter])

  useEffect(() => { load() }, [load])

  const promptRoleChange = (id: string, currentRole: string) => {
    setSelectedUser(id)
    setSelectedRole(currentRole)
    setShowRoleDialog(true)
  }

  const doRoleChange = async () => {
    if (!selectedUser) return
    try {
      await api.admin.updateUser(selectedUser, { role: selectedRole })
      setShowRoleDialog(false)
      setSelectedUser(null)
      load()
    } catch {}
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold">Users</h1>
        <p className="text-sm text-gray-400 mt-0.5">{data ? `${data.total} total users` : ''}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by username or email..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="w-72 pl-8 pr-3 py-1.5 text-sm"
          />
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <select
          value={roleFilter}
          onChange={e => { setRoleFilter(e.target.value); setPage(1) }}
          className="text-sm py-1.5"
        >
          <option value="">All roles</option>
          <option value="admin">Admin</option>
          <option value="moderator">Moderator</option>
          <option value="user">User</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--muted)]/50 text-left text-gray-400 text-xs uppercase tracking-wider">
              <th className="py-3 px-4 font-medium">Username</th>
              <th className="py-3 px-4 font-medium">Email</th>
              <th className="py-3 px-4 font-medium">Role</th>
              <th className="py-3 px-4 font-medium">Joined</th>
              <th className="py-3 px-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.data.map(u => (
              <tr key={u.id as string} className="border-t border-[var(--border)] hover:bg-[var(--muted)]/20 transition-colors">
                <td className="py-3 px-4">
                  <Link href={`/admin/users/${u.id}`} className="font-medium text-[var(--foreground)] hover:text-[var(--accent)] transition-colors">
                    {u.username as string}
                  </Link>
                </td>
                <td className="py-3 px-4 text-gray-400">{u.email as string}</td>
                <td className="py-3 px-4"><StatusBadge value={u.role as string} /></td>
                <td className="py-3 px-4 text-gray-400 text-xs">
                  {new Date(u.createdAt as string).toLocaleDateString()}
                </td>
                <td className="py-3 px-4 text-right">
                  <select
                    value={u.role as string}
                    onChange={e => promptRoleChange(u.id as string, e.target.value)}
                    className="text-xs py-1 px-2 rounded border border-[var(--border)] bg-[var(--background)]"
                  >
                    <option value="user">User</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
              </tr>
            ))}
            {data?.data.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-500 text-sm">No users found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} setPage={setPage} />}

      <ConfirmDialog
        open={showRoleDialog}
        title="Change User Role"
        message={`Are you sure you want to change this user's role to "${selectedRole}"?`}
        confirmLabel="Change Role"
        variant="default"
        onConfirm={doRoleChange}
        onCancel={() => { setShowRoleDialog(false); setSelectedUser(null) }}
      />
    </div>
  )
}
