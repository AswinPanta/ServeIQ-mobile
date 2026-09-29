// expo-router ships untranspulled ESM in this Jest setup — stub it so the pure
// helper can be imported without booting the router.
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: jest.fn() }),
  useSegments: () => [],
  usePathname: () => '/',
}));

import { buildLoginHref } from '../AuthGuard';

describe('buildLoginHref', () => {
  it('adds redirect for a portal base without a query string', () => {
    expect(buildLoginHref('guest', '/(tabs)/profile/reviews')).toBe(
      '/(auth)/login?redirect=%2F(tabs)%2Fprofile%2Freviews'
    );
  });

  it('appends redirect when the base already carries portal=host', () => {
    expect(buildLoginHref('host', '/(host)/my-properties')).toBe(
      '/(auth)/login?portal=host&redirect=%2F(host)%2Fmy-properties'
    );
  });

  it('round-trips back to a resolvable path', () => {
    const href = buildLoginHref('guest', '/(tabs)/profile/bookings/bk_123');
    const encoded = href.split('redirect=')[1];
    expect(decodeURIComponent(encoded)).toBe('/(tabs)/profile/bookings/bk_123');
  });
});
