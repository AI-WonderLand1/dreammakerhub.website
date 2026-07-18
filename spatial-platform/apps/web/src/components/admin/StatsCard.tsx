'use client'

interface StatsCardProps {
  label: string
  value: number | string
  change?: string
  changeType?: 'up' | 'down' | 'neutral'
  icon?: string
}

export function StatsCard({ label, value, change, changeType = 'neutral', icon }: StatsCardProps) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/40 p-4 hover:border-[var(--accent)]/40 transition-colors">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
        {icon && <span className="text-lg opacity-60">{icon}</span>}
      </div>
      <div className="text-2xl font-bold text-[var(--foreground)]">{value}</div>
      {change && (
        <div className={`text-xs mt-1 ${
          changeType === 'up' ? 'text-green-400' :
          changeType === 'down' ? 'text-red-400' :
          'text-gray-400'
        }`}>
          {changeType === 'up' ? '↑' : changeType === 'down' ? '↓' : '→'} {change}
        </div>
      )}
    </div>
  )
}
