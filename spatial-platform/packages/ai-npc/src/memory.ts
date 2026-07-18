export interface MemoryEntry {
  id: string
  timestamp: number
  type: 'observation' | 'conversation' | 'reflection'
  content: string
  importance: number
  decayFactor: number
}

export class NPCMemory {
  private entries: MemoryEntry[] = []
  private maxSize: number

  constructor(maxSize = 100) {
    this.maxSize = maxSize
  }

  add(entry: Omit<MemoryEntry, 'id' | 'timestamp'>): void {
    const mem: MemoryEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    }
    this.entries.push(mem)

    if (this.entries.length > this.maxSize * 1.5) {
      this.prune()
    }
  }

  recall(query: string, limit = 5): MemoryEntry[] {
    const q = query.toLowerCase()
    const scored = this.entries
      .map(e => ({
        entry: e,
        score: this.similarityScore(e.content.toLowerCase(), q) * e.importance * e.decayFactor,
      }))
      .filter(s => s.score > 0.1)
      .sort((a, b) => b.score - a.score)

    return scored.slice(0, limit).map(s => s.entry)
  }

  recent(count = 10): MemoryEntry[] {
    return [...this.entries]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, count)
  }

  summarize(): string {
    const recent = this.recent(5)
    if (recent.length === 0) return 'No memories yet.'
    return recent.map(m => `[${m.type}] ${m.content}`).join('\n')
  }

  private prune(): void {
    this.entries.sort((a, b) => {
      const aScore = a.importance * a.decayFactor
      const bScore = b.importance * b.decayFactor
      return aScore - bScore
    })
    this.entries = this.entries.slice(-this.maxSize)
  }

  private similarityScore(a: string, b: string): number {
    const wordsA = new Set(a.split(/\s+/))
    const wordsB = new Set(b.split(/\s+/))
    const intersection = new Set([...wordsA].filter(w => wordsB.has(w)))
    const union = new Set([...wordsA, ...wordsB])
    return union.size === 0 ? 0 : intersection.size / union.size
  }

  get size(): number {
    return this.entries.length
  }

  clear(): void {
    this.entries = []
  }
}
