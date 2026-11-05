import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';

export default defineConfig([
  { ignores: ['dist/**', 'node_modules/**', 'playwright-report/**', 'test-results/**'] },
  {
    files: ['**/*.{js,jsx,mjs}'],
    extends: [js.configs.recommended],
    rules: {
      'no-unused-vars': ['error', { args: 'all', caughtErrors: 'all' }],
      'no-nested-ternary': 'error',
      'prefer-const': 'error',
    },
  },
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      'no-restricted-syntax': ['error', {
        selector: "JSXAttribute[name.name='style']",
        message: 'Keep presentation in the component CSS file.',
      }],
    },
  },
  {
    files: ['*.config.js', 'scripts/**/*.mjs', 'tests/unit/**/*.js'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['tests/browser/**/*.js'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
]);
