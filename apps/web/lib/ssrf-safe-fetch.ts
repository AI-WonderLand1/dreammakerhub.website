const METADATA_HOSTNAMES = [
  '169.254.169.254',
  'metadata.google.internal',
  '100.100.100.200',
]

const PRIVATE_PATTERNS = [
  /^0\./,
  /^127\./,
  /^10\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^100\.(6[4-9]|\d{2,3})\./,
  /^198\.1[89]\./,
  /^::$/,
  /^::1$/,
  /^fc/i,
  /^fd/i,
  /^fe80:/i,
]

export class SsrfError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SsrfError'
  }
}

function normalizeHostname(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/\.+$/, '')
}

function isUnsafeHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().trim()
  const ipv4Match = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (ipv4Match) {
    const parts = ipv4Match.slice(1).map(Number)
    if (parts.some(p => p > 255)) return true
    const addr = parts.join('.')
    return PRIVATE_PATTERNS.some(p => p.test(addr))
  }
  if (host.includes(':')) {
    return PRIVATE_PATTERNS.some(p => p.test(host))
  }
  return (
    host === 'localhost' ||
    host === '0.0.0.0' ||
    host.startsWith('[::') ||
    host.startsWith('::ffff:') ||
    METADATA_HOSTNAMES.some(m => host === m || host.endsWith(`.${m}`))
  )
}

export interface SsrfFetchOptions extends RequestInit {
  allowedHosts?: readonly string[]
}

function describeUrl(url: string): { protocol: string; hostname: string; hasCredentials: boolean } {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { protocol: '', hostname: '', hasCredentials: false };
  }
  return {
    protocol: parsed.protocol,
    hostname: parsed.hostname,
    hasCredentials: !!parsed.username || !!parsed.password,
  }
}

function cloneInit(init: RequestInit): RequestInit {
  return {
    method: init.method,
    headers: init.headers,
    body: init.body,
    signal: init.signal,
    redirect: 'manual',
  }
}

export async function ssrfFetch(url: string, options: SsrfFetchOptions = {}): Promise<Response> {
  if (!options.allowedHosts || options.allowedHosts.length === 0) {
    throw new SsrfError('allowedHosts must be provided and non-empty')
  }

  const { protocol, hostname, hasCredentials } = describeUrl(url)

  if (protocol !== 'https:') {
    throw new SsrfError('Only HTTPS URLs are allowed')
  }
  if (hasCredentials) {
    throw new SsrfError('URL must not include credentials')
  }

  const normalized = normalizeHostname(hostname)
  if (isUnsafeHostname(normalized)) {
    throw new SsrfError('URL points to a disallowed network address')
  }

  const normalizedAllowedHosts = options.allowedHosts.map(allowed => normalizeHostname(allowed))
  const isAllowed = normalizedAllowedHosts.some(
    allowed => normalized === allowed || normalized.endsWith(`.${allowed}`)
  )
  if (!isAllowed) {
    throw new SsrfError('Host is not in the allowed list')
  }

  let currentUrl = url;
  const init = cloneInit(options);

  for (let i = 0; i < 5; i++) {
    const response = await fetch(currentUrl, init)

    if (!response.status || response.status < 300 || response.status >= 400) {
      return response
    }
    const location = response.headers.get('location')
    if (!location) return response

    const nextUrl = new URL(location, currentUrl).toString()
    const { protocol: nextProtocol, hostname: nextHostname, hasCredentials: nextHasCreds } = describeUrl(nextUrl)
    if (nextProtocol !== 'https:') throw new SsrfError('Redirect target must use HTTPS')
    if (nextHasCreds) throw new SsrfError('Redirect target must not include credentials')

    const nextNormalized = normalizeHostname(nextHostname)
    const nextIsAllowed = normalizedAllowedHosts.some(
      allowed => nextNormalized === allowed || nextNormalized.endsWith(`.${allowed}`)
    )
    if (!nextIsAllowed) throw new SsrfError('Redirect target is not in the allowed list')

    if (isUnsafeHostname(nextNormalized)) {
      throw new SsrfError('Redirect target points to a disallowed network address')
    }

    currentUrl = nextUrl
  }

  throw new SsrfError('Too many redirects')
}