import { defineConfig, devices } from '@playwright/test';

// All CI behaviour is switched on by the CI variable (set automatically by GitHub Actions).
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true, // shards split individual tests, not whole files
  forbidOnly: isCI, // a forgotten test.only fails the CI run
  retries: isCI ? 2 : 0, // an unstable test is marked flaky instead of red
  workers: isCI ? 2 : undefined, // GitHub runners have 2-4 vCPUs
  reporter: isCI
    ? [
        ['list'],
        ['blob'], // per-shard output, merged by merge.config.ts
        ['junit', { outputFile: 'reports/junit.xml' }],
      ]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.BASE_URL ?? 'https://practicesoftwaretesting.com',
    testIdAttribute: 'data-test',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
