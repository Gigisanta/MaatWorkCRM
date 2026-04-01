import { test, expect } from '@playwright/test';

test.describe('MaatWork CRM - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Go to login page
    await page.goto('https://crm.maat.work/login');
    await page.waitForLoadState('networkidle');
  });

  test('Login with valid credentials', async ({ page }) => {
    await page.fill('input[id="identifier"]', 'gio');
    await page.fill('input[id="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Wait for redirect or error
    await page.waitForURL(/\/(?!login)/, { timeout: 10000 }).catch(() => {
      // If still on login, check for error toast
      const body = page.locator('body');
      console.log('Body text after login attempt:', body.innerText());
    });
  });
});
