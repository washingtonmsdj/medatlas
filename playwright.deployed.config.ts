import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.MEDATLAS_DEPLOYED_URL

if (!baseURL) {
  throw new Error('MEDATLAS_DEPLOYED_URL is required')
}

export default defineConfig({
  testDir: './tests/deployed',
  timeout: 90_000,
  expect: {
    timeout: 25_000,
  },
  fullyParallel: false,
  retries: 1,
  reporter: [['list']],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
})
