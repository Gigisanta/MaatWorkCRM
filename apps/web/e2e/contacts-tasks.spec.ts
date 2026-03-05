// ============================================================
// MaatWork CRM — E2E: Contacts & Tasks
// ============================================================

import { test, expect } from "@playwright/test";

test.describe("Contacts Page", () => {
  test("contacts list renders", async ({ page }) => {
    await page.goto("/contacts");
    await expect(page.getByText("Contactos")).toBeVisible();
    await expect(page.getByText("María López")).toBeVisible();
    await expect(page.getByText("Juan Martínez")).toBeVisible();
  });

  test("search input works", async ({ page }) => {
    await page.goto("/contacts");
    const searchInput = page.getByPlaceholder("Buscar por nombre o email...");
    await searchInput.fill("María");
    await expect(page.getByText("María López")).toBeVisible();
    await expect(page.getByText("Juan Martínez")).not.toBeVisible();
  });

  test("status filter pills are clickable", async ({ page }) => {
    await page.goto("/contacts");
    await page.getByText("Activo", { exact: true }).click();
    await expect(page.getByText("María López")).toBeVisible();
  });

  test("new contact button is visible", async ({ page }) => {
    await page.goto("/contacts");
    await expect(page.getByText("Nuevo Contacto")).toBeVisible();
  });
});

test.describe("Tasks Page", () => {
  test("tasks list renders", async ({ page }) => {
    await page.goto("/tasks");
    await expect(page.getByText("Tareas")).toBeVisible();
    await expect(page.getByText(/Llamar a María López/)).toBeVisible();
  });

  test("task filters work", async ({ page }) => {
    await page.goto("/tasks");
    await page.getByText("Completada", { exact: true }).click();
    await expect(page.getByText(/Revisar documentación/)).toBeVisible();
  });

  test("priority badges are visible", async ({ page }) => {
    await page.goto("/tasks");
    await expect(page.getByText("Alta")).toBeVisible();
    await expect(page.getByText("Media")).toBeVisible();
  });
});
