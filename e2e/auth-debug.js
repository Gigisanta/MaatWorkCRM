const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const networkErrors = [];
  page.on('response', async res => {
    if (res.status() >= 400) {
      networkErrors.push(`${res.status()} ${res.url()}`);
    }
  });

  try {
    // Login
    console.log('=== LOGIN ===');
    await page.goto('https://crm.maat.work/login', { waitUntil: 'networkidle' });
    await page.fill('#identifier', 'gio');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(4000);
    console.log('URL after login:', page.url());

    // Check cookies
    const cookies = await context.cookies(['https://crm.maat.work']);
    const sessionToken = cookies.find(c => c.name === 'session_token');
    console.log('session_token cookie:', sessionToken ? `present (${sessionToken.value.slice(0,8)}...)` : 'MISSING');

    // Navigate to dashboard
    console.log('\n=== DASHBOARD ===');
    await page.goto('https://crm.maat.work/dashboard', { waitUntil: 'networkidle' });

    // Wait a bit for React to hydrate and auth to resolve
    await page.waitForTimeout(3000);

    // Check what's visible
    const bodyText = await page.locator('body').innerText();
    const visibleElements = await page.evaluate(() => {
      // Find all visible text content
      const els = document.querySelectorAll('[class*="animate"]');
      const text = Array.from(els).map(el => el.textContent?.trim()).filter(Boolean);
      return { animatingElements: els.length, texts: text.slice(0, 5) };
    });

    console.log('Body text:', bodyText.slice(0, 300));
    console.log('Animating elements:', visibleElements);

    // Try to get the auth state from the page
    const authState = await page.evaluate(async () => {
      // Try to call auth session API manually
      const res = await fetch('/api/auth/session', { credentials: 'include' });
      const data = await res.json();
      return { status: res.status, data };
    });
    console.log('\nManual /api/auth/session call:', JSON.stringify(authState));

    // Check network errors
    console.log('\nNetwork errors:', networkErrors);

    // Check the page title
    const title = await page.title();
    console.log('Page title:', title);

    // Check if the auth loading element is visible
    const authSkeleton = await page.locator('text=Cargando dashboard').count();
    console.log('Auth skeleton visible:', authSkeleton > 0 ? 'YES' : 'NO');

    // Check what's inside the main element
    const mainContent = await page.locator('#main-content').innerText().catch(() => 'N/A');
    console.log('Main content:', mainContent.slice(0, 200));

    // Check cookies in page context
    const pageCookies = await page.evaluate(() => {
      return {
        all: document.cookie,
        hasSession: document.cookie.includes('session'),
      };
    });
    console.log('\nPage cookies:', pageCookies);

  } catch (e) {
    console.error('Error:', e.message);
  }

  await browser.close();
}

main().catch(console.error);
