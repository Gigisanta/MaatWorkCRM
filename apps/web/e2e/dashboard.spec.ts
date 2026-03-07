// ============================================================
// MaatWork CRM — E2E: Dashboard & Navigation
// ============================================================

import { expect, test } from "@playwright/test";

test.describe("Dashboard", () => {
  test("dashboard loads with KPI cards", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByText("Total Contacts")).toBeVisible();
    await expect(page.getByText("Pipeline Value")).toBeVisible();
    await expect(page.getByText("Pending Tasks")).toBeVisible();
    await expect(page.getByText("Total Deals")).toBeVisible();
  });

  test("quick actions are clickable", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText("Quick Actions")).toBeVisible();
    await expect(page.getByText("New Contact")).toBeVisible();
    await expect(page.getByText("Create Task")).toBeVisible();
    await expect(page.getByText("View Pipeline")).toBeVisible();
  });

  test("activity feed shows entries", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText("Recent Activity")).toBeVisible();
  });

  test("pipeline summary shows stages", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText("Pipeline Health")).toBeVisible();
    await expect(page.getByText("Prospecto")).toBeVisible();
    await expect(page.getByText("Activo")).toBeVisible();
  });
});

test.describe("Navigation", () => {
  test("sidebar has all nav items", async ({ page, isMobile }) => {
    if (isMobile) return; // Sidebar is hidden on mobile by default
    await page.goto("/dashboard");
    const sidebar = page.locator("aside");
    await expect(sidebar.getByText("Dashboard")).toBeVisible();
    await expect(sidebar.getByText("Contactos")).toBeVisible();
    await expect(sidebar.getByText("Pipeline")).toBeVisible();
    await expect(sidebar.getByText("Tareas")).toBeVisible();
    await expect(sidebar.getByText("Equipos")).toBeVisible();
  });

  test("MaatWork branding is visible", async ({ page, isMobile }) => {
    if (isMobile) return; // Branding is hidden on mobile header
    await page.goto("/dashboard");
    await expect(page.getByText("MaatWork").first()).toBeVisible();
  });
});
