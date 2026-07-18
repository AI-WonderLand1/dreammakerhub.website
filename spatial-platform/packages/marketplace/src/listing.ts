import type { ListingData } from './types'

export interface CreateListingInput {
  assetId: string
  price: number
  currency: 'credits' | 'usd'
  tags?: string[]
}

export class MarketplaceListing {
  private apiBase: string
  private token: string

  constructor(apiBase: string, token: string) {
    this.apiBase = apiBase
    this.token = token
  }

  async list(input: CreateListingInput): Promise<ListingData> {
    const res = await fetch(`${this.apiBase}/api/marketplace/listings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
      },
      body: JSON.stringify(input),
    })
    if (!res.ok) throw new Error(`Failed to create listing: ${res.statusText}`)
    return res.json()
  }

  async getAll(params?: {
    page?: number
    pageSize?: number
    assetType?: string
    tag?: string
    sortBy?: string
  }): Promise<{ data: ListingData[]; total: number; page: number; pageSize: number }> {
    const q = new URLSearchParams()
    if (params?.page) q.set('page', String(params.page))
    if (params?.pageSize) q.set('pageSize', String(params.pageSize))
    if (params?.assetType) q.set('assetType', params.assetType)
    if (params?.tag) q.set('tag', params.tag)
    if (params?.sortBy) q.set('sortBy', params.sortBy)

    const res = await fetch(`${this.apiBase}/api/marketplace/listings?${q}`, {
      headers: { 'Authorization': `Bearer ${this.token}` },
    })
    if (!res.ok) throw new Error(`Failed to fetch listings: ${res.statusText}`)
    return res.json()
  }

  async getById(id: string): Promise<ListingData> {
    const res = await fetch(`${this.apiBase}/api/marketplace/listings/${id}`, {
      headers: { 'Authorization': `Bearer ${this.token}` },
    })
    if (!res.ok) throw new Error(`Failed to fetch listing: ${res.statusText}`)
    return res.json()
  }

  async getMyListings(): Promise<ListingData[]> {
    const res = await fetch(`${this.apiBase}/api/marketplace/listings/mine`, {
      headers: { 'Authorization': `Bearer ${this.token}` },
    })
    if (!res.ok) throw new Error(`Failed to fetch my listings: ${res.statusText}`)
    return res.json()
  }

  async cancel(id: string): Promise<void> {
    const res = await fetch(`${this.apiBase}/api/marketplace/listings/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${this.token}` },
    })
    if (!res.ok) throw new Error(`Failed to cancel listing: ${res.statusText}`)
  }
}
