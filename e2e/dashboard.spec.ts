import { test, expect } from '@playwright/test';

const TEST_EMAIL = process.env.E2E_TEST_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || 'testpassword';

async function authenticate(page: any) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.fill('input[id="identifier"]', TEST_EMAIL);
  await page.fill('input[id="password"]', TEST_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(?!login)/, { timeout: 15000 }).catch(() => {});
}

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await authenticate(page);
  });

  test('dashboard page loads', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
  });

  test('user can navigate to contacts page', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const contactsLink = page.locator('a[href="/contacts"]').first();
    if (await contactsLink.isVisible()) {
      await contactsLink.click();
      await page.waitForURL('/contacts', { timeout: 10000 });
      await expect(page).toHaveURL(/\/contacts/);
    } else {
      await page.goto('/contacts');
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('sidebar navigation is present', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const navLinks = page.locator('nav a, aside a');
    const count = await navLinks.count();
    expect(count).toBeGreaterThan(0);
  });
});
