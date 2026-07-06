import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'

const METADATA_HOSTNAMES = [
  '169.254.169.254',
  'metadata.google.internal',
  'metadata.google.internal.',
  '100.100.100.200',
  '100.100.100.200',
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

function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split('.').map(Number)
  if (parts.length !== 4 || parts.some(p => Number.isNaN(p) || p < 0 || p > 255)) {
    return true
  }
  const [a, b] = parts
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 198 && (b === 18 || b === 19))
  )
}

function isPrivateIpv6(ip: string): boolean {
  const normalized = ip.toLowerCase()
  return (
    normalized === '::' ||
    normalized === '::1' ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    normalized.startsWith('fe80:')
  )
}

function isUnsafeResolvedIp(ip: string): boolean {
  const family = isIP(ip)
  if (family === 4) return isPrivateIpv4(ip)
  if (family === 6) return isPrivateIpv6(ip)
  return true
}

function isLocalHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().trim()
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '::1' ||
    host === '0.0.0.0' ||
    host.startsWith('[::') ||
    host.startsWith('::ffff:')
  )
}

function isIpFormat(hostname: string): boolean {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) || hostname.includes(':')
}

function isMetadataHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().trim()
  return METADATA_HOSTNAMES.some(m => host === m || host.endsWith(`.${m}`))
}

export interface SsrfFetchOptions extends RequestInit {
  allowedHosts?: readonly string[]
  blockLocalhost?: boolean
}

function buildSafeFetchInit(options: SsrfFetchOptions): RequestInit {
  const init: RequestInit = {
    redirect: 'manual',
  }

  if (options.method !== undefined) init.method = options.method
  if (options.headers !== undefined) init.headers = options.headers
  if (options.body !== undefined) init.body = options.body
  if (options.signal !== undefined) init.signal = options.signal
  if (options.cache !== undefined) init.cache = options.cache
  if (options.credentials !== undefined) init.credentials = options.credentials
  if (options.integrity !== undefined) init.integrity = options.integrity
  if (options.keepalive !== undefined) init.keepalive = options.keepalive
  if (options.mode !== undefined) init.mode = options.mode
  if (options.priority !== undefined) init.priority = options.priority
  if (options.referrer !== undefined) init.referrer = options.referrer
  if (options.referrerPolicy !== undefined) init.referrerPolicy = options.referrerPolicy
  if (options.duplex !== undefined) init.duplex = options.duplex

  return init
}

async function validateUrl(url: string, options: SsrfFetchOptions): Promise<string> {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new SsrfError('Invalid URL')
  }

  if (parsed.protocol !== 'https:') {
    throw new SsrfError('Only HTTPS URLs are allowed')
  }

  if (parsed.username || parsed.password) {
    throw new SsrfError('URL must not include credentials')
  }

  const hostname = normalizeHostname(parsed.hostname)

  if (isLocalHostname(hostname)) {
    if (options.blockLocalhost !== false) {
      throw new SsrfError('Localhost URLs are not allowed')
    }
  }

  if (isMetadataHostname(hostname)) {
    throw new SsrfError('Metadata endpoints are not allowed')
  }

  if (isIpFormat(hostname)) {
    if (isUnsafeResolvedIp(hostname)) {
      throw new SsrfError('Direct IP to a disallowed address')
    }
  }

  if (options.allowedHosts && options.allowedHosts.length > 0) {
    const normalizedAllowedHosts = options.allowedHosts.map(allowed => normalizeHostname(allowed))
    const isAllowed = normalizedAllowedHosts.some(
      allowed => hostname === allowed || hostname.endsWith(`.${allowed}`)
    )
    if (!isAllowed) {
      throw new SsrfError('Host is not in the allowed list')
    }
  }

  const records = await lookup(hostname, { all: true, verbatim: true })
  if (!records.length || records.some(record => isUnsafeResolvedIp(record.address))) {
    throw new SsrfError('URL resolves to a disallowed network address')
  }

  return parsed.toString()
}

async function validateRedirect(
  response: Response,
  options: SsrfFetchOptions,
  remainingRedirects: number = 5
): Promise<Response> {
  if (!response.status || response.status < 300 || response.status >= 400) {
    return response
  }
  if (remainingRedirects <= 0) {
    throw new SsrfError('Too many redirects')
  }
  const location = response.headers.get('location')
  if (!location) {
    return response
  }
  const resolvedUrl = new URL(location, response.url).toString()
  const validatedRedirectUrl = await validateUrl(resolvedUrl, options)
  const redirectResponse = await fetch(validatedRedirectUrl, buildSafeFetchInit(options))
  return validateRedirect(redirectResponse, options, remainingRedirects - 1)
}

export async function ssrfFetch(url: string, options: SsrfFetchOptions = {}): Promise<Response> {
  if (!options.allowedHosts || options.allowedHosts.length === 0) {
    throw new SsrfError('allowedHosts must be provided and non-empty')
  }

  const validatedUrl = await validateUrl(url, options)

  // CodeQL SSRF false positive: validatedUrl has been checked for HTTPS-only,
  // localhost, private IPs, metadata endpoints, DNS resolution, and allowedHosts whitelist.
  const response = await fetch(validatedUrl, buildSafeFetchInit(options)) // CodeQL [js/request-forgery]: Suppressed — URL fully validated above with DNS check

  return validateRedirect(response, options)
}
