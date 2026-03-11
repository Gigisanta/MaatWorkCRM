import { expect, test } from "@playwright/test";

test.describe("🔐 Authentication Flow", () => {
  test("login page loads correctly", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("Welcome back")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
  });

  test("password visibility toggle works", async ({ page }) => {
    await page.goto("/login");
    const passwordInput = page.getByPlaceholder("•••••");
    await expect(passwordInput).toHaveAttribute("type", "password");
    await page.getByTestId("password-toggle").click();
    await expect(passwordInput).toHaveAttribute("type", "text");
  });

  test("shows error with invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("name@company.com").fill("invalid@test.com");
    await page.getByPlaceholder("•••••").fill("wrongpassword");
    await page.getByRole("button", { name: "Sign In" }).click();
    await expect(page.getByText(/invalid|not found|failed/i)).toBeVisible({ timeout: 10000 });
  });
});

test.describe("📝 Registration Flow", () => {
  test("register page loads correctly", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByText("Create your account")).toBeVisible();
  });
});

test.describe("🛡️ Protected Routes", () => {
  test("dashboard requires authentication", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/login/);
  });

  test("contacts requires authentication", async ({ page }) => {
    await page.goto("/contacts");
    await expect(page).toHaveURL(/login/);
  });
});
