'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { StatsCard } from '@/components/admin/StatsCard'

export default function AdminDashboard() {
  const [stats, setStats] = useState<Record<string, number>>({})
  const [timeline, setTimeline] = useState<{ usersByDay: { date: string; count: string }[]; worldsByDay: { date: string; count: string }[] } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.admin.stats(),
      api.admin.statsTimeline(),
    ]).then(([s, t]) => {
      setStats(s)
      setTimeline(t)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const maxUsers = Math.max(...(timeline?.usersByDay.map(d => parseInt(d.count)) ?? [1]), 1)
  const maxWorlds = Math.max(...(timeline?.worldsByDay.map(d => parseInt(d.count)) ?? [1]), 1)

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-0.5">Platform overview and activity</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <div className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          Loading stats...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            <StatsCard label="Users" value={stats.users ?? 0} icon="👥" change={`+${stats.usersToday ?? 0} today`} changeType="up" />
            <StatsCard label="Worlds" value={stats.worlds ?? 0} icon="🌍" change={`+${stats.worldsToday ?? 0} today`} changeType="up" />
            <StatsCard label="Assets" value={stats.assets ?? 0} icon="📦" />
            <StatsCard label="Active Listings" value={stats.listings ?? 0} icon="🏪" />
            <StatsCard label="Purchases" value={stats.purchases ?? 0} icon="🛒" />
            <StatsCard label="Health" value="OK" icon="💚" />
          </div>

          {timeline && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-lg border border-[var(--border)] p-4">
                <h3 className="text-sm font-semibold mb-3">New Users (30d)</h3>
                <div className="flex items-end gap-[2px] h-24">
                  {timeline.usersByDay.map(d => {
                    const h = (parseInt(d.count) / maxUsers) * 80
                    return (
                      <div key={d.date} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                        <div
                          className="w-full bg-[var(--accent)]/60 hover:bg-[var(--accent)] rounded-t transition-colors"
                          style={{ height: `${Math.max(h, 2)}px` }}
                        />
                        <div className="absolute bottom-full mb-1 hidden group-hover:block bg-[var(--muted)] text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap z-10">
                          {d.date}: {d.count}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="rounded-lg border border-[var(--border)] p-4">
                <h3 className="text-sm font-semibold mb-3">New Worlds (30d)</h3>
                <div className="flex items-end gap-[2px] h-24">
                  {timeline.worldsByDay.map(d => {
                    const h = (parseInt(d.count) / maxWorlds) * 80
                    return (
                      <div key={d.date} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                        <div
                          className="w-full bg-green-500/60 hover:bg-green-500 rounded-t transition-colors"
                          style={{ height: `${Math.max(h, 2)}px` }}
                        />
                        <div className="absolute bottom-full mb-1 hidden group-hover:block bg-[var(--muted)] text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap z-10">
                          {d.date}: {d.count}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
