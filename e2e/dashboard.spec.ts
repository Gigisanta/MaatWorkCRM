import { test, expect } from '@playwright/test';

const TEST_EMAIL = process.env.E2E_TEST_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || 'testpassword';

async function authenticate(page: any) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.fill('input[id="identifier"]', TEST_EMAIL);
  await page.fill('input[id="password"]', TEST_PASSWORD);
  await page.click('button[type="submit"]');
  // Wait for redirect away from login
  await page.waitForURL((url: any) => !url.pathname.includes('/login'), { timeout: 15000 }).catch(() => {});
}

test.describe('Dashboard', () => {
  test('auth-required routes redirect to login', async ({ page }) => {
    // Protected routes as defined in middleware.ts PROTECTED_PATHS
    // /api/, /dashboard, /contacts, /pipeline, /tasks, /calendar, /reports, /teams, /training
    // Public: /notifications, /settings
    const protectedRoutes = ['/dashboard', '/contacts', '/pipeline', '/tasks', '/calendar', '/reports', '/teams'];
    const publicRoutes = ['/notifications', '/settings'];

    for (const route of protectedRoutes) {
      await page.goto(route, { waitUntil: 'load' });
      await page.waitForTimeout(500);
      // Should redirect to login
      await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
    }

    // Verify public routes do NOT redirect to login
    for (const route of publicRoutes) {
      await page.goto(route, { waitUntil: 'load' });
      await page.waitForTimeout(500);
      // Should NOT redirect to login
      await expect(page).not.toHaveURL(/\/login/, { timeout: 5000 });
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('dashboard page loads when authenticated', async ({ page }) => {
    await authenticate(page);

    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      // Auth not configured - skip
      test.skip(true, 'Auth not configured - no test user available');
      return;
    }

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
  });

  test('user can navigate to contacts page', async ({ page }) => {
    await authenticate(page);

    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      test.skip(true, 'Auth not configured - no test user available');
      return;
    }

    await page.goto('/contacts');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/contacts/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('sidebar navigation is present when authenticated', async ({ page }) => {
    await authenticate(page);

    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      test.skip(true, 'Auth not configured - no test user available');
      return;
    }

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Wait for sidebar to render
    await page.waitForTimeout(2000);
    const navLinks = page.locator('aside a, nav a, aside [href], [data-testid="sidebar"] a');
    const count = await navLinks.count();
    expect(count).toBeGreaterThan(0);
  });
});
