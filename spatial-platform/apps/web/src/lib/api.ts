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
}
