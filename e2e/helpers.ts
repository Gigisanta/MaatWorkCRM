import { test as base, Page } from '@playwright/test';

const TEST_EMAIL = process.env.E2E_TEST_EMAIL || '';
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || '';

export const baseURL = process.env.BASE_URL || 'http://localhost:3000';

/**
 * Authenticates a Playwright page by filling in the login form.
 * Requires E2E_TEST_EMAIL and E2E_TEST_PASSWORD env vars.
 */
export async function authenticate(page: Page): Promise<void> {
  if (!TEST_EMAIL || !TEST_PASSWORD) {
    // Can't authenticate - test should use test.skip() if auth is needed
    return;
  }
  await page.goto(`${baseURL}/login`);
  await page.waitForLoadState('networkidle');
  await page.fill('input[name="identifier"], input[placeholder*="USUARIO"], input[type="text"]', TEST_EMAIL);
  await page.fill('input[type="password"]', TEST_PASSWORD);
  await page.click('button[type="submit"], button:has-text("Ingresar")');
  // Wait for redirect or session to be established
  await page.waitForLoadState('networkidle');
}

// Extend base test with our custom fixtures
export const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ page }, use) => {
    await authenticate(page);
    await use(page);
  },
});

export { expect } from '@playwright/test';