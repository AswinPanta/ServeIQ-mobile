// Jest setup — runs once per test file *after* the framework is loaded.
// Mocks Reanimated 4 (v4 deprecated setUpTests() in favour of the
// official mock module path), React Native Gesture Handler 2.x,
// Expo Haptics, and AsyncStorage. Also extends @testing-library/react-native
// matchers (extend-expect was removed in @testing-library/react-native v13).

// RNGH 2 ships an explicit jestSetup we should call BEFORE mocking.
import 'react-native-gesture-handler/jestSetup';


// Reanimated 4 mock — shared values become plain {value}, animations
// resolve immediately, worklets become no-op JS.
jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock'),
);

// NOTE: react-native-worklets must NOT be stubbed here — the reanimated mock
// imports createSerializable from it. The jest resolver
// (react-native-worklets/jest/resolver.js, see jest.config.js) handles it.

// Expo Haptics has no native module under Jest — return no-op counters.
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  selectionAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

// AsyncStorage — JSI-backed on-device, but Jest needs the stub.
// require rather than import so we get the default export cleanly.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Silence the act() warnings emitted by some libraries during render.
// (Reanimated mock, SafeAreaProvider initial layout in some cases.)
const _origError = console.error;
console.error = (...args) => {
  const first = args[0];
  if (typeof first === 'string' && first.includes('not wrapped in act(')) return;
  _origError(...args);
};
