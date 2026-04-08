import { chromium } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const LOGIN_USER = 'gio';
const LOGIN_PASS = 'admin123';

interface PageResult {
  name: string;
  path: string;
  status: 'pass' | 'error' | 'warning';
  consoleErrors: string[];
  apiErrors: string[];
  details: string;
  screenshotPath: string;
}

async function main() {
  console.log('Starting MaatWork CRM E2E Verification\n');
  console.log('='.repeat(60));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  // ---- LOGIN ----
  console.log('\n[LOGIN] Navigating to /login...');
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  const loginBodyText = await page.evaluate(() => document.body.innerText.substring(0, 600));
  console.log('[LOGIN] Page body text:\n', loginBodyText.substring(0, 400));

  const inputs = await page.locator('input').all();
  console.log(`[LOGIN] Found ${inputs.length} input elements`);
  for (const input of inputs) {
    const type = await input.getAttribute('type');
    const placeholder = await input.getAttribute('placeholder');
    console.log(`  - type=${type}, placeholder=${placeholder}`);
  }

  const identifierInput = page.locator('input[type="text"]').first();
  const passwordInput = page.locator('input[type="password"]').first();
  const submitBtn = page.locator('button[type="submit"]').first();

  const hasId = await identifierInput.count();
  const hasPass = await passwordInput.count();
  const hasSubmit = await submitBtn.count();
  console.log(`[LOGIN] inputs: id=${hasId}, pass=${hasPass}, submit=${hasSubmit}`);

  if (hasId && hasPass) {
    await identifierInput.fill(LOGIN_USER);
    await passwordInput.fill(LOGIN_PASS);
    await submitBtn.click();
    await page.waitForTimeout(6000);

    const url = page.url();
    console.log(`[LOGIN] After submit, URL: ${url}`);

    if (!url.includes('/login')) {
      console.log('[PASS] Login successful');
    } else {
      const bodyAfter = await page.evaluate(() => document.body.innerText.substring(0, 400));
      console.log('[WARN] Still on login. Body:', bodyAfter);
    }
  } else {
    if (!loginBodyText.includes('Usuario') && loginBodyText.includes('Dashboard')) {
      console.log('[PASS] Already logged in (dashboard visible)');
    } else {
      console.log('[ERROR] Cannot find login form inputs');
    }
  }

  const sessionResp = await page.evaluate(async () => {
    const r = await fetch('/api/auth/session');
    return { status: r.status, body: await r.json() };
  });
  console.log('[AUTH] Session:', JSON.stringify(sessionResp));

  // ---- PAGE TESTS ----
  const results: PageResult[] = [];

  const tests = [
    { name: 'Production', path: '/production', apiPath: '/api/production', checks: ['Producción', 'Nueva Producción'] },
    { name: 'Career Plan', path: '/settings/career-plan', apiPath: '/api/career-plan/levels', checks: ['Plan de Carrera', 'Nuevo nivel'] },
    { name: 'Teams', path: '/teams', apiPath: '/api/teams', checks: ['Equipos', 'Herramientas', 'Plantilla Startup 100'] },
    { name: 'Contacts', path: '/contacts', apiPath: '/api/contacts?page=1&limit=5', checks: ['Contactos', 'Gestionar Etiquetas', 'etiquetas'] },
    { name: 'Dashboard', path: '/dashboard', apiPath: null, checks: ['Dashboard'] },
  ];

  for (const test of tests) {
    console.log(`\n[TEST] Testing ${test.path}...`);
    const result: PageResult = {
      name: test.name,
      path: test.path,
      status: 'pass',
      consoleErrors: [],
      apiErrors: [],
      details: '',
      screenshotPath: `/tmp/e2e-${test.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`,
    };

    const consoleErrors: string[] = [];
    const pageErrorHandler = (msg: any) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    };
    page.on('console', pageErrorHandler);

    try {
      await page.goto(`${BASE_URL}${test.path}`, { timeout: 15000 });
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(4000);

      await page.screenshot({ path: result.screenshotPath });

      if (test.apiPath) {
        const apiResp = await page.evaluate(async (apiPath) => {
          const r = await fetch(apiPath);
          const body = await r.text();
          return { status: r.status, body: body.substring(0, 300) };
        }, test.apiPath);

        if (apiResp.status >= 400) {
          try {
            const parsed = JSON.parse(apiResp.body);
            result.apiErrors.push(`HTTP ${apiResp.status}: ${parsed.error || parsed.message || apiResp.body}`);
          } catch {
            result.apiErrors.push(`HTTP ${apiResp.status}: ${apiResp.body}`);
          }
        } else {
          console.log(`  API ${test.apiPath}: HTTP ${apiResp.status} OK`);
        }
      }

      const pageText = await page.evaluate(() => document.body.innerText.substring(0, 800));

      const missingChecks: string[] = [];
      for (const check of test.checks) {
        const found = await page.getByText(check, { exact: false }).count();
        if (found === 0) missingChecks.push(check);
        else console.log(`  Found: "${check}"`);
      }

      const realErrors = consoleErrors.filter(e =>
        !e.includes('Warning:') &&
        !e.includes('DevTools') &&
        !e.includes('favicon') &&
        !e.includes('ERR_CERT') &&
        !e.includes('net::ERR_') &&
        !e.includes('Failed to load resource') &&
        !e.includes('jose') &&
        !e.includes('Download the React DevTools')
      );

      result.consoleErrors = realErrors;
      result.details = pageText.substring(0, 200);

      if (missingChecks.length > 0) {
        result.status = 'warning';
        result.details = `Missing: ${missingChecks.join(', ')}. ${pageText.substring(0, 150)}`;
        console.log(`  [WARN] Missing: ${missingChecks.join(', ')}`);
      }

      if (result.apiErrors.length > 0) {
        result.status = 'error';
        console.log(`  [ERROR] API: ${result.apiErrors.join('; ')}`);
      } else if (result.consoleErrors.length > 0) {
        result.status = 'warning';
        console.log(`  [WARN] Console errors: ${result.consoleErrors.join('; ')}`);
      }

      if (result.status === 'pass') {
        console.log(`  [PASS] Page OK`);
      }

    } catch (e: any) {
      result.status = 'error';
      result.details = e.message;
      console.log(`  [ERROR] Exception: ${e.message}`);
      try { await page.screenshot({ path: result.screenshotPath }); } catch {}
    }

    page.off('console', pageErrorHandler);
    results.push(result);
  }

  await browser.close();

  console.log('\n' + '='.repeat(60));
  console.log('E2E VERIFICATION SUMMARY');
  console.log('='.repeat(60));

  for (const r of results) {
    const icon = r.status === 'pass' ? '[PASS]' : r.status === 'warning' ? '[WARN]' : '[FAIL]';
    console.log(`\n${icon} ${r.name} (${r.path})`);
    console.log(`   Details: ${r.details}`);
    if (r.apiErrors.length > 0) console.log(`   API Errors: ${r.apiErrors.join('; ')}`);
    if (r.consoleErrors.length > 0) console.log(`   Console Errors: ${r.consoleErrors.join('; ')}`);
    console.log(`   Screenshot: ${r.screenshotPath}`);
  }

  const pass = results.filter(r => r.status === 'pass').length;
  const warn = results.filter(r => r.status === 'warning').length;
  const fail = results.filter(r => r.status === 'error').length;
  console.log(`\nTotal: ${results.length} | PASS: ${pass} | WARN: ${warn} | FAIL: ${fail}`);
  console.log('='.repeat(60));
}

main().catch(e => { console.error('Fatal error:', e); process.exit(1); });
