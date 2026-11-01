const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { readFile } = require('node:fs/promises');
const { resolve, extname, sep } = require('node:path');
const { chromium } = require('playwright');

const root = resolve(__dirname, '../_site');
const prefix = '/neuroimaging-training/';
const storageKey = 'neuroimaging-training:checklist:v1';
let server, browser, base;
const contentTypes = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2'
};

before(async () => {
  // Use the same nested path as GitHub Pages, rather than relying on root URLs.
  await readFile(resolve(root, 'student.html'));
  server = createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      if (!pathname.startsWith(prefix)) { res.writeHead(404).end(); return; }
      const file = resolve(root, pathname.slice(prefix.length) || 'index.html');
      if (!file.startsWith(root + sep)) { res.writeHead(403).end(); return; }
      const body = await readFile(file);
      res.writeHead(200, { 'Content-Type': contentTypes[extname(file)] || 'application/octet-stream' });
      res.end(body);
    } catch { res.writeHead(404).end(); }
  });
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  base = `http://127.0.0.1:${server.address().port}${prefix}`;
  browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined
  });
});

after(async () => {
  if (browser) await browser.close();
  if (server) await new Promise(done => server.close(done));
});

async function visit(t, path, options = {}) {
  const context = await browser.newContext(options);
  t.after(() => context.close());
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if (response.url().startsWith(base) && response.status() >= 400) {
      errors.push(`${response.status()} ${response.url()}`);
    }
  });
  t.after(() => assert.deepEqual(errors, [], 'No script errors or missing local resources'));
  await page.goto(base + path);
  return { context, page };
}

test('students can follow their next step and resume their checklist', async t => {
  const { page } = await visit(t, '');
  await page.getByRole('link', { name: 'Open student workspace' }).click();
  await page.getByRole('checkbox', { name: 'Prepared: Set up & contribute' }).check();
  assert.equal(await page.locator('#next-step-link').textContent(), 'Define your question');
  await page.reload();
  assert.equal(await page.locator('#progress-label').textContent(), '1 of 7 personal steps checked');
  assert(await page.getByRole('checkbox', { name: 'Prepared: Set up & contribute', includeHidden: true }).isChecked());
  assert(await page.getByRole('checkbox', { name: 'Prepared: Define your question' }).isVisible());
  for (const details of await page.locator('.milestone').all()) {
    if (await details.getAttribute('open') === null) await details.locator('summary').click();
    await details.locator('input').check();
  }
  assert.equal(await page.locator('#next-step-link').textContent(), 'Prepare for your final review');
  await page.getByRole('button', { name: 'Clear personal checks' }).click();
  assert.equal(await page.locator('#progress-label').textContent(), '0 of 7 personal steps checked');
  await page.reload();
  assert.equal(await page.locator('#learning-progress').getAttribute('value'), '0');
});

test('checklist changes are reflected in another open tab', async t => {
  const { context, page } = await visit(t, 'student.html');
  const second = await context.newPage();
  await second.goto(base + 'student.html');
  await page.getByRole('checkbox', { name: 'Prepared: Set up & contribute' }).check();
  await second.waitForFunction(() => document.getElementById('progress-label').textContent.startsWith('1 of'));
  assert(await second.getByRole('checkbox', { name: 'Prepared: Define your question' }).isVisible());
});

test('invalid saved state recovers and later progress still persists', async t => {
  const { page } = await visit(t, 'student.html');
  await page.evaluate(key => localStorage.setItem(key, '{broken'), storageKey);
  await page.reload();
  await page.getByRole('checkbox', { name: 'Prepared: Set up & contribute' }).check();
  await page.reload();
  assert.equal(await page.locator('#progress-label').textContent(), '1 of 7 personal steps checked');
  assert(!(await page.locator('#storage-note').textContent()).includes('unavailable'));
});

test('blocked storage writes do not block the learning flow', async t => {
  const { context, page } = await visit(t, '');
  await context.addInitScript(() => {
    // Model a full quota/private-mode store: reads work but writes fail.
    Storage.prototype.setItem = () => {
      throw new DOMException('Storage quota exceeded', 'QuotaExceededError');
    };
  });
  await page.goto(base + 'student.html');
  await page.getByRole('checkbox', { name: 'Prepared: Set up & contribute' }).check();
  assert.equal(await page.locator('#progress-label').textContent(), '1 of 7 personal steps checked');
  assert((await page.locator('#storage-note').textContent()).includes('unavailable'));
});

