const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  workers: process.env.CI ? 2 : '50%',
  retries: 1,
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
    ['json', { outputFile: 'results.json' }]
  ],
  timeout: 120000,
  expect: {
    timeout: 30000
  },
  use: {
    trace: 'on',
    video: 'retain-on-failure',
    screenshot: 'on',
    actionTimeout: 40000,
    navigationTimeout: 60000,
  },
});
