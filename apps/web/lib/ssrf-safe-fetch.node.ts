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

async function validateUrl(url: string, options: SsrfFetchOptions): Promise<URL> {
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

  return parsed
}

async function validateRedirect(response: Response, options: SsrfFetchOptions): Promise<Response> {
  if (!response.status || response.status < 300 || response.status >= 400) {
    return response
  }
  const location = response.headers.get('location')
  if (!location) {
    return response
  }
  const resolvedUrl = new URL(location, response.url).toString()
  const validatedRedirectUrl = await validateUrl(resolvedUrl, options)
  const redirectResponse = await fetch(validatedRedirectUrl, { ...options, redirect: 'manual' })
  return validateRedirect(redirectResponse, options)
}

export async function ssrfFetch(url: string, options: SsrfFetchOptions = {}): Promise<Response> {
  const validatedUrl = await validateUrl(url, options)

  const response = await fetch(validatedUrl, {
    ...options,
    redirect: 'manual',
  })

  return validateRedirect(response, options)
}
