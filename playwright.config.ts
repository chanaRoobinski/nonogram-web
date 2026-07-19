import { defineConfig, devices } from '@playwright/test'

// Overridable so a machine with another local project already on 5173 (Vite's usual silent
// fallback to 5174/5175/etc would otherwise desync this config from what's actually running).
const port = process.env.E2E_PORT ?? '5173'
const baseURL = `http://localhost:${port}`

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run dev -- --port ${port} --strictPort`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
})
