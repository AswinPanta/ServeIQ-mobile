const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function base64UrlDecode(input: string): string {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  let binary = '';
  for (let i = 0; i < padded.length; i += 4) {
    const chunk = padded.slice(i, i + 4);
    const indexes = chunk.split('').map(c => (c === '=' ? 0 : B64_CHARS.indexOf(c)));
    if (indexes.some(idx => idx < 0)) throw new Error('Invalid base64url chunk');
    const [a, b, c, d] = indexes;
    binary += String.fromCharCode((a << 2) | (b >> 4));
    if (chunk[2] !== '=') binary += String.fromCharCode(((b & 15) << 4) | (c >> 2));
    if (chunk[3] !== '=') binary += String.fromCharCode(((c & 3) << 6) | d);
  }
  return binary;
}

/**
 * Decode the `role` claim from a JWT access token without pulling in a JWT
 * library. The backend signs access tokens with a role claim (e.g. `manager`,
 * `front_desk`). Used as a fallback portal detector when the `/me` probes are
 * unavailable. Returns null when the token is malformed or has no role claim.
 */
export function decodeJwtRole(token: string): string | null {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const raw = base64UrlDecode(parts[1]);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    const text = typeof TextDecoder !== 'undefined' ? new TextDecoder().decode(bytes) : raw;
    const data = JSON.parse(text);
    return typeof data.role === 'string' && data.role.length > 0 ? data.role : null;
  } catch {
    return null;
  }
}
