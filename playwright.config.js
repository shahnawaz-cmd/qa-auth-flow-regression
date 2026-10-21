const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  workers: process.env.CI ? 1 : '50%',
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
  timeout: 150000,
  expect: {
    timeout: 30000
  },
  use: {
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 30000,
    navigationTimeout: 60000,
  },
});
