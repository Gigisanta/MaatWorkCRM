const { chromium } = require('playwright');

const BASE = 'https://crm.maat.work';
const results = [];
let browser, context, page;

async function screenshot(name) {
  await page.screenshot({ path: `/tmp/e2e-${name}.png`, fullPage: false });
  console.log(`  [Screenshot: /tmp/e2e-${name}.png]`);
}

async function checkErrors() {
  const errors = [];
  return errors;
}

async function run() {
  console.log('Starting MaatWork CRM E2E Test Suite\n');
  console.log('='.repeat(60));

  browser = await chromium.launch({ headless: true });
  context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push(`PAGE ERROR: ${err.message}`));

  // ─── LOGIN ───────────────────────────────────────────────────────────
  console.log('\n[1/10] LOGIN PAGE');
  try {
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await screenshot('01-login');

    const loginForm = await page.locator('form').count();
    const identifierInput = await page.locator('#identifier').count();
    const passwordInput = await page.locator('#password').count();
    console.log(`  Form present: ${loginForm > 0 ? 'YES' : 'NO'}`);
    console.log(`  Identifier input: ${identifierInput > 0 ? 'YES' : 'NO'}`);
    console.log(`  Password input: ${passwordInput > 0 ? 'YES' : 'NO'}`);

    // Fill credentials
    await page.fill('#identifier', 'gio');
    await page.fill('#password', 'admin123');
    await page.waitForTimeout(500);
    await screenshot('02-login-filled');

    // Submit
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);

    const postLoginUrl = page.url();
    const postLoginText = await page.locator('body').innerText();
    const loginSuccess = !postLoginUrl.includes('login');

    console.log(`  Post-login URL: ${postLoginUrl}`);
    console.log(`  Login success: ${loginSuccess ? 'YES' : 'NO'}`);
    if (!loginSuccess) {
      console.log(`  Page text: ${postLoginText.slice(0, 200)}`);
    }
    results.push({ page: 'login', status: loginSuccess ? 'PASS' : 'FAIL', url: postLoginUrl });
  } catch (e) {
    console.log(`  ERROR: ${e.message}`);
    results.push({ page: 'login', status: 'FAIL', error: e.message });
  }

  // If login failed, stop here
  const loginResult = results[results.length - 1];
  if (loginResult.status === 'FAIL') {
    console.log('\nLogin failed - cannot proceed with authenticated tests.');
    await browser.close();
    return;
  }

  // ─── DASHBOARD ────────────────────────────────────────────────────────
  console.log('\n[2/10] DASHBOARD');
  try {
    await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(4000);
    await screenshot('03-dashboard');
    const dashText = await page.locator('body').innerText();
    const dashErrors = consoleErrors.splice(0);
    console.log(`  Console errors: ${dashErrors.length > 0 ? dashErrors.join(', ') : 'none'}`);
    console.log(`  Content (first 200): ${dashText.slice(0, 200)}`);
    results.push({ page: 'dashboard', status: dashErrors.length === 0 ? 'PASS' : 'FAIL', errors: dashErrors });
  } catch (e) {
    console.log(`  ERROR: ${e.message}`);
    results.push({ page: 'dashboard', status: 'FAIL', error: e.message });
  }

  // ─── CONTACTS ────────────────────────────────────────────────────────
  console.log('\n[3/10] CONTACTS');
  try {
    await page.goto(`${BASE}/contacts`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await screenshot('04-contacts');
    const contactsText = await page.locator('body').innerText();
    const contactsErrors = consoleErrors.splice(0);
    console.log(`  Console errors: ${contactsErrors.length > 0 ? contactsErrors.join(', ') : 'none'}`);
    console.log(`  Has contacts list: ${contactsText.includes('contacto') ? 'YES' : 'NO'}`);
    results.push({ page: 'contacts', status: contactsErrors.length === 0 ? 'PASS' : 'FAIL', errors: contactsErrors });
  } catch (e) {
    console.log(`  ERROR: ${e.message}`);
    results.push({ page: 'contacts', status: 'FAIL', error: e.message });
  }

  // ─── PIPELINE ────────────────────────────────────────────────────────
  console.log('\n[4/10] PIPELINE');
  try {
    await page.goto(`${BASE}/pipeline`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await screenshot('05-pipeline');
    const pipelineText = await page.locator('body').innerText();
    const pipelineErrors = consoleErrors.splice(0);
    console.log(`  Console errors: ${pipelineErrors.length > 0 ? pipelineErrors.join(', ') : 'none'}`);
    console.log(`  Content: ${pipelineText.slice(0, 200)}`);
    results.push({ page: 'pipeline', status: pipelineErrors.length === 0 ? 'PASS' : 'FAIL', errors: pipelineErrors });
  } catch (e) {
    console.log(`  ERROR: ${e.message}`);
    results.push({ page: 'pipeline', status: 'FAIL', error: e.message });
  }

  // ─── TASKS ───────────────────────────────────────────────────────────
  console.log('\n[5/10] TASKS');
  try {
    await page.goto(`${BASE}/tasks`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await screenshot('06-tasks');
    const tasksText = await page.locator('body').innerText();
    const tasksErrors = consoleErrors.splice(0);
    console.log(`  Console errors: ${tasksErrors.length > 0 ? tasksErrors.join(', ') : 'none'}`);
    console.log(`  Content: ${tasksText.slice(0, 200)}`);
    results.push({ page: 'tasks', status: tasksErrors.length === 0 ? 'PASS' : 'FAIL', errors: tasksErrors });
  } catch (e) {
    console.log(`  ERROR: ${e.message}`);
    results.push({ page: 'tasks', status: 'FAIL', error: e.message });
  }

  // ─── CALENDAR ────────────────────────────────────────────────────────
  console.log('\n[6/10] CALENDAR');
  try {
    await page.goto(`${BASE}/calendar`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    await screenshot('07-calendar');
    const calendarText = await page.locator('body').innerText();
    const calendarErrors = consoleErrors.splice(0);
    console.log(`  Console errors: ${calendarErrors.length > 0 ? calendarErrors.join(', ') : 'none'}`);
    console.log(`  Content: ${calendarText.slice(0, 200)}`);
    results.push({ page: 'calendar', status: calendarErrors.length === 0 ? 'PASS' : 'FAIL', errors: calendarErrors });
  } catch (e) {
    console.log(`  ERROR: ${e.message}`);
    results.push({ page: 'calendar', status: 'FAIL', error: e.message });
  }

  // ─── REPORTS ────────────────────────────────────────────────────────
  console.log('\n[7/10] REPORTS');
  try {
    await page.goto(`${BASE}/reports`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    await screenshot('08-reports');
    const reportsText = await page.locator('body').innerText();
    const reportsErrors = consoleErrors.splice(0);
    console.log(`  Console errors: ${reportsErrors.length > 0 ? reportsErrors.join(', ') : 'none'}`);
    console.log(`  Content: ${reportsText.slice(0, 200)}`);
    results.push({ page: 'reports', status: reportsErrors.length === 0 ? 'PASS' : 'FAIL', errors: reportsErrors });
  } catch (e) {
    console.log(`  ERROR: ${e.message}`);
    results.push({ page: 'reports', status: 'FAIL', error: e.message });
  }

  // ─── SETTINGS ────────────────────────────────────────────────────────
  console.log('\n[8/10] SETTINGS');
  try {
    await page.goto(`${BASE}/settings`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    await screenshot('09-settings');
    const settingsText = await page.locator('body').innerText();
    const settingsErrors = consoleErrors.splice(0);
    console.log(`  Console errors: ${settingsErrors.length > 0 ? settingsErrors.join(', ') : 'none'}`);
    console.log(`  Content: ${settingsText.slice(0, 200)}`);
    results.push({ page: 'settings', status: settingsErrors.length === 0 ? 'PASS' : 'FAIL', errors: settingsErrors });
  } catch (e) {
    console.log(`  ERROR: ${e.message}`);
    results.push({ page: 'settings', status: 'FAIL', error: e.message });
  }

  // ─── NOTIFICATIONS ───────────────────────────────────────────────────
  console.log('\n[9/10] NOTIFICATIONS');
  try {
    await page.goto(`${BASE}/notifications`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    await screenshot('10-notifications');
    const notifText = await page.locator('body').innerText();
    const notifErrors = consoleErrors.splice(0);
    console.log(`  Console errors: ${notifErrors.length > 0 ? notifErrors.join(', ') : 'none'}`);
    console.log(`  Content: ${notifText.slice(0, 200)}`);
    results.push({ page: 'notifications', status: notifErrors.length === 0 ? 'PASS' : 'FAIL', errors: notifErrors });
  } catch (e) {
    console.log(`  ERROR: ${e.message}`);
    results.push({ page: 'notifications', status: 'FAIL', error: e.message });
  }

  // ─── TEAMS ───────────────────────────────────────────────────────────
  console.log('\n[10/10] TEAMS');
  try {
    await page.goto(`${BASE}/teams`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    await screenshot('11-teams');
    const teamsText = await page.locator('body').innerText();
    const teamsErrors = consoleErrors.splice(0);
    console.log(`  Console errors: ${teamsErrors.length > 0 ? teamsErrors.join(', ') : 'none'}`);
    console.log(`  Content: ${teamsText.slice(0, 200)}`);
    results.push({ page: 'teams', status: teamsErrors.length === 0 ? 'PASS' : 'FAIL', errors: teamsErrors });
  } catch (e) {
    console.log(`  ERROR: ${e.message}`);
    results.push({ page: 'teams', status: 'FAIL', error: e.message });
  }

  // ─── INTERACTIVE: Create Contact ──────────────────────────────────────
  console.log('\n[BONUS] INTERACTIVE: Create Contact');
  try {
    await page.goto(`${BASE}/contacts`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    const newContactBtn = page.locator('button:has-text("Nuevo Contacto"), button:has-text("Nuevo"), button:has-text("New Contact")').first();
    const btnCount = await newContactBtn.count();
    console.log(`  "Nuevo Contacto" button: ${btnCount > 0 ? 'FOUND' : 'NOT FOUND'}`);

    if (btnCount > 0) {
      await newContactBtn.click();
      await page.waitForTimeout(2000);
      await screenshot('12-new-contact-dialog');

      // Fill form
      const nameInput = page.locator('input[id*="name"], input[placeholder*="Nombre"]').first();
      if (await nameInput.count() > 0) {
        await nameInput.fill('Carlos Rodriguez');
        await page.waitForTimeout(300);
      }

      const emailInput = page.locator('input[type="email"], input[id*="email"]').first();
      if (await emailInput.count() > 0) {
        await emailInput.fill('carlos.e2e@test.com');
        await page.waitForTimeout(300);
      }

      await screenshot('13-contact-filled');

      // Submit
      const createBtn = page.locator('button:has-text("Crear"), button:has-text("Save"), button:has-text("Submit")').first();
      if (await createBtn.count() > 0) {
        await createBtn.click();
        await page.waitForTimeout(3000);
        await screenshot('14-after-create');
        const afterText = await page.locator('body').innerText();
        console.log(`  After create: ${afterText.slice(0, 200)}`);
        results.push({ page: 'create-contact', status: 'PASS' });
      } else {
        results.push({ page: 'create-contact', status: 'FAIL', error: 'Create button not found' });
      }
    } else {
      results.push({ page: 'create-contact', status: 'FAIL', error: 'New Contact button not found' });
    }
  } catch (e) {
    console.log(`  ERROR: ${e.message}`);
    results.push({ page: 'create-contact', status: 'FAIL', error: e.message });
  }

  await browser.close();

  // ─── SUMMARY ─────────────────────────────────────────────────────────
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));

  let pass = 0, fail = 0;
  for (const r of results) {
    const icon = r.status === 'PASS' ? '✓' : '✗';
    console.log(`  ${icon} ${r.page}: ${r.status}${r.errors ? ` (${r.errors.length} errors)` : ''}`);
    if (r.status === 'PASS') pass++;
    else fail++;
  }
  console.log(`\n  Total: ${results.length} | Passed: ${pass} | Failed: ${fail}`);
  console.log(`  Pass rate: ${((pass / results.length) * 100).toFixed(1)}%`);
  console.log('\n  Screenshots: /tmp/e2e-*.png');
}

run().catch(e => {
  console.error('Fatal error:', e);
  if (browser) browser.close();
  process.exit(1);
});
