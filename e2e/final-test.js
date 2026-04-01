const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    // Login
    await page.goto('https://crm.maat.work/login', { waitUntil: 'networkidle' });
    await page.fill('#identifier', 'gio');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('After login URL:', page.url());
    const afterLoginText = await page.locator('body').innerText();
    console.log('After login text:', afterLoginText.slice(0, 200));

    // Test: Full page reload of dashboard
    console.log('\n=== DASHBOARD (full reload after login) ===');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    const dashText = await page.locator('body').innerText();
    console.log('Dashboard after reload:', dashText.slice(0, 300));

    // Test: Check if sidebar shows user name
    const sidebarInfo = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasDashboard: text.includes('Dashboard') || text.includes('dashboard'),
        hasContactos: text.includes('Contactos') || text.includes('contacto'),
        hasLoading: text.includes('Cargando'),
        hasKPIs: text.includes('Contactos Activos') || text.includes('Tareas Pendientes'),
        hasGiovanni: text.includes('Giovanni') || text.includes('gio'),
      };
    });
    console.log('\nDashboard state:', sidebarInfo);

    // Take screenshot
    await page.screenshot({ path: '/tmp/dash-reload.png' });
    console.log('Screenshot: /tmp/dash-reload.png');

  } catch (e) {
    console.error('Error:', e.message);
  }

  await browser.close();
}

main().catch(console.error);
