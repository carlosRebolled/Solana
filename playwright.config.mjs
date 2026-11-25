// Pruebas del sitio estático `site/` con Playwright: npm run test:site
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: 'tests/e2e',
    timeout: 30_000,
    fullyParallel: true,
    reporter: [['list']],
    use: { baseURL: 'http://127.0.0.1:8875', trace: 'off' },
    webServer: { command: 'node scripts/serve-site.mjs 8875', url: 'http://127.0.0.1:8875', reuseExistingServer: true },
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
});
