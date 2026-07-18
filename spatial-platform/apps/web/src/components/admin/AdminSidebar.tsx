'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: '▦' },
  { href: '/admin/users', label: 'Users', icon: '👥' },
  { href: '/admin/worlds', label: 'Worlds', icon: '🌍' },
  { href: '/admin/assets', label: 'Assets', icon: '📦' },
  { href: '/admin/listings', label: 'Listings', icon: '🏪' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙' },
  { href: '/admin/logs', label: 'Audit Logs', icon: '📋' },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 border-r border-[var(--border)] bg-[var(--muted)]/30 flex flex-col shrink-0">
      <div className="px-4 py-4 border-b border-[var(--border)]">
        <Link href="/" className="text-[var(--accent)] text-xs hover:underline">&larr; Back to App</Link>
        <div className="text-sm font-semibold mt-1 text-[var(--foreground)]">Admin Console</div>
      </div>
      <nav className="flex-1 p-2 space-y-0.5">
        {NAV_ITEMS.map(item => {
          const active = item.href === '/admin'
            ? pathname === '/admin'
            : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                active
                  ? 'bg-[var(--accent)]/10 text-[var(--accent)] font-medium'
                  : 'text-gray-400 hover:text-[var(--foreground)] hover:bg-[var(--border)]/30'
              }`}
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="p-3 border-t border-[var(--border)] text-[10px] text-gray-500">
        Spatial Platform v0.1
      </div>
    </aside>
  )
}
