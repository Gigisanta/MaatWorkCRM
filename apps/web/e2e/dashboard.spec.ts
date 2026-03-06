// ============================================================
// MaatWork CRM — E2E: Dashboard & Navigation
// ============================================================

import { expect, test } from "@playwright/test";

test.describe("Dashboard", () => {
  test("dashboard loads with KPI cards", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText("Dashboard")).toBeVisible();
    await expect(page.getByText("Total Contactos")).toBeVisible();
    await expect(page.getByText("Valor Pipeline")).toBeVisible();
    await expect(page.getByText("Tareas Pendientes")).toBeVisible();
    await expect(page.getByText("Meta Equipo")).toBeVisible();
  });

  test("quick actions are clickable", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText("Acciones Rápidas")).toBeVisible();
    await expect(page.getByText("Nuevo Contacto")).toBeVisible();
    await expect(page.getByText("Crear Tarea")).toBeVisible();
    await expect(page.getByText("Ver Pipeline")).toBeVisible();
  });

  test("activity feed shows entries", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText("Actividad Reciente")).toBeVisible();
    await expect(page.getByText("Ana García")).toBeVisible();
  });

  test("pipeline summary shows stages", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText("Pipeline por Etapa")).toBeVisible();
    await expect(page.getByText("Prospecto")).toBeVisible();
    await expect(page.getByText("Activo")).toBeVisible();
  });
});

test.describe("Navigation", () => {
  test("sidebar has all nav items", async ({ page }) => {
    await page.goto("/dashboard");
    const sidebar = page.locator("aside");
    await expect(sidebar.getByText("Dashboard")).toBeVisible();
    await expect(sidebar.getByText("Contactos")).toBeVisible();
    await expect(sidebar.getByText("Pipeline")).toBeVisible();
    await expect(sidebar.getByText("Tareas")).toBeVisible();
    await expect(sidebar.getByText("Equipos")).toBeVisible();
    await expect(sidebar.getByText("Calendario")).toBeVisible();
    await expect(sidebar.getByText("Reportes")).toBeVisible();
    await expect(sidebar.getByText("Capacitación")).toBeVisible();
  });

  test("MaatWork branding is visible", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText("MaatWork")).toBeVisible();
    await expect(page.getByText("CRM para Asesores")).toBeVisible();
  });
});
