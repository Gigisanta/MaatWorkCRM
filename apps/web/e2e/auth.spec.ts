// ============================================================
// MaatWork CRM — E2E: Auth Flow
// ============================================================

import { expect, test } from "@playwright/test";

test.describe("Auth Flow", () => {
  test("login page renders correctly", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(page.getByText("MaatWork CRM")).toBeVisible();
    await expect(page.getByText("Iniciar Sesión")).toBeVisible();
    await expect(page.getByText("Continuar con Google")).toBeVisible();
    await expect(page.getByPlaceholder("tu@email.com")).toBeVisible();
    await expect(page.getByPlaceholder("••••••••")).toBeVisible();
  });

  test("login form has email and password fields", async ({ page }) => {
    await page.goto("/auth/login");
    const emailInput = page.getByPlaceholder("tu@email.com");
    const passwordInput = page.getByPlaceholder("••••••••");

    await emailInput.fill("admin@maatwork.com");
    await passwordInput.fill("SecurePassword123");

    await expect(emailInput).toHaveValue("admin@maatwork.com");
    await expect(passwordInput).toHaveValue("SecurePassword123");
  });

  test("password visibility toggle works", async ({ page }) => {
    await page.goto("/auth/login");
    const passwordInput = page.getByPlaceholder("••••••••");
    await expect(passwordInput).toHaveAttribute("type", "password");

    // Click eye icon to show password
    const toggleBtn = page
      .locator("button")
      .filter({ has: page.locator("svg") })
      .last();
    await toggleBtn.click();
    await expect(passwordInput).toHaveAttribute("type", "text");
  });

  test("register link is present", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(page.getByText("Regístrate")).toBeVisible();
  });
});
