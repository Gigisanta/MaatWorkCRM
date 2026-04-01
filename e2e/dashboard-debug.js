const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const networkLogs = [];
  page.on('request', req => {
    if (req.url().includes('/api/')) {
      networkLogs.push(`REQ: ${req.method()} ${req.url()}`);
    }
  });
  page.on('response', res => {
    if (res.url().includes('/api/')) {
      networkLogs.push(`RES: ${res.status()} ${res.url()}`);
    }
  });
  page.on('console', msg => {
    if (msg.type() === 'error') networkLogs.push(`ERR: ${msg.text()}`);
  });

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
    const sessionCookie = cookies.find(c => c.name.includes('session') || c.name.includes('auth'));
    console.log('Session cookies:', sessionCookie ? `${sessionCookie.name}=${sessionCookie.value.slice(0, 20)}...` : 'NONE');

    // Navigate to dashboard fresh
    console.log('\n=== DASHBOARD (fresh nav) ===');
    await page.goto('https://crm.maat.work/dashboard', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);

    const dashUrl = page.url();
    const dashText = await page.locator('body').innerText();
    console.log('URL:', dashUrl);
    console.log('Text (first 400):', dashText.slice(0, 400));

    // Check auth state via page eval
    const authState = await page.evaluate(() => {
      // Try to find auth context
      return {
        url: window.location.href,
        hasSessionCookie: document.cookie.includes('session'),
      };
    });
    console.log('Auth state:', authState);

    // Network logs
    console.log('\n=== Network logs (api only) ===');
    networkLogs.forEach(l => console.log(l));

  } catch (e) {
    console.error('Error:', e.message);
  }

  await browser.close();
}

main().catch(console.error);
