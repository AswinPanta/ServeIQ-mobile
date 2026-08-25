// Jest config for ServeIQ (Expo SDK 57, RN 0.86, Reanimated 4.5, RNGH 2.32).
// Run via `npx jest` or `npm test`. Requires:
//   npm i -D jest jest-expo @testing-library/react-native@^12 react-test-renderer
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.expo/',
    '/android/',
    '/ios/',
    '/dist/',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|nativewind|tailwind-merge|react-native-reanimated|react-native-gesture-handler|react-native-worklets))',
  ],
  resolver: 'react-native-worklets/jest/resolver.js',
  // Node 22 on macOS occasionally leaks open handles from the reanimated mock;
  // --forceExit is fine for a small test set.
  forceExit: true,
};
