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
  assert.equal(await page.locator('#progress-label').textContent(), '1 / 7 prepared');
  assert(await page.getByRole('checkbox', { name: 'Prepared: Set up & contribute', includeHidden: true }).isChecked());
  assert(await page.getByRole('checkbox', { name: 'Prepared: Define your question' }).isVisible());
  for (const details of await page.locator('.milestone').all()) {
    if (await details.getAttribute('open') === null) await details.locator('summary').click();
    await details.locator('input').check();
  }
  assert.equal(await page.locator('#next-step-link').textContent(), 'Ready for review');
  await page.getByRole('button', { name: 'Reset checklist' }).click();
  assert.equal(await page.locator('#progress-label').textContent(), '0 / 7 prepared');
  await page.reload();
  assert.equal(await page.locator('#learning-progress').getAttribute('value'), '0');
});

test('checklist changes are reflected in another open tab', async t => {
  const { context, page } = await visit(t, 'student.html');
  const second = await context.newPage();
  await second.goto(base + 'student.html');
  await page.getByRole('checkbox', { name: 'Prepared: Set up & contribute' }).check();
  await second.waitForFunction(() => document.getElementById('progress-label').textContent.startsWith('1 /'));
  assert(await second.getByRole('checkbox', { name: 'Prepared: Define your question' }).isVisible());
});

test('invalid saved state recovers and later progress still persists', async t => {
  const { page } = await visit(t, 'student.html');
  await page.evaluate(key => localStorage.setItem(key, '{broken'), storageKey);
  await page.reload();
  await page.getByRole('checkbox', { name: 'Prepared: Set up & contribute' }).check();
  await page.reload();
  assert.equal(await page.locator('#progress-label').textContent(), '1 / 7 prepared');
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
  assert.equal(await page.locator('#progress-label').textContent(), '1 / 7 prepared');
  assert((await page.locator('#storage-note').textContent()).includes('unavailable'));
});

test('lesson search handles matches, empty results, and clearing', async t => {
  const { page } = await visit(t, 'library.html');
  const search = page.getByRole('searchbox', { name: 'Search lessons' });
  await search.fill('SEGMENTATION');
  assert.equal(await page.locator('.lesson-card:visible').count(), 2);
  await page.getByRole('link', { name: /Segmentation pilot/ }).click();
  assert.equal(page.url(), base + 'techniques/fastsurfer-pilot.html');
  await page.goto(base + 'library.html');
  await search.fill('no-matching-guide');
  assert(await page.locator('#no-lessons').isVisible());
  await search.fill('');
  assert.equal(await page.locator('.lesson-card:visible').count(), 11);
});

test('the public supervisor entry contains no management content or client-side unlock', async t => {
  const { page } = await visit(t, 'supervisor.html');
  assert(await page.getByRole('heading', { name: 'Private workspace' }).isVisible());
  assert.equal(await page.locator('#review-template').count(), 0);
  assert.equal(await page.locator('#copy-review').count(), 0);
  assert.equal(await page.getByRole('link', { name: 'Open tasks' }).count(), 0);
  await page.evaluate(() => localStorage.setItem('supervisor', 'true'));
  await page.goto(base + 'supervisor.html?role=supervisor');
  assert.equal(await page.locator('#review-template').count(), 0);
});

