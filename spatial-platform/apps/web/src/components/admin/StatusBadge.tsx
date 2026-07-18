'use client'

const COLOR_MAP: Record<string, string> = {
  active: 'bg-green-900/40 text-green-300',
  sold: 'bg-blue-900/40 text-blue-300',
  inactive: 'bg-gray-800 text-gray-300',
  public: 'bg-green-900/40 text-green-300',
  private: 'bg-red-900/40 text-red-300',
  unlisted: 'bg-gray-800 text-gray-300',
  admin: 'bg-amber-900/40 text-amber-300',
  moderator: 'bg-blue-900/40 text-blue-300',
  user: 'bg-gray-800 text-gray-300',
  uploading: 'bg-yellow-900/40 text-yellow-300',
  ready: 'bg-green-900/40 text-green-300',
  model: 'bg-purple-900/40 text-purple-300',
  texture: 'bg-pink-900/40 text-pink-300',
  script: 'bg-cyan-900/40 text-cyan-300',
  audio: 'bg-orange-900/40 text-orange-300',
  video: 'bg-red-900/40 text-red-300',
  plugin: 'bg-indigo-900/40 text-indigo-300',
}

export function StatusBadge({ value }: { value: string }) {
  const color = COLOR_MAP[value.toLowerCase()] ?? 'bg-gray-800 text-gray-300'
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded ${color}`}>
      {value}
    </span>
  )
}
