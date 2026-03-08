// ============================================================
// MaatWork CRM — E2E: Contacts & Tasks
// ============================================================

import { expect, test } from "@playwright/test";

test.describe("Contacts Page", () => {
  test("contacts list renders", async ({ page }) => {
    await page.goto("/contacts");
    await expect(page.getByText("Contacts Directory")).toBeVisible();
    await expect(page.getByText("María López")).toBeVisible();
    await expect(page.getByText("Juan Martínez")).toBeVisible();
  });

  test("search input works", async ({ page }) => {
    await page.goto("/contacts");
    const searchInput = page.getByPlaceholder("Search by name, email or company...");
    await searchInput.fill("María");
    await expect(page.getByText("María López")).toBeVisible();
    await expect(page.getByText("Juan Martínez")).not.toBeVisible();
  });

  test("status filter pills are clickable", async ({ page }) => {
    await page.goto("/contacts");
    await page.getByRole("button", { name: "Active", exact: true }).click();
    await expect(page.getByText("María López")).toBeVisible();
  });

  test("new contact button is visible", async ({ page }) => {
    await page.goto("/contacts");
    await expect(page.getByText("New Contact")).toBeVisible();
  });
});

test.describe("Tasks Page", () => {
  test("tasks list renders", async ({ page }) => {
    await page.goto("/tasks");
    await expect(page.getByText("Task Management")).toBeVisible();
    await expect(page.getByText(/Llamar a María López/)).toBeVisible();
  });

  test("task filters work", async ({ page }) => {
    await page.goto("/tasks");
    await page.getByRole("button", { name: "In Progress", exact: true }).dispatchEvent("click");
    await expect(page.getByText(/Preparar propuesta para Juan Martínez/)).toBeVisible();
  });

  test("priority badges are visible", async ({ page }) => {
    await page.goto("/tasks");
    await expect(page.getByText("High").first()).toBeVisible();
    await expect(page.getByText("Medium").first()).toBeVisible();
  });
});
