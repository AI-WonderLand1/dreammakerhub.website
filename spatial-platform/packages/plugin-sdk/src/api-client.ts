import type { PluginAPI } from './types'

export function createPluginAPI(baseUrl: string, token: string): PluginAPI {
  async function request<T = unknown>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${baseUrl}/api${path}`
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
    }
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json'
    }
    const res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`API error ${res.status}: ${err}`)
    }
    return res.json()
  }

  return {
    request,
    getWorld: (id) => request('GET', `/worlds/${id}`),
    updateScene: (worldId, scene) => request('PUT', `/worlds/${worldId}/scene`, scene),
    getAsset: (id) => request('GET', `/assets/${id}`),
    uploadAsset: async (file) => {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`${baseUrl}/api/assets/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: form,
      })
      if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`)
      return res.json()
    },
    notify: (message, type = 'info') => {
      const event = new CustomEvent('spatial-plugin-notification', {
        detail: { message, type },
      })
      window.dispatchEvent(event)
    },
  }
}
