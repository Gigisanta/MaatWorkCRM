// ============================================================
// MaatWork CRM — E2E: Auth Flow
// ============================================================

import { expect, test } from "@playwright/test";

test.describe("Auth Flow", () => {
  test("login page renders correctly", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("Welcome back")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
    await expect(page.getByText("Continue with Google")).toBeVisible();
    await expect(page.getByPlaceholder("name@company.com")).toBeVisible();
    await expect(page.getByPlaceholder("••••••••")).toBeVisible();
  });

  test("login form has email and password fields", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    const emailInput = page.getByPlaceholder("name@company.com");
    const passwordInput = page.getByPlaceholder("••••••••");

    await emailInput.fill("admin@maatwork.com");
    await passwordInput.fill("SecurePassword123");

    await expect(emailInput).toHaveValue("admin@maatwork.com");
    await expect(passwordInput).toHaveValue("SecurePassword123");
  });

  test("password visibility toggle works", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    const passwordInput = page.getByPlaceholder("••••••••");
    await expect(passwordInput).toHaveAttribute("type", "password");

    // Click eye icon to show password
    const toggleBtn = page.getByTestId("password-toggle");
    await toggleBtn.click();
    await expect(passwordInput).toHaveAttribute("type", "text");
  });

  test("register link is present", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("Request access")).toBeVisible();
  });
});
