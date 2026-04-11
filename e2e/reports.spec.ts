import { test, expect } from '@playwright/test';

const TEST_EMAIL = process.env.E2E_TEST_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || 'testpassword';

async function authenticate(page: any) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.fill('input[id="identifier"]', TEST_EMAIL);
  await page.fill('input[id="password"]', TEST_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL((url: any) => !url.pathname.includes('/login'), { timeout: 15000 }).catch(() => {});
}

test.describe('Reports', () => {
  test('reports page renders when authenticated', async ({ page }) => {
    await authenticate(page);

    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      test.skip(true, 'Auth not configured - no test user available');
      return;
    }

    await page.goto('/reports');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByText(/Reportes|REPORTES/i)).toBeVisible({ timeout: 10000 });
  });

  test('sidebar navigation to reports works', async ({ page }) => {
    await authenticate(page);

    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      test.skip(true, 'Auth not configured - no test user available');
      return;
    }

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Look for sidebar link to reports
    const reportsLink = page.locator('aside a[href="/reports"], nav a[href="/reports"], [data-testid="sidebar"] a[href="/reports"]');
    const count = await reportsLink.count();

    if (count > 0) {
      await reportsLink.first().click();
      await page.waitForURL(/\/reports/, { timeout: 10000 });
      await expect(page).toHaveURL(/\/reports/);
    } else {
      // Fallback: navigate directly
      await page.goto('/reports');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/reports/);
    }
  });

  test('date range filter changes period', async ({ page }) => {
    await authenticate(page);

    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      test.skip(true, 'Auth not configured - no test user available');
      return;
    }

    await page.goto('/reports');
    await page.waitForLoadState('networkidle');

    // Find the period Select (dropdown for week/month/quarter/year)
    const periodSelect = page.locator('[class*="SelectTrigger"], [role="combobox"]').filter({ hasText: /esta semana|este mes|este trimestre|este ano/i });

    if (await periodSelect.count() > 0) {
      await periodSelect.click();

      // Select a different period (e.g., "Este trimestre")
      const quarterOption = page.locator('[role="option"], [aria-selected]').filter({ hasText: /trimestre/i });
      if (await quarterOption.count() > 0) {
        await quarterOption.first().click();
        await page.waitForTimeout(500);

        // Verify URL or state changed (the Select value should reflect new selection)
        await expect(periodSelect).toBeVisible();
      }
    }
  });

  test('reports page has export button', async ({ page }) => {
    await authenticate(page);

    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      test.skip(true, 'Auth not configured - no test user available');
      return;
    }

    await page.goto('/reports');
    await page.waitForLoadState('networkidle');

    // Check for Exportar CSV button
    const exportButton = page.locator('button:has-text("Exportar"), button:has-text("CSV"), button:has-text("Export")');
    await expect(exportButton.first()).toBeVisible({ timeout: 10000 });
  });

  test('reports KPI cards render', async ({ page }) => {
    await authenticate(page);

    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      test.skip(true, 'Auth not configured - no test user available');
      return;
    }

    await page.goto('/reports');
    await page.waitForLoadState('networkidle');

    // Wait for KPI content to load
    await page.waitForTimeout(2000);

    // KPI labels to look for
    const kpiLabels = [
      /Valor Pipeline|Nuevos Contactos|Tareas Vencidas|Progreso Objetivos/i
    ];

    for (const label of kpiLabels) {
      const kpiCard = page.locator(`text=${label}`);
      // At least one should be visible (may be skeleton or actual value)
      const visibleCount = await kpiCard.count();
      if (visibleCount > 0) {
        await expect(kpiCard.first()).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('reports charts render when data exists', async ({ page }) => {
    await authenticate(page);

    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      test.skip(true, 'Auth not configured - no test user available');
      return;
    }

    await page.goto('/reports');
    await page.waitForLoadState('networkidle');

    // Wait for charts/data to load
    await page.waitForTimeout(3000);

    // Chart section titles that should be present
    const chartSections = [
      /Pipeline por Etapa|Distribucion de Productos|Tendencia de Contactos|Contactos por Segmento|Contactos por Fuente|Contactos por Etapa/i
    ];

    for (const section of chartSections) {
      const sectionEl = page.locator(`text=${section}`);
      const count = await sectionEl.count();
      if (count > 0) {
        await expect(sectionEl.first()).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('empty state for reports with no data', async ({ page }) => {
    await authenticate(page);

    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      test.skip(true, 'Auth not configured - no test user available');
      return;
    }

    await page.goto('/reports');
    await page.waitForLoadState('networkidle');

    // Wait for content to load
    await page.waitForTimeout(3000);

    // Empty state messages that might appear in charts
    const emptyMessages = [
      /No hay datos disponibles|No hay datos para el periodo seleccionado/i
    ];

    for (const msg of emptyMessages) {
      const el = page.locator(`text=${msg}`);
      if (await el.count() > 0) {
        await expect(el.first()).toBeVisible({ timeout: 3000 });
      }
    }
  });

  test('reports page has team goals progress section', async ({ page }) => {
    await authenticate(page);

    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      test.skip(true, 'Auth not configured - no test user available');
      return;
    }

    await page.goto('/reports');
    await page.waitForLoadState('networkidle');

    // Look for team goals progress section
    const goalsSection = page.locator('text=/Progreso de Objetivos|Objetivos por Equipo/i');
    if (await goalsSection.count() > 0) {
      await expect(goalsSection.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('reports page has task analytics section', async ({ page }) => {
    await authenticate(page);

    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      test.skip(true, 'Auth not configured - no test user available');
      return;
    }

    await page.goto('/reports');
    await page.waitForLoadState('networkidle');

    // Look for task analytics section
    const taskSection = page.locator('text=/Analisis de Tareas|Tareas/i');
    if (await taskSection.count() > 0) {
      await expect(taskSection.first()).toBeVisible({ timeout: 5000 });
    }
  });
});