import { Text } from 'react-native';
import { Stack } from 'expo-router';
import { renderRouter, screen, testRouter, waitFor } from 'expo-router/testing-library';
import { AuthGuard } from '../AuthGuard';

const mockAuth = { isLoading: false, isSignedIn: false, portal: 'guest' };

jest.mock('@/lib/context/auth-context', () => ({
  useAuth: () => mockAuth,
}));
jest.mock('@/hooks/use-colors', () => ({
  useColors: () => ({ primary: '#000', background: '#fff' }),
}));

// Keys are extension-free: inMemoryContext strips `./` and the extension on lookup.
const context = {
  '(auth)/login': () => <Text>LOGIN_SCREEN</Text>,
  '(tabs)/profile/_layout': () => (
    <AuthGuard portal="guest">
      <Stack screenOptions={{ headerShown: false }} />
    </AuthGuard>
  ),
  '(tabs)/profile/index': () => <Text>PROFILE_SCREEN</Text>,
};

describe('AuthGuard routing', () => {
  it('usePathname() drops the route-group prefix', async () => {
    // Unguarded copy of the same routes — a guard would already have bounced us.
    const r = renderRouter(
      {
        '(auth)/login': () => <Text>LOGIN_SCREEN</Text>,
        '(tabs)/profile/index': () => <Text>PROFILE_SCREEN</Text>,
      },
      { initialUrl: '/profile' }
    );
    expect(r.getPathname()).toBe('/profile');
    expect(r.getSegments()).toEqual(['(tabs)', 'profile']);
  });

  it('bounces a signed-out guest to login, preserving the path', async () => {
    const r = renderRouter(context, { initialUrl: '/profile' });
    await waitFor(() => expect(screen.getByText('LOGIN_SCREEN')).toBeTruthy());
    expect(r.getSearchParams().redirect).toBe('/profile');
  });

  it('keeps the profile screen mounted when signed in', async () => {
    mockAuth.isSignedIn = true;
    try {
      renderRouter(context, { initialUrl: '/profile' });
      await waitFor(() => expect(screen.getByText('PROFILE_SCREEN')).toBeTruthy());
    } finally {
      mockAuth.isSignedIn = false;
    }
  });

  it('the redirect value it produces is a navigable href', async () => {
    const r = renderRouter(context, { initialUrl: '/profile' });
    await waitFor(() => expect(screen.getByText('LOGIN_SCREEN')).toBeTruthy());
    const redirect = String(r.getSearchParams().redirect);

    // Sign in and follow the exact string AuthGuard handed to the login screen.
    mockAuth.isSignedIn = true;
    try {
      testRouter.replace(redirect);
      await waitFor(() => expect(screen.getByText('PROFILE_SCREEN')).toBeTruthy());
      expect(r.getPathname()).toBe('/profile');
    } finally {
      mockAuth.isSignedIn = false;
    }
  });
});
