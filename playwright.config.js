const { defineConfig } = require('@playwright/test');
const path = require('path');
module.exports = defineConfig({ 
  testDir: './tests',
  fullyParallel: true,
  workers: '50%',
  retries: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  timeout: 60000,
  use: {
    trace: 'off',
    video: 'off',
    screenshot: 'on',
  },
});
