const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api'

let token: string | null = null

export function setAuthToken(t: string | null): void {
  token = t
  if (t) {
    localStorage.setItem('spatial_token', t)
  } else {
    localStorage.removeItem('spatial_token')
  }
}

export function getAuthToken(): string | null {
  if (!token) {
    token = localStorage.getItem('spatial_token')
  }
  return token
}

export function isAuthenticated(): boolean {
  return !!getAuthToken()
}

async function request<T = unknown>(
  method: string,
  path: string,
  body?: unknown,
  options?: { formData?: boolean }
): Promise<T> {
  const headers: Record<string, string> = {}
  const t = getAuthToken()
  if (t) {
    headers['Authorization'] = `Bearer ${t}`
  }

  let fetchBody: BodyInit | undefined

  if (body !== undefined) {
    if (options?.formData) {
      fetchBody = body as FormData
    } else {
      headers['Content-Type'] = 'application/json'
      fetchBody = JSON.stringify(body)
    }
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: fetchBody,
  })

  if (!res.ok) {
    if (res.status === 401) {
      setAuthToken(null)
    }
    const err = await res.text()
    throw new Error(`API error ${res.status}: ${err}`)
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
  upload: <T>(path: string, formData: FormData) =>
    request<T>('POST', path, formData, { formData: true }),

  // Auth
  register: (data: { username: string; email: string; password: string }) =>
    request<{ user: Record<string, unknown>; token: string }>('POST', '/api/auth/register', data),
  login: (data: { email: string; password: string }) =>
    request<{ user: Record<string, unknown>; token: string }>('POST', '/api/auth/login', data),
  me: () => request<Record<string, unknown>>('GET', '/api/auth/me'),

  // Admin
  admin: {
    stats: () => request<Record<string, number>>('GET', '/api/admin/stats'),

    statsTimeline: () => request<{ usersByDay: { date: string; count: string }[]; worldsByDay: { date: string; count: string }[] }>(
      'GET', '/api/admin/stats/timeline'
    ),

    users: (params?: { page?: number; pageSize?: number; search?: string; role?: string }) => {
      const sp = new URLSearchParams()
      if (params?.page) sp.set('page', String(params.page))
      if (params?.pageSize) sp.set('pageSize', String(params.pageSize))
      if (params?.search) sp.set('search', params.search)
      if (params?.role) sp.set('role', params.role)
      const qs = sp.toString()
      return request<{ data: Record<string, unknown>[]; total: number; page: number; pageSize: number }>(
        'GET', `/api/admin/users${qs ? `?${qs}` : ''}`
      )
    },

    user: (id: string) =>
      request<Record<string, unknown>>('GET', `/api/admin/users/${id}`),

    updateUser: (id: string, data: { role?: string }) =>
      request<Record<string, unknown>>('PATCH', `/api/admin/users/${id}`, data),

    assets: (params?: { page?: number; pageSize?: number; type?: string }) => {
      const sp = new URLSearchParams()
      if (params?.page) sp.set('page', String(params.page))
      if (params?.pageSize) sp.set('pageSize', String(params.pageSize))
      if (params?.type) sp.set('type', params.type)
      const qs = sp.toString()
      return request<{ data: Record<string, unknown>[]; total: number; page: number; pageSize: number }>(
        'GET', `/api/admin/assets${qs ? `?${qs}` : ''}`
      )
    },

    deleteAsset: (id: string) => request<void>('DELETE', `/api/admin/assets/${id}`),

    worlds: (params?: { page?: number; pageSize?: number }) => {
      const sp = new URLSearchParams()
      if (params?.page) sp.set('page', String(params.page))
      if (params?.pageSize) sp.set('pageSize', String(params.pageSize))
      const qs = sp.toString()
      return request<{ data: Record<string, unknown>[]; total: number; page: number; pageSize: number }>(
        'GET', `/api/admin/worlds${qs ? `?${qs}` : ''}`
      )
    },

    deleteWorld: (id: string) => request<void>('DELETE', `/api/admin/worlds/${id}`),

    listings: (params?: { page?: number; pageSize?: number }) => {
      const sp = new URLSearchParams()
      if (params?.page) sp.set('page', String(params.page))
      if (params?.pageSize) sp.set('pageSize', String(params.pageSize))
      const qs = sp.toString()
      return request<{ data: Record<string, unknown>[]; total: number; page: number; pageSize: number }>(
        'GET', `/api/admin/listings${qs ? `?${qs}` : ''}`
      )
    },

    deleteListing: (id: string) => request<void>('DELETE', `/api/admin/listings/${id}`),

    settings: {
      list: () => request<{ data: { key: string; value: Record<string, unknown>; updatedAt: string; updatedBy: string | null }[] }>(
        'GET', '/api/admin/settings'
      ),
      update: (key: string, value: Record<string, unknown>) =>
        request<{ key: string; value: Record<string, unknown> }>('PUT', '/api/admin/settings', { key, value }),
    },

    logs: (params?: { page?: number; pageSize?: number; action?: string }) => {
      const sp = new URLSearchParams()
      if (params?.page) sp.set('page', String(params.page))
      if (params?.pageSize) sp.set('pageSize', String(params.pageSize))
      if (params?.action) sp.set('action', params.action)
      const qs = sp.toString()
      return request<{ data: Record<string, unknown>[]; total: number; page: number; pageSize: number }>(
        'GET', `/api/admin/logs${qs ? `?${qs}` : ''}`
      )
    },

    applications: (params?: { page?: number; pageSize?: number; status?: string }) => {
      const sp = new URLSearchParams()
      if (params?.page) sp.set('page', String(params.page))
      if (params?.pageSize) sp.set('pageSize', String(params.pageSize))
      if (params?.status) sp.set('status', params.status)
      const qs = sp.toString()
      return request<{ data: Record<string, unknown>[]; total: number; page: number; pageSize: number }>(
        'GET', `/api/admin/applications${qs ? `?${qs}` : ''}`
      )
    },

    updateApplication: (id: string, data: { status: string }) =>
      request<Record<string, unknown>>('PATCH', `/api/admin/applications/${id}`, data),
  },

  // Careers
  careers: {
    apply: (data: { name: string; email: string; position: string; portfolioUrl?: string; message?: string }) =>
      request<Record<string, unknown>>('POST', '/api/careers/apply', data),
  },
}