test('mobile navigation and layouts work at 320px and 390px', async t => {
  const { page } = await visit(t, '', { viewport: { width: 320, height: 740 } });
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    for (const path of [
      '', 'student.html', 'supervisor.html', 'library.html',
      'tutorials/getting-started.html', 'tutorials/first-regional-brain-volumes.html',
      'tutorials/structural-mri-pathway.html', 'datasets/openneuro-t1w.html',
      'techniques/fastsurfer-pilot.html', 'techniques/regional-volume-analysis.html',
      'techniques/brain-visualisation.html', 'tutorials/brainlife-first-run.html',
      'projects/structural-mri-handover.html', 'sources-and-contributions.html',
      'tutorials/index.html', 'datasets/index.html', 'techniques/index.html', 'projects/index.html'
    ]) {
      await page.goto(base + path);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${width}px: ${path}`);
    }
  }
  await page.goto(base);
  await page.locator('.navbar-toggler').click();
  await page.getByRole('link', { name: 'Supervisor', exact: true }).click();
  assert.equal(page.url(), base + 'supervisor.html');
});

test('without JavaScript lessons and feedback remain readable', async t => {
  const { page } = await visit(t, 'student.html', { javaScriptEnabled: false });
  assert(await page.getByRole('checkbox', { name: 'Prepared: Set up & contribute' }).isDisabled());
  assert.equal(await page.getByRole('button', { name: 'Reset checklist' }).count(), 0);
  await page.locator('.milestone').nth(1).locator('summary').click();
  assert(await page.getByRole('link', { name: 'Plan your project' }).isVisible());
  await page.goto(base + 'library.html');
  assert.equal(await page.locator('.lesson-card:visible').count(), 11);
  assert(await page.getByRole('searchbox', { name: 'Search lessons' }).isDisabled());
  await page.goto(base + 'supervisor.html');
  assert.equal(await page.getByRole('button', { name: 'Copy review template' }).count(), 0);
  assert.equal(await page.locator('#review-template').count(), 0);
  assert(await page.getByRole('heading', { name: 'Private workspace' }).isVisible());
});

test('students can find, launch, and download the structural MRI notebook', async t => {
  const { context, page } = await visit(t, 'student.html');
  await page.getByRole('link', { name: 'Start notebook' }).click();
  assert.equal(page.url(), base + 'tutorials/first-regional-brain-volumes.html');
  const launch = page.getByRole('link', { name: 'Open in Colab' });
  assert.equal(await launch.getAttribute('href'),
    'https://colab.research.google.com/github/Donggyurim/neuroimaging-training/blob/main/notebooks/First_regional_brain_volumes.ipynb');
  const downloadLink = page.getByRole('link', { name: 'Download notebook' });
  const response = await context.request.get(await downloadLink.evaluate(link => link.href));
  assert.equal(response.status(), 200);
  const notebook = await response.json();
  assert.equal(notebook.nbformat, 4);
  assert(notebook.cells.some(cell => cell.cell_type === 'code'));
  assert(notebook.cells.every(cell => cell.cell_type !== 'code' || cell.outputs.length === 0));
  await page.goto(base + 'library.html');
  await page.getByRole('searchbox', { name: 'Search lessons' }).fill('jupyter');
  assert.equal(await page.locator('.lesson-card:visible').count(), 1);
  await page.getByRole('link', { name: 'First brain volumes' }).click();
  assert.equal(page.url(), base + 'tutorials/first-regional-brain-volumes.html');
});

test('lesson details work with keyboard navigation and direct section links', async t => {
  const { page } = await visit(t, 'tutorials/getting-started.html');
  const help = page.locator('details#when-something-goes-wrong');
  assert.equal(await help.getAttribute('open'), null);
  await help.locator('summary').focus();
  await page.keyboard.press('Enter');
  assert.notEqual(await help.getAttribute('open'), null);
  assert(await help.getByRole('cell', { name: 'quarto: command not found' }).isVisible());
  await page.goto(base + 'tutorials/getting-started.html#when-something-goes-wrong');
  await page.waitForFunction(() => document.getElementById('when-something-goes-wrong').open);
  assert.notEqual(await help.getAttribute('open'), null);
  assert(await help.getByRole('cell', { name: 'quarto: command not found' }).isVisible());
});

test('continue follows the current milestone rather than the initial lesson', async t => {
  const { page } = await visit(t, 'student.html');
  await page.getByRole('checkbox', { name: 'Prepared: Set up & contribute' }).check();
  await page.getByRole('link', { name: 'Continue', exact: false }).click();
  assert.equal(page.url(), base + 'tutorials/structural-mri-pathway.html');
  const notebookAction = page.getByRole('link', { name: 'Start the notebook' });
  await notebookAction.waitFor({ state: 'visible' });
  assert(await notebookAction.isVisible());
});

test('expanded reference material stays inside the viewport on phones', async t => {
  const { page } = await visit(t, '', { viewport: { width: 320, height: 800 } });
  for (const path of [
    'tutorials/getting-started.html', 'tutorials/structural-mri-pathway.html',
    'tutorials/first-regional-brain-volumes.html', 'datasets/openneuro-t1w.html',
    'techniques/fastsurfer-pilot.html', 'techniques/regional-volume-analysis.html',
    'techniques/brain-visualisation.html', 'tutorials/brainlife-first-run.html',
    'projects/structural-mri-handover.html', 'sources-and-contributions.html'
  ]) {
    await page.goto(base + path);
    await page.evaluate(() => document.querySelectorAll('details').forEach(section => { section.open = true; }));
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), path);
  }
});
