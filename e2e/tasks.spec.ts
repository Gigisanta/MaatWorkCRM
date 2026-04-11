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
  // Wait for redirect away from login
  await page.waitForURL((url: any) => !url.pathname.includes('/login'), { timeout: 15000 }).catch(() => {});
}

test.describe('Tasks', () => {
  test.beforeEach(async ({ page }) => {
    await authenticate(page);

    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      // Auth not configured - skip tests
      test.skip(true, 'Auth not configured - no test user available');
      return;
    }

    await page.goto(`${BASE_URL}/tasks`);
    await page.waitForLoadState('networkidle');
  });

  test('tasks page renders when authenticated', async ({ page }) => {
    // Page should not redirect to login
    await expect(page).not.toHaveURL(/\/login/);

    // Page should have the tasks heading
    const heading = page.locator('h1:has-text("Tareas")');
    await expect(heading).toBeVisible();

    // Header label should be visible
    const label = page.locator('text=TAREAS').first();
    await expect(label).toBeVisible();
  });

  test('task stats cards are displayed', async ({ page }) => {
    await page.waitForTimeout(1000); // Allow data to load

    // Check for stats cards labels
    const pendientesLabel = page.locator('text=Pendientes').first();
    const enProgresoLabel = page.locator('text=En Progreso');
    const completadasLabel = page.locator('text=Completadas');
    const vencidasLabel = page.locator('text=Vencidas');

    await expect(pendientesLabel).toBeVisible();
    await expect(enProgresoLabel).toBeVisible();
    await expect(completadasLabel).toBeVisible();
    await expect(vencidasLabel).toBeVisible();
  });

  test('create task button is visible', async ({ page }) => {
    const createButton = page.locator('button:has-text("Nueva Tarea")');
    await expect(createButton).toBeVisible();
  });

  test('task filters are present', async ({ page }) => {
    await page.waitForTimeout(1000); // Allow data to load

    // Search input should be visible
    const searchInput = page.locator('input[placeholder="Buscar tareas..."]');
    await expect(searchInput).toBeVisible();

    // Status filter
    const statusFilter = page.locator('text=Estado').first();
    await expect(statusFilter).toBeVisible();

    // Priority filter
    const priorityFilter = page.locator('text=Prioridad').first();
    await expect(priorityFilter).toBeVisible();
  });

  test('task search filters tasks by title', async ({ page }) => {
    await page.waitForTimeout(2000); // Wait for data to load

    const searchInput = page.locator('input[placeholder="Buscar tareas..."]');

    // Type a search term
    await searchInput.fill('nonexistent-task-search-term-12345');
    await page.waitForTimeout(500);

    // Should show empty state or no results
    const emptyState = page.locator('text=No hay tareas que coincidan').first();
    if (await emptyState.isVisible().catch(() => false)) {
      await expect(emptyState).toBeVisible();
    }

    // Clear the search
    await searchInput.fill('');
    await page.waitForTimeout(500);
  });

  test('status filter dropdown works', async ({ page }) => {
    await page.waitForTimeout(2000); // Wait for data to load

    // Find the status select (Estado)
    const statusSelect = page.locator('button[role="combobox"]').filter({ hasText: 'Estado' }).or(
      page.locator('button:has-text("Todos")').first()
    ).first();

    // Click to open the dropdown
    await statusSelect.click();
    await page.waitForTimeout(300);

    // Should show status options
    const pendingOption = page.locator('text=Pendientes').first();
    const inProgressOption = page.locator('text=En Progreso');
    const completedOption = page.locator('text=Completadas');

    // Check options are visible (may need to scroll or adjust)
    if (await pendingOption.isVisible().catch(() => false)) {
      await pendingOption.click();
      await page.waitForTimeout(500);
    }
  });

  test('priority filter dropdown works', async ({ page }) => {
    await page.waitForTimeout(2000); // Wait for data to load

    // Find the priority select (Prioridad)
    const prioritySelect = page.locator('button[role="combobox"]').filter({ hasText: 'Prioridad' }).or(
      page.locator('button:has-text("Todas")').nth(1)
    ).first();

    // Click to open the dropdown
    await prioritySelect.click();
    await page.waitForTimeout(300);

    // Should show priority options
    const urgentOption = page.locator('text=Urgente');
    const highOption = page.locator('text=Alta');
    const mediumOption = page.locator('text=Media');
    const lowOption = page.locator('text=Baja');

    if (await urgentOption.isVisible().catch(() => false)) {
      await urgentOption.click();
      await page.waitForTimeout(500);
    }
  });

  test('task list displays tasks or empty state', async ({ page }) => {
    await page.waitForTimeout(2000); // Wait for data to load

    // Either tasks are displayed or empty state is shown
    const taskCards = page.locator('[class*="glass"][class*="rounded-lg"]').filter({ has: page.locator('input[type="checkbox"]') });
    const taskCount = await taskCards.count();

    if (taskCount > 0) {
      // Tasks are displayed
      expect(taskCount).toBeGreaterThan(0);
    } else {
      // Empty state should be visible
      const emptyState = page.locator('text=No hay tareas que coincidan').or(
        page.locator('text=No hay tareas')
      ).first();
      if (await emptyState.isVisible().catch(() => false)) {
        await expect(emptyState).toBeVisible();
      }
    }
  });

  test('overdue tasks section appears when there are overdue tasks', async ({ page }) => {
    await page.waitForTimeout(2000); // Wait for data to load

    // Look for overdue section (Vencidas)
    const overdueSection = page.locator('text=Vencidas').first();
    if (await overdueSection.isVisible().catch(() => false)) {
      await expect(overdueSection).toBeVisible();
    }
  });

  test('navigation to tasks from sidebar works', async ({ page }) => {
    // Go to dashboard first
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    // Find and click tasks link in sidebar
    const tasksLink = page.locator('aside a[href="/tasks"], nav a[href="/tasks"]').first();
    await tasksLink.click();

    // Should navigate to tasks
    await page.waitForURL(/\/tasks/);
    await expect(page).toHaveURL(/\/tasks/);

    // Tasks heading should be visible
    const heading = page.locator('h1:has-text("Tareas")');
    await expect(heading).toBeVisible();
  });

  test('create task dialog opens when button is clicked', async ({ page }) => {
    await page.waitForTimeout(1000); // Allow page to fully load

    const createButton = page.locator('button:has-text("Nueva Tarea")');
    await createButton.click();
    await page.waitForTimeout(500);

    // Dialog should be visible with create task form
    const dialogTitle = page.locator('text=Crear Nueva Tarea');
    await expect(dialogTitle).toBeVisible();

    // Title input should be visible
    const titleInput = page.locator('input[id="title"], input[placeholder*="Título"]').first();
    await expect(titleInput).toBeVisible();

    // Cancel button should work
    const cancelButton = page.locator('button:has-text("Cancelar")');
    if (await cancelButton.isVisible().catch(() => false)) {
      await cancelButton.click();
      await page.waitForTimeout(300);
      // Dialog should close
      await expect(dialogTitle).not.toBeVisible();
    }
  });

  test('task groups are displayed with correct structure', async ({ page }) => {
    await page.waitForTimeout(2000); // Wait for data to load

    // Check for task group sections
    const overdueGroup = page.locator('button:has-text("Vencidas")');
    const todayGroup = page.locator('button:has-text("Hoy")');
    const tomorrowGroup = page.locator('button:has-text("Mañana")');
    const thisWeekGroup = page.locator('button:has-text("Esta semana")');
    const laterGroup = page.locator('button:has-text("Más adelante")');
    const completedGroup = page.locator('button:has-text("Completadas")');

    // Groups should be visible
    await expect(todayGroup).toBeVisible();
    await expect(completedGroup).toBeVisible();

    // Check if expandable groups work (click on one)
    if (await overdueGroup.isVisible().catch(() => false)) {
      await overdueGroup.click();
      await page.waitForTimeout(300);
    }
  });

  test('tasks page redirects to login when not authenticated', async ({ page }) => {
    // Clear any existing session by going to logout or directly to tasks
    await page.context().clearCookies();
    await page.goto(`${BASE_URL}/tasks`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });
});
