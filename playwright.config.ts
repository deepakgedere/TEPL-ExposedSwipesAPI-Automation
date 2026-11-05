import type { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  testDir: './tests',
  timeout: 30 * 1000,
  workers: 1,
  expect: {
    timeout: 5000,
  },
  use: {
    actionTimeout: 0,
    navigationTimeout: 30 * 1000,
    headless: false,
    channel: 'msedge',
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    video: 'retain-on-failure',
  },
  reporter: [['list'], ['html', { outputFolder: 'playwright-report' }]],
};

export default config;
