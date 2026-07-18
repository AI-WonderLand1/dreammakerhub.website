export interface ListingData {
  id: string
  assetId: string
  assetName: string
  assetType: 'model' | 'texture' | 'script' | 'audio' | 'video' | 'plugin'
  thumbnailUrl: string | null
  sellerId: string
  sellerName: string
  price: number
  currency: 'credits' | 'usd'
  status: 'active' | 'sold' | 'cancelled'
  tags: string[]
  downloadCount: number
  createdAt: string
}

export interface PurchaseResult {
  id: string
  listingId: string
  assetId: string
  assetUrl: string
  amount: number
  currency: 'credits' | 'usd'
  purchasedAt: string
}

export interface CartItem {
  listingId: string
  price: number
  currency: 'credits' | 'usd'
}

export interface Transaction {
  id: string
  userId: string
  type: 'purchase' | 'sale' | 'deposit' | 'withdrawal'
  amount: number
  currency: 'credits' | 'usd'
  description: string
  createdAt: string
}

export interface Balance {
  credits: number
  usdCents: number
}
