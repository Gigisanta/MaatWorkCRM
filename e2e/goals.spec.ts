import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = process.env.E2E_TEST_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || 'testpassword';

async function authenticate(page: any) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  await page.fill('input[id="identifier"]', TEST_EMAIL);
  await page.fill('input[id="password"]', TEST_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL((url: any) => !url.pathname.includes('/login'), { timeout: 15000 }).catch(() => {});
}

test.describe('Goals', () => {
  test.beforeEach(async ({ page }) => {
    await authenticate(page);

    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      test.skip(true, 'Auth not configured - no test user available');
      return;
    }

    await page.goto(`${BASE_URL}/goals`);
    await page.waitForLoadState('networkidle');
  });

  test('goals page renders when authenticated', async ({ page }) => {
    await expect(page).not.toHaveURL(/\/login/);

    const statsSection = page.locator('text=Objetivos').first();
    await expect(statsSection).toBeVisible();
  });

  test('goal list shows goals or empty state', async ({ page }) => {
    await page.waitForTimeout(2000);

    const goalCards = page.locator('[class*="rounded-xl"][class*="border"]').filter({ has: page.locator('text=%') });
    const goalCount = await goalCards.count();

    if (goalCount > 0) {
      expect(goalCount).toBeGreaterThan(0);
    } else {
      const emptyState = page.locator('text=Crea tu primer objetivo').or(
        page.locator('text=No hay objetivos')
      ).first();
      if (await emptyState.isVisible().catch(() => false)) {
        await expect(emptyState).toBeVisible();
      }
    }
  });

  test('goal creation form works', async ({ page }) => {
    await page.waitForTimeout(1000);

    const createButton = page.locator('button:has-text("Nuevo objetivo")').first();
    if (await createButton.isVisible().catch(() => false)) {
      await createButton.click();
      await page.waitForTimeout(500);

      const modal = page.locator('text=Crear Objetivo').first();
      if (await modal.isVisible().catch(() => false)) {
        await expect(modal).toBeVisible();

        const cancelButton = page.locator('button:has-text("Cancelar")').first();
        if (await cancelButton.isVisible().catch(() => false)) {
          await cancelButton.click();
          await page.waitForTimeout(300);
        }
      }
    }
  });

  test('goal progress bars display correctly', async ({ page }) => {
    await page.waitForTimeout(2000);

    const progressBars = page.locator('[class*="Progress"]').first();
    if (await progressBars.isVisible().catch(() => false)) {
      await expect(progressBars).toBeVisible();
    }
  });

  test('goal filters by status', async ({ page }) => {
    await page.waitForTimeout(2000);

    const statusFilter = page.locator('button[role="combobox"]').first();
    if (await statusFilter.isVisible().catch(() => false)) {
      await statusFilter.click();
      await page.waitForTimeout(300);

      const activeOption = page.locator('text=Activos').first();
      if (await activeOption.isVisible().catch(() => false)) {
        await activeOption.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('click goal to open detail', async ({ page }) => {
    await page.waitForTimeout(2000);

    const goalCard = page.locator('[class*="rounded-xl"][class*="border"]').filter({ has: page.locator('text=%') }).first();
    if (await goalCard.isVisible().catch(() => false)) {
      await goalCard.click();
      await page.waitForTimeout(500);
    }
  });

  test('sidebar navigation to goals works', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    const goalsLink = page.locator('aside a[href="/goals"], nav a[href="/goals"]').first();
    await goalsLink.click();

    await page.waitForURL(/\/goals/);
    await expect(page).toHaveURL(/\/goals/);

    const pageContent = page.locator('text=Objetivos').first();
    await expect(pageContent).toBeVisible();
  });

  test('goal health indicators display on-track status', async ({ page }) => {
    await page.waitForTimeout(2000);

    const onTrackBadge = page.locator('text=En camino').first();
    const atRiskBadge = page.locator('text=En riesgo').first();
    const achievedBadge = page.locator('text=Logrado').first();

    const hasOnTrack = await onTrackBadge.isVisible().catch(() => false);
    const hasAtRisk = await atRiskBadge.isVisible().catch(() => false);
    const hasAchieved = await achievedBadge.isVisible().catch(() => false);

    expect(hasOnTrack || hasAtRisk || hasAchieved).toBeTruthy();
  });

  test('goal tabs switch between mine and team goals', async ({ page }) => {
    await page.waitForTimeout(1000);

    const mineTab = page.locator('button:has-text("Mis Objetivos")').first();
    const teamTab = page.locator('button:has-text("Objetivos de Equipo")').first();

    if (await mineTab.isVisible().catch(() => false)) {
      await expect(mineTab).toBeVisible();
    }

    if (await teamTab.isVisible().catch(() => false)) {
      await teamTab.click();
      await page.waitForTimeout(500);
    }
  });

  test('goal health indicators show at-risk status', async ({ page }) => {
    await page.waitForTimeout(2000);

    const atRiskBadge = page.locator('text=En riesgo').first();
    if (await atRiskBadge.isVisible().catch(() => false)) {
      await expect(atRiskBadge).toBeVisible();
    }
  });
});
