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

    // Navigate to dashboard and monitor what happens
    console.log('\n=== NAVIGATING TO DASHBOARD ===');
    await page.goto('https://crm.maat.work/dashboard');
    await page.waitForTimeout(1000);

    // Take screenshot at t=1s
    await page.screenshot({ path: '/tmp/dash-t1.png' });

    const state1 = await page.evaluate(() => ({
      text: document.body.innerText.slice(0, 200),
      url: window.location.href
    }));
    console.log('At t=1s:', state1);

    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/dash-t3.png' });

    const state2 = await page.evaluate(() => ({
      text: document.body.innerText.slice(0, 200),
      // Check for any spinners/loaders
      spinners: Array.from(document.querySelectorAll('[class*="spinner"], [class*="loading"], [class*="skeleton"]')).map(el => el.className)
    }));
    console.log('At t=3s:', state2);

    await page.waitForTimeout(5000);
    await page.screenshot({ path: '/tmp/dash-t8.png' });

    const state3 = await page.evaluate(() => ({
      text: document.body.innerText.slice(0, 300),
    }));
    console.log('At t=8s:', state3);

    // Get ALL visible elements
    const allText = await page.evaluate(() => {
      const main = document.getElementById('main-content') || document.body;
      return main.innerText.slice(0, 500);
    });
    console.log('\nFull visible text:', allText);

    // Try to check what's in the DOM
    const domState = await page.evaluate(() => {
      const main = document.getElementById('main-content');
      const children = main ? Array.from(main.children).map(c => ({
        tag: c.tagName,
        class: c.className.slice(0, 50),
        text: c.innerText?.slice(0, 100)
      })) : [];
      return { childCount: main?.children.length, children };
    });
    console.log('\nDOM structure:', JSON.stringify(domState, null, 2));

  } catch (e) {
    console.error('Error:', e.message);
  }

  await browser.close();
}

main().catch(console.error);
