'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { Pagination } from '@/components/admin/Pagination'

const ACTION_COLORS: Record<string, string> = {
  'user.role.change': 'text-amber-300',
  'asset.delete': 'text-red-300',
  'world.delete': 'text-red-300',
  'listing.delete': 'text-red-300',
  'settings.update': 'text-blue-300',
}

export default function AdminLogsPage() {
  const [data, setData] = useState<{ data: Record<string, unknown>[]; total: number; page: number; pageSize: number } | null>(null)
  const [page, setPage] = useState(1)
  const [actionFilter, setActionFilter] = useState('')
  const pageSize = 30

  const load = useCallback(() => {
    api.admin.logs({ page, pageSize, action: actionFilter || undefined })
      .then(setData).catch(() => {})
  }, [page, actionFilter])

  useEffect(() => { load() }, [load])

  const actions = [...new Set(data?.data.map(l => l.action as string) ?? [])]

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold">Audit Logs</h1>
        <p className="text-sm text-gray-400 mt-0.5">{data ? `${data.total} total events` : ''}</p>
      </div>

      <div className="mb-4">
        <select
          value={actionFilter}
          onChange={e => { setActionFilter(e.target.value); setPage(1) }}
          className="text-sm py-1.5"
        >
          <option value="">All actions</option>
          {actions.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--muted)]/50 text-left text-gray-400 text-xs uppercase tracking-wider">
              <th className="py-3 px-4 font-medium">Time</th>
              <th className="py-3 px-4 font-medium">Actor</th>
              <th className="py-3 px-4 font-medium">Action</th>
              <th className="py-3 px-4 font-medium">Entity</th>
              <th className="py-3 px-4 font-medium">Details</th>
              <th className="py-3 px-4 font-medium">IP</th>
            </tr>
          </thead>
          <tbody>
            {data?.data.map(l => (
              <tr key={l.id as string} className="border-t border-[var(--border)] hover:bg-[var(--muted)]/20 transition-colors">
                <td className="py-2.5 px-4 text-[11px] text-gray-400 whitespace-nowrap">
                  {new Date(l.createdAt as string).toLocaleString()}
                </td>
                <td className="py-2.5 px-4">{l.actorName as string}</td>
                <td className="py-2.5 px-4">
                  <span className={`text-xs font-mono ${ACTION_COLORS[l.action as string] ?? 'text-gray-300'}`}>
                    {l.action as string}
                  </span>
                </td>
                <td className="py-2.5 px-4 text-xs text-gray-400">
                  {l.entityType as string}
                  {l.entityId ? ` / ${(l.entityId as string).slice(0, 8)}…` : ''}
                </td>
                <td className="py-2.5 px-4 text-xs text-gray-500 max-w-[200px] truncate" title={JSON.stringify(l.metadata)}>
                  {l.metadata ? JSON.stringify(l.metadata).slice(0, 80) : '-'}
                </td>
                <td className="py-2.5 px-4 text-xs text-gray-500 font-mono">{l.ipAddress as string ?? '-'}</td>
              </tr>
            ))}
            {data?.data.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-500 text-sm">No audit logs found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} setPage={setPage} />}
    </div>
  )
}
