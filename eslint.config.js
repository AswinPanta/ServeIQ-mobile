const expo = require('eslint-config-expo/flat');

module.exports = [
  ...expo,
  {
    ignores: [
      '.expo/**',
      'node_modules/**',
      'dist/**',
      // Skill / agent reference docs - not application source
      '.agents/**',
      '.claude/**',
      '.superpowers/**',
    ],
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
