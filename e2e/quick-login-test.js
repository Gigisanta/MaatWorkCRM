const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = [];

  // Capture console messages
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('CONSOLE ERROR:', msg.text());
    }
  });

  // Capture network requests
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      console.log('API REQUEST:', request.method(), request.url());
    }
  });
  page.on('response', response => {
    if (response.url().includes('/api/')) {
      console.log('API RESPONSE:', response.status(), response.url());
    }
  });

  try {
    // Test login
    console.log('\n=== Testing Login ===');
    await page.goto('https://crm.maat.work/login');
    await page.waitForLoadState('networkidle');

    await page.fill('#identifier', 'gio');
    await page.fill('#password', 'admin123');

    // Wait a bit for form fill
    await page.waitForTimeout(500);

    // Click submit
    await page.click('button[type="submit"]');

    // Wait for response
    await page.waitForTimeout(5000);

    const url = page.url();
    console.log('Current URL:', url);

    const bodyText = await page.locator('body').innerText();
    console.log('Body text (first 500):', bodyText.slice(0, 500));

    results.push({ page: 'login', url, success: !url.includes('login') });

    if (!url.includes('login')) {
      // Test Dashboard
      console.log('\n=== Testing Dashboard ===');
      await page.goto('https://crm.maat.work/dashboard');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      const dashUrl = page.url();
      const dashText = await page.locator('body').innerText();
      console.log('Dashboard URL:', dashUrl);
      console.log('Dashboard text (first 300):', dashText.slice(0, 300));
      results.push({ page: 'dashboard', url: dashUrl, success: true });

      // Test Contacts
      console.log('\n=== Testing Contacts ===');
      await page.goto('https://crm.maat.work/contacts');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      const contactsText = await page.locator('body').innerText();
      console.log('Contacts text (first 300):', contactsText.slice(0, 300));
      results.push({ page: 'contacts', url: page.url(), success: true });

      // Test Pipeline
      console.log('\n=== Testing Pipeline ===');
      await page.goto('https://crm.maat.work/pipeline');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      const pipelineText = await page.locator('body').innerText();
      console.log('Pipeline text (first 300):', pipelineText.slice(0, 300));
      results.push({ page: 'pipeline', url: page.url(), success: true });
    }

  } catch (error) {
    console.error('Error:', error.message);
    results.push({ page: 'error', error: error.message });
  }

  await browser.close();

  console.log('\n=== Summary ===');
  results.forEach(r => {
    console.log(`${r.page}: ${r.success ? 'PASS' : 'FAIL'} ${r.url || r.error || ''}`);
  });
}

main().catch(console.error);
