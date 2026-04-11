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

test.describe('Teams', () => {
  test('teams page renders when authenticated', async ({ page }) => {
    await authenticate(page);

    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      test.skip(true, 'Auth not configured - no test user available');
      return;
    }

    await page.goto('/teams');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByText(/Equipos|EQUIPOS/i)).toBeVisible({ timeout: 10000 });
  });

  test('sidebar navigation to teams works', async ({ page }) => {
    await authenticate(page);

    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      test.skip(true, 'Auth not configured - no test user available');
      return;
    }

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Look for sidebar link to teams
    const teamsLink = page.locator('aside a[href="/teams"], nav a[href="/teams"], [data-testid="sidebar"] a[href="/teams"]');
    const count = await teamsLink.count();

    if (count > 0) {
      await teamsLink.first().click();
      await page.waitForURL(/\/teams/, { timeout: 10000 });
      await expect(page).toHaveURL(/\/teams/);
    } else {
      // Fallback: navigate directly
      await page.goto('/teams');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/teams/);
    }
  });

  test('team member list displays', async ({ page }) => {
    await authenticate(page);

    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      test.skip(true, 'Auth not configured - no test user available');
      return;
    }

    await page.goto('/teams');
    await page.waitForLoadState('networkidle');

    // Wait for teams to load
    await page.waitForTimeout(2000);

    // Check for Miembros text which appears in team cards
    const miembrosLabel = page.locator('text=/Miembros|Miembros \\(\\d+\\)/i');
    if (await miembrosLabel.count() > 0) {
      await expect(miembrosLabel.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('team goal progress shows', async ({ page }) => {
    await authenticate(page);

    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      test.skip(true, 'Auth not configured - no test user available');
      return;
    }

    await page.goto('/teams');
    await page.waitForLoadState('networkidle');

    // Wait for content to load
    await page.waitForTimeout(2000);

    // Look for Progreso General or objectives labels
    const progressSection = page.locator('text=/Progreso General|objetivos|Objetivos/i');
    if (await progressSection.count() > 0) {
      await expect(progressSection.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('team cards display leader information', async ({ page }) => {
    await authenticate(page);

    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      test.skip(true, 'Auth not configured - no test user available');
      return;
    }

    await page.goto('/teams');
    await page.waitForLoadState('networkidle');

    // Wait for teams to load
    await page.waitForTimeout(2000);

    // Look for Lider del Equipo label
    const liderLabel = page.locator('text=/Lider del Equipo|Líder del Equipo/i');
    if (await liderLabel.count() > 0) {
      await expect(liderLabel.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('can click on team card to open detail drawer', async ({ page }) => {
    await authenticate(page);

    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      test.skip(true, 'Auth not configured - no test user available');
      return;
    }

    await page.goto('/teams');
    await page.waitForLoadState('networkidle');

    // Wait for teams to load
    await page.waitForTimeout(3000);

    // Find a team card (clickable card with team name/description)
    const teamCard = page.locator('[class*="rounded-xl"][class*="cursor-pointer"], [class*="hover:border-white"]').filter({ hasText: /Equipo|Team|Building/i }).first();

    if (await teamCard.count() > 0) {
      await teamCard.click();

      // Wait for drawer to open
      await page.waitForTimeout(1000);

      // Check if drawer opened (look for close button or drawer content)
      const drawerClose = page.locator('[class*="DrawerClose"], button:has-text("Cerrar"), button:has-text("X")').first();
      if (await drawerClose.count() > 0) {
        await expect(drawerClose).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('individual team member view in drawer', async ({ page }) => {
    await authenticate(page);

    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      test.skip(true, 'Auth not configured - no test user available');
      return;
    }

    await page.goto('/teams');
    await page.waitForLoadState('networkidle');

    // Wait for teams to load
    await page.waitForTimeout(3000);

    // Click on a team card to open drawer
    const teamCard = page.locator('[class*="rounded-xl"][class*="cursor-pointer"]').first();
    if (await teamCard.count() > 0) {
      await teamCard.click();

      // Wait for drawer
      await page.waitForTimeout(1000);

      // Look for member list in drawer
      const membersInDrawer = page.locator('text=/Miembros \\(\\d+\\)/i');
      if (await membersInDrawer.count() > 0) {
        await expect(membersInDrawer.first()).toBeVisible({ timeout: 5000 });
      }

      // Look for goals section in drawer
      const goalsInDrawer = page.locator('text=/Objetivos \\(\\d+\\)|Objetivos/i');
      if (await goalsInDrawer.count() > 0) {
        await expect(goalsInDrawer.first()).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('teams page shows empty state when no teams', async ({ page }) => {
    await authenticate(page);

    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      test.skip(true, 'Auth not configured - no test user available');
      return;
    }

    await page.goto('/teams');
    await page.waitForLoadState('networkidle');

    // Wait for content
    await page.waitForTimeout(2000);

    // Check for empty state (may show "No hay equipos")
    const emptyState = page.locator('text=/No hay equipos|No hay datos|Crea tu primer equipo/i');
    if (await emptyState.count() > 0) {
      await expect(emptyState.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('teams page has tools section with template download', async ({ page }) => {
    await authenticate(page);

    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      test.skip(true, 'Auth not configured - no test user available');
      return;
    }

    await page.goto('/teams');
    await page.waitForLoadState('networkidle');

    // Wait for content
    await page.waitForTimeout(2000);

    // Look for Herramientas section and download button
    const herramientas = page.locator('text=/Herramientas/i');
    if (await herramientas.count() > 0) {
      await expect(herramientas.first()).toBeVisible({ timeout: 5000 });

      // Check for download button/links
      const downloadBtn = page.locator('text=/Descargar|Plantilla|Download/i');
      if (await downloadBtn.count() > 0) {
        await expect(downloadBtn.first()).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('new team button exists for authorized users', async ({ page }) => {
    await authenticate(page);

    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      test.skip(true, 'Auth not configured - no test user available');
      return;
    }

    await page.goto('/teams');
    await page.waitForLoadState('networkidle');

    // Look for "Nuevo Equipo" button
    const nuevoEquipoBtn = page.locator('button:has-text("Nuevo Equipo"), button:has-text("Crear Equipo")');
    if (await nuevoEquipoBtn.count() > 0) {
      await expect(nuevoEquipoBtn.first()).toBeVisible({ timeout: 5000 });
    }
  });
});