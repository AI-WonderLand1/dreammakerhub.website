import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import https from 'node:https'

const METADATA_HOSTNAMES = [
  '169.254.169.254',
  'metadata.google.internal',
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

interface ResolvedAddress {
  address: string
  family: number
}

async function resolveSafe(
  hostname: string,
  options: SsrfFetchOptions
): Promise<{ hostname: string; address: ResolvedAddress }> {
  if (isIpFormat(hostname)) {
    if (isUnsafeResolvedIp(hostname)) {
      throw new SsrfError('Direct IP to a disallowed address')
    }
    const family = isIP(hostname)
    return { hostname, address: { address: hostname, family: family === 6 ? 6 : 4 } }
  }

  const records = await lookup(hostname, { all: true, verbatim: true })
  if (!records.length) {
    throw new SsrfError('Could not resolve hostname')
  }
  for (const record of records) {
    if (isUnsafeResolvedIp(record.address)) {
      throw new SsrfError('URL resolves to a disallowed network address')
    }
  }
  return { hostname, address: records[0] }
}

async function httpsFetch(
  url: string,
  hostname: string,
  address: ResolvedAddress,
  options: SsrfFetchOptions
): Promise<Response> {
  const parsed = new URL(url)
  const port = parsed.port ? parseInt(parsed.port, 10) : 443

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: address.address,
        port,
        path: parsed.pathname + parsed.search,
        method: options.method || 'GET',
        headers: {
          ...(options.headers as Record<string, string>),
          Host: hostname,
          ...(parsed.port ? {} : {}),
        },
        servername: hostname,
        rejectUnauthorized: true,
        signal: options.signal as AbortSignal | undefined,
        timeout: 30000,
      },
      (res) => {
        const chunks: Buffer[] = []
        res.on('data', (chunk: Buffer) => chunks.push(chunk))
        res.on('end', () => {
          const body = Buffer.concat(chunks)
          resolve(new Response(body, {
            status: res.statusCode,
            statusText: res.statusMessage,
            headers: new Headers(res.headers as Record<string, string>),
          }))
        })
      }
    )
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new SsrfError('Request timed out')) })

    if (options.body) {
      req.write(options.body)
    }
    req.end()
  })
}

export async function ssrfFetch(url: string, options: SsrfFetchOptions = {}): Promise<Response> {
  if (!options.allowedHosts || options.allowedHosts.length === 0) {
    throw new SsrfError('allowedHosts must be provided and non-empty')
  }

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

  if (options.allowedHosts && options.allowedHosts.length > 0) {
    const normalizedAllowedHosts = options.allowedHosts.map(allowed => normalizeHostname(allowed))
    const isAllowed = normalizedAllowedHosts.some(
      allowed => hostname === allowed || hostname.endsWith(`.${allowed}`)
    )
    if (!isAllowed) {
      throw new SsrfError('Host is not in the allowed list')
    }
  }

  const { address } = await resolveSafe(hostname, options)

  let response = await httpsFetch(url, hostname, address, options)

  for (let i = 0; i < 5; i++) {
    if (!response.status || response.status < 300 || response.status >= 400) {
      return response
    }
    const location = response.headers.get('location')
    if (!location) break

    const resolvedUrl = new URL(location, url).toString()
    const redirectParsed = new URL(resolvedUrl)
    const redirectHostname = normalizeHostname(redirectParsed.hostname)

    if (redirectParsed.protocol !== 'https:') {
      throw new SsrfError('Redirect target must use HTTPS')
    }
    if (isMetadataHostname(redirectHostname)) {
      throw new SsrfError('Redirect to metadata endpoint is not allowed')
    }

    const { address: redirectAddress } = await resolveSafe(redirectHostname, options)
    response = await httpsFetch(resolvedUrl, redirectHostname, redirectAddress, options)
  }

  if (response.status >= 300 && response.status < 400) {
    throw new SsrfError('Too many redirects')
  }

  return response
}
