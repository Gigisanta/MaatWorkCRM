const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    // Login
    console.log('=== LOGIN ===');
    await page.goto('https://crm.maat.work/login', { waitUntil: 'networkidle' });
    await page.fill('#identifier', 'gio');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('URL after login:', page.url());

    // Check cookies
    const cookies = await context.cookies();
    console.log('All cookies:', cookies.map(c => `${c.name}=${c.value.slice(0, 15)}...`));

    // Navigate to dashboard
    console.log('\n=== DASHBOARD ===');
    await page.goto('https://crm.maat.work/dashboard', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);

    // Check auth context via page eval
    const debug = await page.evaluate(async () => {
      // Check auth session API
      const sessionRes = await fetch('/api/auth/session', { credentials: 'include' });
      const sessionData = await sessionRes.json();

      // Check dashboard stats API
      const statsRes = await fetch('/api/dashboard/stats?organizationId=org_maatwork_demo', { credentials: 'include' });
      const statsData = await statsRes.json();

      return {
        session: sessionData,
        stats: statsData,
        statsStatus: statsRes.status,
        cookies: document.cookie.slice(0, 200),
      };
    });
    console.log('\nSession API response:', JSON.stringify(debug.session, null, 2));
    console.log('\nDashboard stats:', JSON.stringify(debug.stats));
    console.log('\nStats HTTP status:', debug.statsStatus);
    console.log('\nCookies in page:', debug.cookies);

    // Get full body text
    const bodyText = await page.locator('body').innerText();
    console.log('\nBody text:', bodyText.slice(0, 500));

  } catch (e) {
    console.error('Error:', e.message);
  }

  await browser.close();
}

main().catch(console.error);
