'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { Pagination } from '@/components/admin/Pagination'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'

export default function AdminListingsPage() {
  const [data, setData] = useState<{ data: Record<string, unknown>[]; total: number; page: number; pageSize: number } | null>(null)
  const [page, setPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const pageSize = 20

  const load = useCallback(() => {
    api.admin.listings({ page, pageSize }).then(setData).catch(() => {})
  }, [page])

  useEffect(() => { load() }, [load])

  const doDelete = async () => {
    if (!deleteTarget) return
    try {
      await api.admin.deleteListing(deleteTarget)
      setDeleteTarget(null)
      load()
    } catch {}
  }

  return (
    <div className="p-6">
<div className="mb-6">
        <div className="flex items-center gap-4">
          <a href="/dashboard" className="text-[var(--accent)] hover:underline text-sm">Dashboard</a>
          <a href="/admin" className="text-[var(--accent)] hover:underline text-sm">Admin</a>
        </div>
        <h1 className="text-xl font-bold">Listings</h1>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--muted)]/50 text-left text-gray-400 text-xs uppercase tracking-wider">
              <th className="py-3 px-4 font-medium">Asset</th>
              <th className="py-3 px-4 font-medium">Type</th>
              <th className="py-3 px-4 font-medium">Seller</th>
              <th className="py-3 px-4 font-medium">Price</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium">Created</th>
              <th className="py-3 px-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.data.map(l => (
              <tr key={l.id as string} className="border-t border-[var(--border)] hover:bg-[var(--muted)]/20 transition-colors">
                <td className="py-3 px-4 font-medium">{l.assetName as string}</td>
                <td className="py-3 px-4"><StatusBadge value={l.assetType as string} /></td>
                <td className="py-3 px-4 text-gray-400">{l.sellerName as string}</td>
                <td className="py-3 px-4">{l.price as string} {l.currency as string}</td>
                <td className="py-3 px-4"><StatusBadge value={l.status as string} /></td>
                <td className="py-3 px-4 text-gray-400 text-xs">
                  {new Date(l.createdAt as string).toLocaleDateString()}
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => setDeleteTarget(l.id as string)}
                    className="text-xs px-2.5 py-1 rounded bg-red-900/40 text-red-300 hover:bg-red-800 transition-colors"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {data?.data.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-500 text-sm">No listings found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} setPage={setPage} />}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Listing"
        message="Are you sure? This will permanently delete this listing and any associated purchases."
        confirmLabel="Delete Listing"
        variant="danger"
        onConfirm={doDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
