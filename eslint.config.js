const expo = require('eslint-config-expo/flat');

module.exports = [
  ...expo,
  {
    ignores: [
      '.expo/**',
      'node_modules/**',
      'dist/**',
      '_unused/**',
      // Skill / agent reference docs - not application source
      '.agents/**',
      '.claude/**',
      '.superpowers/**',
    ],
  },
  {
    files: ['jest.setup.js', '**/__tests__/**', '**/*.test.*'],
    languageOptions: {
      globals: {
        jest: 'readonly',
        expect: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
  },
  {
    rules: {
      'import/order': 'off',
      'import/no-unresolved': 'off',
      'import/namespace': 'off',
      'import/no-duplicates': 'off',
    },
  },
];
