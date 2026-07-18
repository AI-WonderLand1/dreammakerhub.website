'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { Pagination } from '@/components/admin/Pagination'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'

export default function AdminAssetsPage() {
  const [data, setData] = useState<{ data: Record<string, unknown>[]; total: number; page: number; pageSize: number } | null>(null)
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const pageSize = 20

  const load = useCallback(() => {
    api.admin.assets({ page, pageSize, type: typeFilter || undefined })
      .then(setData).catch(() => {})
  }, [page, typeFilter])

  useEffect(() => { load() }, [load])

  const doDelete = async () => {
    if (!deleteTarget) return
    try {
      await api.admin.deleteAsset(deleteTarget)
      setDeleteTarget(null)
      load()
    } catch {}
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold">Assets</h1>
        <p className="text-sm text-gray-400 mt-0.5">{data ? `${data.total} total assets` : ''}</p>
      </div>

      <div className="mb-4">
        <select
          value={typeFilter}
          onChange={e => { setTypeFilter(e.target.value); setPage(1) }}
          className="text-sm py-1.5"
        >
          <option value="">All types</option>
          <option value="model">Model</option>
          <option value="texture">Texture</option>
          <option value="script">Script</option>
          <option value="audio">Audio</option>
          <option value="video">Video</option>
          <option value="plugin">Plugin</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--muted)]/50 text-left text-gray-400 text-xs uppercase tracking-wider">
              <th className="py-3 px-4 font-medium">Name</th>
              <th className="py-3 px-4 font-medium">Type</th>
              <th className="py-3 px-4 font-medium">Owner</th>
              <th className="py-3 px-4 font-medium">Downloads</th>
              <th className="py-3 px-4 font-medium">Created</th>
              <th className="py-3 px-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.data.map(a => (
              <tr key={a.id as string} className="border-t border-[var(--border)] hover:bg-[var(--muted)]/20 transition-colors">
                <td className="py-3 px-4 font-medium max-w-[200px] truncate" title={a.name as string}>
                  {a.name as string}
                </td>
                <td className="py-3 px-4"><StatusBadge value={a.type as string} /></td>
                <td className="py-3 px-4 text-gray-400">{a.ownerName as string}</td>
                <td className="py-3 px-4 text-gray-400 text-xs">{String(a.downloadCount ?? '0')}</td>
                <td className="py-3 px-4 text-gray-400 text-xs">
                  {new Date(a.createdAt as string).toLocaleDateString()}
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => setDeleteTarget(a.id as string)}
                    className="text-xs px-2.5 py-1 rounded bg-red-900/40 text-red-300 hover:bg-red-800 transition-colors"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {data?.data.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-500 text-sm">No assets found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} setPage={setPage} />}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Asset"
        message="Are you sure? This will permanently delete this asset and any associated marketplace listings."
        confirmLabel="Delete Asset"
        variant="danger"
        onConfirm={doDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