test('lesson search handles matches, empty results, and clearing', async t => {
  const { page } = await visit(t, 'library.html');
  const search = page.getByRole('searchbox', { name: 'Search lessons' });
  await search.fill('SEGMENTATION');
  assert.equal(await page.locator('.lesson-card:visible').count(), 2);
  await page.getByRole('link', { name: /Pilot a segmentation/ }).click();
  assert.equal(page.url(), base + 'techniques/fastsurfer-pilot.html');
  await page.goto(base + 'library.html');
  await search.fill('no-matching-guide');
  assert(await page.locator('#no-lessons').isVisible());
  await search.fill('');
  assert.equal(await page.locator('.lesson-card:visible').count(), 11);
});

test('supervisor feedback can be copied with a manual fallback', async t => {
  const { context, page } = await visit(t, 'supervisor.html', {
    permissions: ['clipboard-read', 'clipboard-write']
  });
  await page.getByRole('button', { name: 'Copy review template' }).click();
  await page.waitForFunction(() => document.getElementById('copy-status').textContent.startsWith('Copied'));
  assert((await page.evaluate(() => navigator.clipboard.readText())).includes('Evidence reviewed'));
  await context.clearPermissions();
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { value: undefined }));
  await page.getByRole('button', { name: 'Copy review template' }).click();
  assert((await page.locator('#copy-status').textContent()).includes('selected'));
  assert((await page.evaluate(() => getSelection().toString())).includes('Next action'));
});

test('mobile navigation and layouts work at 320px and 390px', async t => {
  const { page } = await visit(t, '', { viewport: { width: 320, height: 740 } });
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    for (const path of ['', 'student.html', 'supervisor.html', 'library.html', 'tutorials/getting-started.html', 'tutorials/first-regional-brain-volumes.html']) {
      await page.goto(base + path);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${width}px: ${path}`);
    }
  }
  await page.goto(base);
  await page.locator('.navbar-toggler').click();
  await page.getByRole('link', { name: 'Supervisors', exact: true }).click();
  assert.equal(page.url(), base + 'supervisor.html');
});

test('without JavaScript lessons and feedback remain readable', async t => {
  const { page } = await visit(t, 'student.html', { javaScriptEnabled: false });
  assert(await page.getByRole('checkbox', { name: 'Prepared: Set up & contribute' }).isDisabled());
  assert.equal(await page.getByRole('button', { name: 'Clear personal checks' }).count(), 0);
  await page.locator('.milestone').nth(1).locator('summary').click();
  assert(await page.getByRole('link', { name: 'Plan your project' }).isVisible());
  await page.goto(base + 'library.html');
  assert.equal(await page.locator('.lesson-card:visible').count(), 11);
  assert(await page.getByRole('searchbox', { name: 'Search lessons' }).isDisabled());
  await page.goto(base + 'supervisor.html');
  assert.equal(await page.getByRole('button', { name: 'Copy review template' }).count(), 0);
  assert((await page.locator('#review-template').textContent()).includes('Next action'));
});

test('students can find, launch, and download the structural MRI notebook', async t => {
  const { context, page } = await visit(t, 'student.html');
  await page.getByRole('link', { name: 'Open the eight-step tutorial' }).click();
  assert.equal(page.url(), base + 'tutorials/first-regional-brain-volumes.html');
  const launch = page.getByRole('link', { name: 'Open the course notebook in Colab' });
  assert.equal(await launch.getAttribute('href'),
    'https://colab.research.google.com/github/Donggyurim/neuroimaging-training/blob/main/notebooks/First_regional_brain_volumes.ipynb');
  const downloadLink = page.getByRole('link', { name: 'Download the Jupyter notebook' });
  const response = await context.request.get(await downloadLink.evaluate(link => link.href));
  assert.equal(response.status(), 200);
  const notebook = await response.json();
  assert.equal(notebook.nbformat, 4);
  assert(notebook.cells.some(cell => cell.cell_type === 'code'));
  assert(notebook.cells.every(cell => cell.cell_type !== 'code' || cell.outputs.length === 0));
  await page.goto(base + 'library.html');
  await page.getByRole('searchbox', { name: 'Search lessons' }).fill('jupyter');
  assert.equal(await page.locator('.lesson-card:visible').count(), 1);
  await page.getByRole('link', { name: 'Your first regional brain volumes' }).click();
  assert.equal(page.url(), base + 'tutorials/first-regional-brain-volumes.html');
});
