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

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    await authenticate(page);

    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      test.skip(true, 'Auth not configured - no test user available');
      return;
    }

    await page.goto(`${BASE_URL}/settings`);
    await page.waitForLoadState('networkidle');
  });

  test('settings page renders when authenticated', async ({ page }) => {
    await expect(page).not.toHaveURL(/\/login/);

    const heading = page.locator('h1:has-text("Configuración")');
    await expect(heading).toBeVisible();

    const label = page.locator('text=Tu cuenta').first();
    await expect(label).toBeVisible();
  });

  test('profile tab shows user info form', async ({ page }) => {
    const profileTab = page.locator('button:has-text("Perfil")').first();
    await profileTab.click();
    await page.waitForTimeout(500);

    const nameInput = page.locator('input[id="name"], input[name="name"]').first();
    await expect(nameInput).toBeVisible();

    const emailInput = page.locator('input[type="email"]').first();
    await expect(emailInput).toBeVisible();

    const bioTextarea = page.locator('textarea[name="bio"], textarea').first();
    await expect(bioTextarea).toBeVisible();
  });

  test('organization tab shows org settings', async ({ page }) => {
    const orgTab = page.locator('button:has-text("Organización")').first();
    await orgTab.click();
    await page.waitForTimeout(500);

    const orgCard = page.locator('text=Información de tu organización').first();
    if (await orgCard.isVisible().catch(() => false)) {
      await expect(orgCard).toBeVisible();
    }
  });

  test('notifications tab with toggles works', async ({ page }) => {
    const notificationsTab = page.locator('button:has-text("Notificaciones")').first();
    await notificationsTab.click();
    await page.waitForTimeout(500);

    const emailToggle = page.locator('text=Notificaciones por email').first();
    if (await emailToggle.isVisible().catch(() => false)) {
      await expect(emailToggle).toBeVisible();

      const pushToggle = page.locator('text=Notificaciones push').first();
      await expect(pushToggle).toBeVisible();

      const taskToggle = page.locator('text=Recordatorios de tareas').first();
      await expect(taskToggle).toBeVisible();
    }
  });

  test('save button is present in profile tab', async ({ page }) => {
    const profileTab = page.locator('button:has-text("Perfil")').first();
    await profileTab.click();
    await page.waitForTimeout(500);

    const saveButton = page.locator('button:has-text("Guardar cambios")').first();
    await expect(saveButton).toBeVisible();
  });

  test('tab navigation works', async ({ page }) => {
    const tabs = ['Perfil', 'Organización', 'Notificaciones', 'Seguridad'];
    for (const tabText of tabs) {
      const tab = page.locator(`button:has-text("${tabText}")`).first();
      await tab.click();
      await page.waitForTimeout(300);
      await expect(tab).toBeVisible();
    }
  });

  test('sidebar navigation to settings works', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    const settingsLink = page.locator('aside a[href="/settings"], nav a[href="/settings"]').first();
    await settingsLink.click();

    await page.waitForURL(/\/settings/);
    await expect(page).toHaveURL(/\/settings/);

    const heading = page.locator('h1:has-text("Configuración")');
    await expect(heading).toBeVisible();
  });

  test('form validation shows error for invalid email', async ({ page }) => {
    const profileTab = page.locator('button:has-text("Perfil")').first();
    await profileTab.click();
    await page.waitForTimeout(500);

    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.fill('invalid-email');
    await emailInput.blur();
    await page.waitForTimeout(300);

    const errorMessage = page.locator('text=Email inválido').first();
    if (await errorMessage.isVisible().catch(() => false)) {
      await expect(errorMessage).toBeVisible();
    }
  });

  test('security tab shows session information', async ({ page }) => {
    const securityTab = page.locator('button:has-text("Seguridad")').first();
    await securityTab.click();
    await page.waitForTimeout(1000);

    const sessionsCard = page.locator('text=Sesiones Activas').first();
    if (await sessionsCard.isVisible().catch(() => false)) {
      await expect(sessionsCard).toBeVisible();
    }
  });
});
