const BLOCKED_HOSTNAMES = [
  'localhost', '127.0.0.1', '0.0.0.0', '169.254.169.254',
  'metadata.google.internal', 'metadata.internal',
];
const BLOCKED_CIDR = [/^10\./, /^172\.(1[6-9]|2\d|3[01])\./, /^192\.168\./];

export function isInternalUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname;
    if (BLOCKED_HOSTNAMES.includes(host)) return true;
    if (BLOCKED_CIDR.some(r => r.test(host))) return true;
    return false;
  } catch {
    return true;
  }
}
