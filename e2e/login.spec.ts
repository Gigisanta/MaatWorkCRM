import { test, expect } from '@playwright/test';

const TEST_EMAIL = process.env.E2E_TEST_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || 'testpassword';

test.describe('Login', () => {
  test('shows login form with all required elements', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('input[id="identifier"]')).toBeVisible();
    await expect(page.locator('input[id="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('shows error on invalid login credentials', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.fill('input[id="identifier"]', 'nonexistent@example.com');
    await page.fill('input[id="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(2000);

    // Should stay on login page
    await expect(page).not.toHaveURL(/\/(?!login)/);
    await expect(page.locator('input[id="identifier"]')).toBeVisible();
  });

  test('logs in successfully with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.fill('input[id="identifier"]', TEST_EMAIL);
    await page.fill('input[id="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/(?!login)/, { timeout: 15000 }).catch(() => {
      console.log('Current URL after login attempt:', page.url());
    });

    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/login');
  });
});
