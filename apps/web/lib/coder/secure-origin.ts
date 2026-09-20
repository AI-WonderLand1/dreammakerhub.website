/** The privileged Coder session token must never cross plaintext PUBLIC HTTP. */
export function secureCoderApiOrigin(configured: string): string {
  let parsed: URL;
  try { parsed = new URL(configured); } catch { throw new Error('Coder API URL is invalid.'); }
  if (!['https:', 'http:'].includes(parsed.protocol) || parsed.username || parsed.password ||
      parsed.search || parsed.hash || parsed.pathname.replace(/\/$/, '') !== '') {
    throw new Error('Coder API must be a valid origin without credentials or a path.');
  }
  const host = parsed.hostname.toLowerCase();
  const octets = host.split('.').map(Number);
  const ipv4 = octets.length === 4 && octets.every((part, index) =>
    /^\d{1,3}$/.test(host.split('.')[index]) && Number.isInteger(part) && part >= 0 && part <= 255);
  const privateIpv4 = ipv4 && (octets[0] === 10 || octets[0] === 127 ||
    (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
    (octets[0] === 192 && octets[1] === 168));
  const internal = host === 'localhost' || host === '[::1]' ||
    host.endsWith('.svc') || host.endsWith('.svc.cluster.local') || privateIpv4;
  if (parsed.protocol === 'http:' && !internal) {
    throw new Error('Coder API tokens require HTTPS on public hosts, or private in-cluster HTTP.');
  }
  return parsed.origin;
}
