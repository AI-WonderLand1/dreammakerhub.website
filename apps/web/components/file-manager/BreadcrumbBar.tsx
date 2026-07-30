'use client';

interface BreadcrumbBarProps {
  path: string | null;
  onNavigate: (path: string) => void;
}

export function BreadcrumbBar({ path, onNavigate }: BreadcrumbBarProps) {
  if (!path) {
    return (
      <div className="border-b border-white/10 px-3 py-1.5">
        <span className="text-xs text-white/40">No file selected</span>
      </div>
    );
  }

  const parts = path.split('/');

  return (
    <div className="flex items-center gap-1 border-b border-white/10 px-3 py-1.5 overflow-x-auto">
      {parts.map((part, i) => {
        const partPath = parts.slice(0, i + 1).join('/');
        const isLast = i === parts.length - 1;

        return (
          <span key={partPath} className="flex items-center gap-1 whitespace-nowrap">
            {i > 0 && <span className="text-white/30">/</span>}
            <button
              onClick={() => onNavigate(partPath)}
              className={`text-xs ${
                isLast ? 'text-white font-medium' : 'text-white/50 hover:text-white'
              }`}
            >
              {part}
            </button>
          </span>
        );
      })}
    </div>
  );
}
