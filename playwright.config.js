const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({ 
  testDir: './tests',
  fullyParallel: true,
  workers: '50%',
  retries: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  timeout: 60000,
  use: {
    trace: 'on',
    video: 'off',
    screenshot: 'on',
  },
});
