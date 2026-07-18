'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { Pagination } from '@/components/admin/Pagination'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'

const STATUS_OPTS = ['new', 'reviewed', 'contacted', 'rejected', 'accepted']

export default function AdminApplicationsPage() {
  const [data, setData] = useState<{ data: Record<string, unknown>[]; total: number; page: number; pageSize: number } | null>(null)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedApp, setSelectedApp] = useState<string | null>(null)
  const [statusValue, setStatusValue] = useState('')
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const pageSize = 20

  const load = useCallback(() => {
    api.admin.applications({ page, pageSize, status: statusFilter || undefined })
      .then(setData).catch(() => {})
  }, [page, statusFilter])

  useEffect(() => { load() }, [load])

  const promptStatus = (id: string, current: string) => {
    setSelectedApp(id)
    setStatusValue(current)
    setShowStatusDialog(true)
  }

  const doStatus = async () => {
    if (!selectedApp) return
    try {
      await api.admin.updateApplication(selectedApp, { status: statusValue })
      setShowStatusDialog(false)
      setSelectedApp(null)
      load()
    } catch {}
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold">Job Applications</h1>
        <p className="text-sm text-gray-400 mt-0.5">{data ? `${data.total} total applications` : ''}</p>
      </div>

      <div className="mb-4">
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
          className="text-sm py-1.5"
        >
          <option value="">All statuses</option>
          {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="space-y-2">
        {data?.data.map(a => (
          <div key={a.id as string} className="rounded-lg border border-[var(--border)] p-4 hover:border-[var(--accent)]/30 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{a.name as string}</span>
                  <StatusBadge value={a.status as string} />
                </div>
                <div className="text-xs text-gray-400 space-x-3">
                  <span>{a.email as string}</span>
                  <span className="text-[var(--accent)]">{a.position as string}</span>
                </div>
                {!!a.portfolioUrl && (
                  <a href={a.portfolioUrl as string} target="_blank" rel="noreferrer"
                     className="text-xs text-[var(--accent)] hover:underline mt-1 inline-block">
                    Portfolio &rarr;
                  </a>
                )}
                {!!a.message && (
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2">{(a.message as string).slice(0, 200)}</p>
                )}
                <div className="text-[10px] text-gray-600 mt-2">
                  {new Date(a.createdAt as string).toLocaleString()}
                </div>
              </div>
              <select
                value={a.status as string}
                onChange={e => promptStatus(a.id as string, e.target.value)}
                className="text-xs py-1 px-2 rounded border border-[var(--border)] bg-[var(--background)] shrink-0"
              >
                {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        ))}
        {data?.data.length === 0 && (
          <div className="py-8 text-center text-gray-500 text-sm">No applications found</div>
        )}
      </div>

      {data && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} setPage={setPage} />}

      <ConfirmDialog
        open={showStatusDialog}
        title="Update Application Status"
        message={`Change status to "${statusValue}"?`}
        confirmLabel="Update"
        onConfirm={doStatus}
        onCancel={() => { setShowStatusDialog(false); setSelectedApp(null) }}
      />
    </div>
  )
}
