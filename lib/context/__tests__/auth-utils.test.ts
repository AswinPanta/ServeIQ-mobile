import { decodeJwtRole } from '@/lib/context/auth-utils';

function b64Url(str: string): string {
  const b64 = Buffer.from(str, 'utf8').toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function makeToken(payload: unknown): string {
  return `header.${b64Url(JSON.stringify(payload))}.signature`;
}

describe('decodeJwtRole', () => {
  it('returns the role claim from a well-formed token', () => {
    expect(decodeJwtRole(makeToken({ sub: 'user-1', role: 'manager' }))).toBe('manager');
  });

  it('returns the role claim verbatim (caller lowercases)', () => {
    expect(decodeJwtRole(makeToken({ sub: 'user-1', role: 'MANAGER' }))).toBe('MANAGER');
  });

  it('returns the role claim even when other claims exist', () => {
    const token = makeToken({ sub: 'user-1', exp: 9999999999, role: 'front_desk', tenant_id: 't-1' });
    expect(decodeJwtRole(token)).toBe('front_desk');
  });

  it('handles non-ASCII characters elsewhere in the payload', () => {
    const token = makeToken({ sub: 'user-1', name: 'José María', role: 'waiter' });
    expect(decodeJwtRole(token)).toBe('waiter');
  });

  it('returns null when the role claim is missing', () => {
    expect(decodeJwtRole(makeToken({ sub: 'user-1' }))).toBeNull();
  });

  it('returns null for a malformed token (no payload segment)', () => {
    expect(decodeJwtRole('not-a-jwt')).toBeNull();
    expect(decodeJwtRole('onlyone')).toBeNull();
  });

  it('returns null for an undecodable payload', () => {
    expect(decodeJwtRole(`header.%%%!!!.signature`)).toBeNull();
  });

  it('returns null for empty or non-string input', () => {
    expect(decodeJwtRole('')).toBeNull();
    expect(decodeJwtRole(null as unknown as string)).toBeNull();
    expect(decodeJwtRole(undefined as unknown as string)).toBeNull();
  });

  it('returns null when the payload is not JSON', () => {
    const token = `header.${b64Url('just-some-text')}.signature`;
    expect(decodeJwtRole(token)).toBeNull();
  });
});
