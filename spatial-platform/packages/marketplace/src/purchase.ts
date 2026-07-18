import type { PurchaseResult, CartItem, Transaction, Balance } from './types'

export class MarketplacePurchase {
  private apiBase: string
  private token: string

  constructor(apiBase: string, token: string) {
    this.apiBase = apiBase
    this.token = token
  }

  async buy(listingId: string): Promise<PurchaseResult> {
    const res = await fetch(`${this.apiBase}/api/marketplace/purchases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
      },
      body: JSON.stringify({ listingId }),
    })
    if (!res.ok) throw new Error(`Purchase failed: ${res.statusText}`)
    return res.json()
  }

  async checkout(cart: CartItem[]): Promise<PurchaseResult[]> {
    const res = await fetch(`${this.apiBase}/api/marketplace/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
      },
      body: JSON.stringify({ items: cart }),
    })
    if (!res.ok) throw new Error(`Checkout failed: ${res.statusText}`)
    return res.json()
  }

  async getMyPurchases(): Promise<PurchaseResult[]> {
    const res = await fetch(`${this.apiBase}/api/marketplace/purchases/mine`, {
      headers: { 'Authorization': `Bearer ${this.token}` },
    })
    if (!res.ok) throw new Error(`Failed to fetch purchases: ${res.statusText}`)
    return res.json()
  }

  async getBalance(): Promise<Balance> {
    const res = await fetch(`${this.apiBase}/api/marketplace/balance`, {
      headers: { 'Authorization': `Bearer ${this.token}` },
    })
    if (!res.ok) throw new Error(`Failed to fetch balance: ${res.statusText}`)
    return res.json()
  }

  async getTransactions(): Promise<Transaction[]> {
    const res = await fetch(`${this.apiBase}/api/marketplace/transactions`, {
      headers: { 'Authorization': `Bearer ${this.token}` },
    })
    if (!res.ok) throw new Error(`Failed to fetch transactions: ${res.statusText}`)
    return res.json()
  }

  async addCredits(amount: number): Promise<Balance> {
    const res = await fetch(`${this.apiBase}/api/marketplace/credits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
      },
      body: JSON.stringify({ amount }),
    })
    if (!res.ok) throw new Error(`Failed to add credits: ${res.statusText}`)
    return res.json()
  }
}
