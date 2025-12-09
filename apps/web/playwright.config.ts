import { defineConfig, devices } from '@playwright/test'

// Base URL defaults to localhost:3001 (Docker maps 3001->3000), override with BASE_URL env
const baseURL = process.env.BASE_URL || 'http://localhost:3001'
const videoSetting = process.env.PLAYWRIGHT_VIDEO === 'on' ? 'on' : 'retain-on-failure'

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL,
    headless: true,
    trace: 'retry-with-trace',
    video: videoSetting as any,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
