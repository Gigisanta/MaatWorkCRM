// ============================================================
// MaatWork CRM — E2E: Pipeline Kanban Board
// ============================================================

import { test, expect } from "@playwright/test";

test.describe("Pipeline Kanban", () => {
  test("pipeline page loads with stages", async ({ page }) => {
    await page.goto("/pipeline");
    await expect(page.getByText("Pipeline")).toBeVisible();
    await expect(page.getByText("Prospecto")).toBeVisible();
    await expect(page.getByText("Contactado")).toBeVisible();
    await expect(page.getByText("Reunión")).toBeVisible();
    await expect(page.getByText("Propuesta")).toBeVisible();
    await expect(page.getByText("Activo")).toBeVisible();
  });

  test("shows deal cards with values", async ({ page }) => {
    await page.goto("/pipeline");
    await expect(page.getByText("Plan integral María López")).toBeVisible();
    await expect(page.getByText("Plan corporativo Sánchez")).toBeVisible();
  });

  test("shows total pipeline value", async ({ page }) => {
    await page.goto("/pipeline");
    await expect(page.getByText(/Valor total/)).toBeVisible();
  });

  test("new deal button is visible", async ({ page }) => {
    await page.goto("/pipeline");
    await expect(page.getByText("Nuevo Deal")).toBeVisible();
  });
});
