'use client'

interface PaginationProps {
  page: number
  total: number
  pageSize: number
  setPage: (p: number) => void
}

export function Pagination({ page, total, pageSize, setPage }: PaginationProps) {
  const pages = Math.ceil(total / pageSize)
  if (pages <= 1) return null

  const items: (number | '...')[] = []
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || (i >= page - 1 && i <= page + 1)) {
      items.push(i)
    } else if (items[items.length - 1] !== '...') {
      items.push('...')
    }
  }

  return (
    <div className="flex items-center gap-1.5 mt-4 text-sm">
      <button
        onClick={() => setPage(page - 1)}
        disabled={page <= 1}
        className="px-2.5 py-1.5 rounded border border-[var(--border)] disabled:opacity-30 hover:bg-[var(--muted)] transition-colors text-xs"
      >
        Prev
      </button>
      {items.map((item, i) =>
        item === '...' ? (
          <span key={`e${i}`} className="px-1 text-gray-500">...</span>
        ) : (
          <button
            key={item}
            onClick={() => setPage(item)}
            className={`px-2.5 py-1.5 rounded text-xs transition-colors ${
              item === page
                ? 'bg-[var(--accent)] text-white'
                : 'border border-[var(--border)] hover:bg-[var(--muted)]'
            }`}
          >
            {item}
          </button>
        )
      )}
      <button
        onClick={() => setPage(page + 1)}
        disabled={page >= pages}
        className="px-2.5 py-1.5 rounded border border-[var(--border)] disabled:opacity-30 hover:bg-[var(--muted)] transition-colors text-xs"
      >
        Next
      </button>
    </div>
  )
}
