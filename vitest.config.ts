/**
 *  npm test             run every test once for CI
 *  npm run test:watch   run tests while changing files.
 *  npx vitest --project server   run specific project tests
 *
 *  Tests live next to the file they test, named *.test.ts or *.test.tsx
 */

import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    passWithNoTests: true, // remove when tests exist, needed for now.

    projects: [
      {
        resolve: { tsconfigPaths: true },
        test: {
          name: 'server',
          root: './server',
          include: ['src/**/*.test.ts'],
          environment: 'node',
        },
      },
      {
        resolve: { tsconfigPaths: true },
        test: {
          name: 'client',
          root: './client',
          include: ['app/**/*.test.{ts,tsx}'],
          environment: 'jsdom',
        },
      },
    ],
  },
})
