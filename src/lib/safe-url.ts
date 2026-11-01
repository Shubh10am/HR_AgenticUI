import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

/** Private, loopback, link-local and other non-public ranges a user-supplied URL must never reach. */
function isPrivateAddress(address: string): boolean {
  if (isIP(address) === 6) {
    const lower = address.toLowerCase();
    if (lower === '::1' || lower === '::' || lower.startsWith('fe80') || lower.startsWith('fc') || lower.startsWith('fd')) return true;
    const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    return mapped ? isPrivateAddress(mapped[1]) : false;
  }
  const [a, b] = address.split('.').map(Number);
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
}

/**
 * Checks a URL an organization admin typed in (a custom AI endpoint) before the
 * server ever calls it: HTTPS only, and the host must resolve to public addresses.
 *
 * @returns An error message, or null when the URL is acceptable.
 */
export async function checkPublicHttpsUrl(raw: string): Promise<string | null> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return 'Enter a valid URL.';
  }
  if (url.protocol !== 'https:') return 'The endpoint must use https://.';
  if (url.username || url.password) return 'Remove the username and password from the URL.';
  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) return 'The endpoint must be a public address.';
  try {
    const addresses = isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
    if (addresses.length === 0 || addresses.some(({ address }) => isPrivateAddress(address))) return 'The endpoint must be a public address.';
  } catch {
    return 'That host could not be found.';
  }
  return null;
}
