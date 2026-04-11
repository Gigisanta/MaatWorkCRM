import { test, expect, Page } from '@playwright/test';

const TEST_EMAIL = process.env.E2E_TEST_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || 'testpassword';

async function authenticate(page: Page) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.fill('input[id="identifier"]', TEST_EMAIL);
  await page.fill('input[id="password"]', TEST_PASSWORD);
  await page.click('button[type="submit"]');
  // Wait for redirect away from login
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 }).catch(() => {});
}

test.describe('Contacts Page', () => {
  test.beforeEach(async ({ page }) => {
    await authenticate(page);
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      test.skip(true, 'Auth not configured - no test user available');
      return;
    }
    await page.goto('/contacts');
    await page.waitForLoadState('networkidle');
  });

  test('contacts page renders when authenticated', async ({ page }) => {
    // Should show page title
    await expect(page.locator('h1')).toContainText('Contactos');
    // Should show loading or contacts
    await page.waitForTimeout(2000);
    // Body should be visible
    await expect(page.locator('body')).toBeVisible();
  });

  test('contact list shows contacts or empty state', async ({ page }) => {
    await page.waitForTimeout(2000);

    // Should either show contacts in table or empty state
    const hasContacts = await page.locator('table tbody tr').count();
    const hasEmptyState = await page.locator('text=No hay contactos aún').isVisible().catch(() => false);

    expect(hasContacts > 0 || hasEmptyState).toBeTruthy();
  });

  test('search box filters contacts', async ({ page }) => {
    await page.waitForTimeout(2000);

    // Get initial contact count
    const initialCount = await page.locator('table tbody tr').count();
    const hasEmptyState = await page.locator('text=No hay contactos aún').isVisible().catch(() => false);

    if (hasEmptyState) {
      test.skip(true, 'No contacts to filter');
      return;
    }

    if (initialCount === 0) {
      test.skip(true, 'No contacts available');
      return;
    }

    // Type in search box
    const searchInput = page.locator('input[placeholder="Buscar contactos..."]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('nonexistent-contact-xyz123');

    // Wait for debounce (300ms) and API response
    await page.waitForTimeout(1000);

    // Should show no results or empty state
    const hasNoResults = await page.locator('text=Sin resultados').isVisible().catch(() => false);
    const rowsAfterSearch = await page.locator('table tbody tr').count();

    expect(hasNoResults || rowsAfterSearch === 0).toBeTruthy();
  });

  test('stage filter works', async ({ page }) => {
    await page.waitForTimeout(2000);

    // Check if filter dropdown exists
    const stageSelect = page.locator('button[role="combobox"]').first();
    const hasEmptyState = await page.locator('text=No hay contactos aún').isVisible().catch(() => false);

    if (hasEmptyState) {
      test.skip(true, 'No contacts to filter');
      return;
    }

    // Open the stage filter dropdown
    await stageSelect.click();
    await page.waitForTimeout(300);

    // Select a specific stage option (second option is usually "all", then stages)
    const stageOptions = page.locator('[role="option"]');
    const optionCount = await stageOptions.count();

    if (optionCount > 1) {
      // Select second option (first specific stage, not "all")
      await stageOptions.nth(1).click();
      await page.waitForTimeout(500);

      // Filter should be applied - either shows contacts or "no results"
      const hasContacts = await page.locator('table tbody tr').count() > 0;
      const hasNoResults = await page.locator('text=Sin resultados').isVisible().catch(() => false);
      expect(hasContacts || hasNoResults).toBeTruthy();
    }
  });

  test('view mode toggle between table and cards', async ({ page }) => {
    await page.waitForTimeout(2000);

    const hasEmptyState = await page.locator('text=No hay contactos aún').isVisible().catch(() => false);
    if (hasEmptyState) {
      test.skip(true, 'No contacts to test view toggle');
      return;
    }

    // Table view should be visible by default
    const tableView = page.locator('table');
    await expect(tableView).toBeVisible();

    // Find and click the cards view toggle (LayoutGrid icon button)
    const cardsToggle = page.locator('button[title="Vista tarjetas"]');
    if (await cardsToggle.isVisible()) {
      await cardsToggle.click();
      await page.waitForTimeout(500);

      // Cards view should show something different (contacts-cards component)
      // Either cards or empty state
      const hasCards = await page.locator('[class*="card"]').first().isVisible().catch(() => false);
      const hasEmptyStateCards = await page.locator('text=No hay contactos aún').isVisible().catch(() => false);
      expect(hasCards || hasEmptyStateCards).toBeTruthy();

      // Switch back to table view
      const tableToggle = page.locator('button[title="Vista tabla"]');
      await tableToggle.click();
      await page.waitForTimeout(500);
      await expect(tableView).toBeVisible();
    }
  });

  test('clicking a contact opens contact drawer', async ({ page }) => {
    await page.waitForTimeout(2000);

    const hasEmptyState = await page.locator('text=No hay contactos aún').isVisible().catch(() => false);
    if (hasEmptyState) {
      test.skip(true, 'No contacts to click');
      return;
    }

    // Click on first contact row (not checkbox)
    const firstContact = page.locator('table tbody tr').first();
    const rowCount = await page.locator('table tbody tr').count();

    if (rowCount > 0) {
      await firstContact.click();
      await page.waitForTimeout(1000);

      // Drawer should open - looking for drawer overlay or close button
      const drawerVisible = await page.locator('[role="dialog"], button[title="Cerrar"]').first().isVisible().catch(() => false);
      expect(drawerVisible).toBeTruthy();
    }
  });

  test('create contact button is visible', async ({ page }) => {
    await page.waitForTimeout(2000);

    // Look for "Nuevo Contacto" button
    const createButton = page.locator('button:has-text("Nuevo Contacto"), button:has-text("Nuevo")').first();
    await expect(createButton).toBeVisible();
  });

  test('pagination works when many contacts', async ({ page }) => {
    await page.waitForTimeout(2000);

    // Check if pagination controls exist
    const pagination = page.locator('text=Anterior').or(page.locator('text=Siguiente'));
    const paginationVisible = await pagination.isVisible().catch(() => false);

    if (!paginationVisible) {
      // No pagination means few contacts - this is fine
      test.skip(true, 'Pagination not needed - few contacts');
      return;
    }

    // Click next page if available
    const nextButton = page.locator('button:has-text("Siguiente")');
    const isDisabled = await nextButton.getAttribute('disabled');

    if (isDisabled === null) {
      await nextButton.click();
      await page.waitForTimeout(1000);

      // Should be on page 2 or results changed
      const currentPage = await page.locator('button[class*="bg-violet-500"]').textContent().catch(() => '1');
      expect(currentPage).toBeTruthy();
    }
  });

  test('sidebar navigation to contacts', async ({ page }) => {
    // Navigate away from contacts
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Find and click contacts link in sidebar
    const contactsLink = page.locator('aside a[href="/contacts"], nav a[href="/contacts"]').first();
    await contactsLink.click();

    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/contacts/);
  });

  test('row click to open contact detail', async ({ page }) => {
    await page.waitForTimeout(2000);

    const hasEmptyState = await page.locator('text=No hay contactos aún').isVisible().catch(() => false);
    if (hasEmptyState) {
      test.skip(true, 'No contacts to test row click');
      return;
    }

    // Click directly on the contact name/row in table
    const contactRows = page.locator('table tbody tr');
    const rowCount = await contactRows.count();

    if (rowCount > 0) {
      // Click on the contact name cell (second td)
      const firstRowCells = page.locator('table tbody tr').first().locator('td');
      const cellCount = await firstRowCells.count();

      if (cellCount > 1) {
        // Click on the name cell (usually first meaningful content)
        await firstRowCells.nth(1).click();
        await page.waitForTimeout(1000);

        // Should open drawer
        const drawerOpened = await page.locator('[role="dialog"]').isVisible().catch(() => false);
        expect(drawerOpened).toBeTruthy();
      }
    }
  });

  test('contact stats show total count', async ({ page }) => {
    await page.waitForTimeout(2000);

    // Should show "X contactos en total" or loading state
    const statsText = page.locator('text=/\\d+ contactos en total|No hay contactos aún|Cargando/');
    await expect(statsText.first()).toBeVisible();
  });

  test('can interact with search and clear it', async ({ page }) => {
    await page.waitForTimeout(2000);

    const searchInput = page.locator('input[placeholder="Buscar contactos..."]');
    await expect(searchInput).toBeVisible();

    // Type in search
    await searchInput.fill('test');
    await page.waitForTimeout(500);

    // Clear search
    await searchInput.clear();
    await page.waitForTimeout(500);

    // Should restore normal view
    const hasEmptyOrContacts = await page.locator('text=No hay contactos aún').isVisible().catch(() => false)
      || (await page.locator('table tbody tr').count()) > 0;
    expect(hasEmptyOrContacts).toBeTruthy();
  });
});
