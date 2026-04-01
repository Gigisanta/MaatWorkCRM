const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  try {
    // Test registration
    console.log('=== Testing Registration ===');
    await page.goto('https://crm.maat.work/register');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const regText = await page.locator('body').innerText();
    console.log('Register page:', regText.slice(0, 400));

    // Fill form
    await page.fill('input[placeholder*="Nombre"], input[id*="name"], input[id*="full"]', 'Test Admin');
    await page.waitForTimeout(500);

    // Find email input
    const emailInput = page.locator('input[type="email"], input[id*="email"]').first();
    await emailInput.fill('testadmin@maat.work');
    await page.waitForTimeout(500);

    // Select role - find the combobox
    const roleSelect = page.locator('select, [role="combobox"], [aria-haspopup="listbox"]').first();
    const roleExists = await roleSelect.count() > 0;
    console.log('Role select exists:', roleExists);

    if (roleExists) {
      // For Dueño (owner) role
      await roleSelect.selectOption({ label: /dueño/i }).catch(() => {
        // Try by value
        return roleSelect.selectOption('owner').catch(() => {});
      });
    }

    await page.waitForTimeout(500);

    // Find password fields
    const passwordInputs = page.locator('input[type="password"]');
    const count = await passwordInputs.count();
    console.log('Password fields:', count);

    if (count >= 1) {
      await passwordInputs.nth(0).fill('Test123456!');
    }
    if (count >= 2) {
      await passwordInputs.nth(1).fill('Test123456!');
    }

    await page.waitForTimeout(500);

    // Submit
    const submitBtn = page.locator('button[type="submit"], button:has-text("Crear")').first();
    await submitBtn.click();
    await page.waitForTimeout(3000);

    const resultUrl = page.url();
    const resultText = await page.locator('body').innerText();
    console.log('After submit URL:', resultUrl);
    console.log('After submit text:', resultText.slice(0, 500));

    // Check console errors
    console.log('Console errors:', errors);

  } catch (error) {
    console.error('Error:', error.message);
  }

  await browser.close();
}

main().catch(console.error);
