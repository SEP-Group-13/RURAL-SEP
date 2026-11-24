/**
*           npm run lint      
*           npm run lint:fix(also rewrites files for rules that can auto-fix)
*/

import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'


export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**', 
      '**/dist/**', 
      '**/build/**',
      '**/.react-router/**', 
      'shared/api/generated/**',
      'api/openapi/**',
      'csv_data/**',
      'db/**', 
      'public/**',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  // warn will not fail, error will.
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      
      // SEP metric: module size, SLOC <= 400
      'max-lines': ['error', { max: 400, skipBlankLines: true, skipComments: true }],
      // SEP metric: max cyclomatic complexity per method <= 20
      complexity: ['error', 20],

      // Not graded but sensible.
      'max-depth': ['warn', 4],
      'max-params': ['warn', 4],
      'max-lines-per-function': ['warn', { max: 80, skipBlankLines: true, skipComments: true }],
      // Allow unused function parameters if they start with an underscore.
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // Allow an empty {} as a function parameter
      'no-empty-pattern': ['error', { allowObjectPatternsAsParameters: true }],
    },
  },

  {
    files: ['client/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },

  {
    files: ['server/**/*.ts', '**/*.config.ts'],
    languageOptions: { globals: globals.node },
  },

  {
    files: ['**/*.test.{ts,tsx}'],
    rules: {
      'max-lines-per-function': 'off',
      'max-lines': 'off',
    },
  },
)