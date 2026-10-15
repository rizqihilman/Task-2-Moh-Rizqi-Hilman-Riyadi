// @ts-check
const { defineConfig } = require('@playwright/test');

/**
 * The public Petstore demo can be slow under load, so timeouts are generous.
 * Tests run sequentially (workers: 1) to avoid rate-limiting a shared API and
 * to keep generated test data predictable.
 */
module.exports = defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 1, // transient failures on a public demo API are retried once; the last attempt decides
  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/html-report', open: 'never' }],
    ['json', { outputFile: 'reports/results.json' }],
  ],
  use: {
    // Trailing slash matters: Playwright joins this with relative request paths
    // using URL semantics, so 'https://petstore.swagger.io/v2' + '/pet' would
    // drop the '/v2' segment. Specs use paths without a leading slash ('pet/...').
    baseURL: (process.env.PETSTORE_BASE_URL || 'https://petstore.swagger.io/v2').replace(/\/+$/, '') + '/',
    extraHTTPHeaders: { Accept: 'application/json' },
  },
});
