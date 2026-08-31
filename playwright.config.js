const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  workers: process.env.CI ? 2 : '50%',
  retries: 1,
  reporter: [
    ['list'],
    ['json', { outputFile: 'results.json' }],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['allure-playwright', {
      outputFolder: 'allure-results',
      detail: true,
      suiteTitle: true,
      environmentInfo: {
        Environment: 'Production',
        Platform: process.platform,
      },
    }],
    ...(process.env.CI ? [['blob']] : [])
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
