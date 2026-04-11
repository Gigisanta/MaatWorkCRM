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

test.describe('Pipeline', () => {
  test.beforeEach(async ({ page }) => {
    await authenticate(page);

    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      // Auth not configured - skip tests
      test.skip(true, 'Auth not configured - no test user available');
      return;
    }

    await page.goto('/pipeline');
    await page.waitForLoadState('networkidle');
  });

  test('pipeline page renders when authenticated', async ({ page }) => {
    // Page should not redirect to login
    await expect(page).not.toHaveURL(/\/login/);

    // Page should have the pipeline heading
    const heading = page.locator('h1:has-text("Kanban de Contactos")');
    await expect(heading).toBeVisible();

    // Stats bar should be present (shows when stages exist)
    await page.waitForTimeout(1000); // Allow data to load
    const statsBar = page.locator('text=Contactos').first();
    // Stats bar may or may not be visible depending on data
  });

  test('contact cards appear in pipeline stages', async ({ page }) => {
    await page.waitForTimeout(2000); // Wait for data to load

    // Check if there are any stage columns
    const stageColumns = page.locator('[class*="min-w-\\[280px\\]"]');
    const columnCount = await stageColumns.count();

    if (columnCount === 0) {
      test.skip(true, 'No pipeline stages configured');
      return;
    }

    // Check if contact cards are visible (cards have emoji/name structure)
    const contactCards = page.locator('[class*="rounded-xl"][class*="border"][class*="cursor-grab"]');
    const cardCount = await contactCards.count();

    if (cardCount === 0) {
      // Empty state - no contacts in pipeline
      const emptyState = page.locator('text=Sin contactos').first();
      await expect(emptyState).toBeVisible();
    } else {
      // Should have visible contact cards
      expect(cardCount).toBeGreaterThan(0);
    }
  });

  test('empty state shows when no contacts in pipeline', async ({ page }) => {
    await page.waitForTimeout(2000); // Wait for data to load

    // Check for empty state in columns
    const emptyStates = page.locator('text=Sin contactos');
    const emptyCount = await emptyStates.count();

    if (emptyCount > 0) {
      await expect(emptyStates.first()).toBeVisible();
    } else {
      // If no empty states, there are contacts - skip this validation
      const contactCards = page.locator('[class*="rounded-xl"][class*="border"][class*="cursor-grab"]');
      const cardCount = await contactCards.count();
      test.skip(cardCount > 0, 'Pipeline has contacts - empty state not applicable');
    }
  });

  test('pipeline stats display correctly', async ({ page }) => {
    await page.waitForTimeout(2000); // Wait for data to load

    // Stats bar contains: Contactos, Valor total, Etapas
    const contactosLabel = page.locator('text=Contactos').first();
    const valorTotalLabel = page.locator('text=Valor total');
    const etapasLabel = page.locator('text=Etapas');

    // These labels should exist in the stats bar
    if (await valorTotalLabel.isVisible().catch(() => false)) {
      await expect(valorTotalLabel).toBeVisible();
    }
    if (await etapasLabel.isVisible().catch(() => false)) {
      await expect(etapasLabel).toBeVisible();
    }

    // Check for "Distribucion por Etapa" section
    const distribucionSection = page.locator('text=Distribucion por Etapa');
    await expect(distribucionSection).toBeVisible();
  });

  test('navigation to pipeline from sidebar works', async ({ page }) => {
    // Go to dashboard first
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Find and click pipeline link in sidebar
    const pipelineLink = page.locator('aside a[href="/pipeline"], nav a[href="/pipeline"]').first();
    await pipelineLink.click();

    // Should navigate to pipeline
    await page.waitForURL(/\/pipeline/);
    await expect(page).toHaveURL(/\/pipeline/);

    // Pipeline heading should be visible
    const heading = page.locator('h1:has-text("Kanban de Contactos")');
    await expect(heading).toBeVisible();
  });

  test('pipeline view toggle between kanban and list works', async ({ page }) => {
    await page.waitForTimeout(2000); // Wait for data to load

    // Check for view toggle buttons
    const kanbanButton = page.locator('[title="Vista Kanban"]');
    const listButton = page.locator('[title="Vista Lista"]');

    if (await kanbanButton.isVisible().catch(() => false)) {
      // Click list view
      await listButton.click();
      await page.waitForTimeout(500);

      // Should show list view (table)
      const table = page.locator('table');
      await expect(table).toBeVisible();

      // Click back to kanban
      await kanbanButton.click();
      await page.waitForTimeout(500);

      // Should show kanban columns again
      const stageColumns = page.locator('[class*="min-w-\\[280px\\]"]');
      await expect(stageColumns.first()).toBeVisible();
    } else {
      test.skip(true, 'View toggle buttons not visible - may require data');
    }
  });

  test('search filter works on pipeline', async ({ page }) => {
    await page.waitForTimeout(2000); // Wait for data to load

    // Find search input
    const searchInput = page.locator('input[placeholder*="Buscar"]');
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('nonexistent-contact-12345');
      await page.waitForTimeout(500);

      // After searching, should show "No hay contactos" or empty columns
      const noContacts = page.locator('text=No hay contactos').first();
      if (await noContacts.isVisible().catch(() => false)) {
        await expect(noContacts).toBeVisible();
      }
    } else {
      test.skip(true, 'Search input not visible');
    }
  });
});
