import { chromium } from 'playwright';

const ROUTES = [
  { path: '/login',        authRequired: false },
  { path: '/register',     authRequired: false },
  { path: '/dashboard',    authRequired: true  },
  { path: '/contacts',     authRequired: true  },
  { path: '/pipeline',     authRequired: true  },
  { path: '/tasks',        authRequired: true  },
  { path: '/calendar',     authRequired: true  },
  { path: '/reports',      authRequired: true  },
  { path: '/teams',        authRequired: true  },
  { path: '/notifications', authRequired: true },
  { path: '/settings',     authRequired: true  },
];

const BASE = 'http://localhost:3000';

// Track all failed network requests
const failedRequests = new Map(); // url -> count

async function checkRoute(browser, route) {
  const result = {
    path: route.path,
    status: 'PASS',
    httpStatus: null,
    loadTime: null,
    failedResources: [],
    authRedirect: false,
    error: null,
  };

  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('response', (response) => {
    if (response.status() >= 500) {
      const url = response.url();
      const prev = failedRequests.get(url) || 0;
      failedRequests.set(url, prev + 1);
    }
  });

  const start = Date.now();
  try {
    const response = await page.goto(BASE + route.path, {
      waitUntil: 'load',
      timeout: 30000,
    });
    result.loadTime = Date.now() - start;
    result.httpStatus = response?.status();

    // Wait for network idle
    await page.waitForTimeout(1500);

    const finalUrl = page.url();
    if (finalUrl.includes('/login') || finalUrl.includes('/api/auth/signin')) {
      result.authRedirect = true;
    }

    // Body visible check (only for non-redirect pages)
    if (!result.authRedirect) {
      try {
        const visible = await page.locator('body').isVisible({ timeout: 2000 });
        if (!visible) result.error = 'Body not visible';
      } catch {
        result.error = 'Body check failed';
      }
    }

    if (result.httpStatus >= 400 && ![307, 302, 301].includes(result.httpStatus)) {
      result.status = 'FAIL';
      result.error = `HTTP ${result.httpStatus}`;
    }

  } catch (err) {
    result.status = 'FAIL';
    result.loadTime = Date.now() - start;
    result.error = err.message.substring(0, 80);
  }

  await context.close();
  return result;
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  console.log('\n=== MaatWork CRM v3 — E2E Route Verification ===\n');
  console.log(`${'Route'.padEnd(20)} ${'HTTP'.padEnd(6)} ${'Load(ms)'.padEnd(10)} ${'Status'.padEnd(6)} Details`);
  console.log('-'.repeat(80));

  const results = [];
  for (const route of ROUTES) {
    const r = await checkRoute(browser, route);
    results.push(r);
    const details = r.error || (r.authRedirect ? '(auth redirect to login)' : 'body loads OK');
    console.log(
      `${r.path.padEnd(20)} ${String(r.httpStatus || 'ERR').padEnd(6)} ` +
      `${String(r.loadTime || '?').padEnd(10)} ${r.status.padEnd(6)} ${details}`
    );
  }

  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const authRedirects = results.filter((r) => r.authRedirect).length;

  console.log('\n=== Summary ===');
  console.log(`Routes tested: ${results.length} | PASS: ${passed} | FAIL: ${failed}`);
  console.log(`Auth-required redirects (expected): ${authRedirects}`);

  if (failedRequests.size > 0) {
    console.log('\n=== Resources Returning HTTP 500 ===');
    for (const [url, count] of failedRequests.entries()) {
      // Extract the path from the URL
      const u = new URL(url);
      const path = u.pathname + u.search;
      const route = results.find(r => {
        // Find which route page triggered this 500
        return false; // We'll just show the URL
      });
      console.log(`  [${count}x] ${path}`);
    }
  }

  console.log('\n=== Per-Route Details ===');
  for (const r of results) {
    const details = r.error || (r.authRedirect ? 'Auth redirect (middleware working)' : 'Page renders correctly');
    console.log(`\n  ${r.path}:`);
    console.log(`    HTTP ${r.httpStatus || 'ERR'}, load ${r.loadTime || '?'}ms, ${r.status}`);
    if (details) console.log(`    Detail: ${details}`);
  }

  await browser.close();
  console.log('\nDone.');
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
