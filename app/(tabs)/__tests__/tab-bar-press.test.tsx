import { Text } from 'react-native';
import { Stack } from 'expo-router';
import { renderRouter, screen, waitFor, act } from 'expo-router/testing-library';

let mockTabBarProps: any = null;

jest.mock('@/components/LiquidDropTabBar', () => {
  const RN = require('react-native');
  return {
    LiquidDropTabBar: (props: any) => {
      mockTabBarProps = props;
      return <RN.Text testID="tabbar" />;
    },
  };
});

const TabLayout = require('@/app/(tabs)/_layout').default;

const context = {
  '(tabs)/_layout': () => <TabLayout />,
  '(tabs)/index': () => <Text>HOME_SCREEN</Text>,
  '(tabs)/search': () => <Text>SEARCH_SCREEN</Text>,
  '(tabs)/favorites': () => <Text>FAVORITES_SCREEN</Text>,
  '(tabs)/self-checkin': () => <Text>CHECKIN_SCREEN</Text>,
  '(tabs)/dining-reservations': () => <Text>DINING_SCREEN</Text>,
  '(tabs)/profile/_layout': () => <Stack screenOptions={{ headerShown: false }} />,
  '(tabs)/profile/index': () => <Text>PROFILE_SCREEN</Text>,
  '(tabs)/profile/notifications': () => <Text>PROFILE_NOTIF_SCREEN</Text>,
};

const pressTab = async (i: number) => {
  await act(async () => {
    mockTabBarProps.onTabPress(i, mockTabBarProps.tabs[i]);
  });
};

describe('Profile tab landing screen', () => {
  jest.setTimeout(30000);

  it('opens the profile hub, not a stale pushed screen', async () => {
    renderRouter(context, { initialUrl: '/profile/notifications' });
    await waitFor(() => expect(screen.getByText('PROFILE_NOTIF_SCREEN')).toBeTruthy());

    await pressTab(0);
    await waitFor(() => expect(screen.getByText('HOME_SCREEN')).toBeTruthy());

    await pressTab(3);
    await waitFor(() => expect(screen.getByText('PROFILE_SCREEN')).toBeTruthy());
    expect(screen.queryByText('PROFILE_NOTIF_SCREEN')).toBeNull();
  });
});
