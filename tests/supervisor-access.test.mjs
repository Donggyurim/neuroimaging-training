import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { handleRequest } from '../supervisor-app/worker.mjs';

const env = { SUPERVISOR_EMAIL: 'owner@example.com', ACCESS_AUD: 'the-supervisor-application' };
function authenticated(email = env.SUPERVISOR_EMAIL, aud = env.ACCESS_AUD) {
  // This is Cloudflare's trusted execution context, not browser input.
  return { access: { aud, async getIdentity() { return { email }; } } };
}
function request(path = '/', options = {}) { return new Request(`https://supervisor.example.com${path}`, options); }
async function assertDenied(response, expected) {
  assert.equal(response.status, expected);
  const body = await response.text();
  assert(!body.includes('id="review-template"'));
  assert(!body.includes('id="copy-review"'));
  assert.match(response.headers.get('cache-control'), /no-store/);
  assert.match(response.headers.get('content-security-policy'), /frame-ancestors 'none'/);
  assert(!body.includes(env.SUPERVISOR_EMAIL));
}

test('missing owner or application configuration keeps every route closed', async () => {
  for (const values of [{}, { ACCESS_AUD: env.ACCESS_AUD }, { SUPERVISOR_EMAIL: env.SUPERVISOR_EMAIL }]) {
    for (const path of ['/', '/review', '/page.mjs', '/anything']) {
      await assertDenied(await handleRequest(request(path), values, authenticated()), 503);
    }
  }
});

test('anonymous requests, fake tokens, and browser role flags cannot open the workspace', async () => {
  const probes = [
    request(), request('/review'), request('/?email=owner%40example.com&role=supervisor'),
    request('/', { headers: { 'Cf-Access-Jwt-Assertion': 'forged-token', 'Cf-Access-Authenticated-User-Email': env.SUPERVISOR_EMAIL } }),
    request('/', { headers: { Cookie: 'CF_Authorization=forged-token; authenticated=true', Authorization: 'Bearer fake' } })
  ];
  for (const probe of probes) await assertDenied(await handleRequest(probe, env, {}), 403);
});

test('an authenticated student is denied even if an Access policy is too broad', async () => {
  await assertDenied(await handleRequest(request('/review'), env, authenticated('student@example.com')), 403);
});

test('a context for a different Access application is denied', async () => {
  await assertDenied(await handleRequest(request(), env, authenticated(env.SUPERVISOR_EMAIL, 'another-app')), 403);
});

test('missing or failed identity checks never fall back to browser headers', async () => {
  await assertDenied(await handleRequest(request(), env, { access: { aud: env.ACCESS_AUD, async getIdentity() { return {}; } } }), 403);
  await assertDenied(await handleRequest(request(), env, { access: { aud: env.ACCESS_AUD, async getIdentity() { throw new Error('Provider failure'); } } }), 503);
});

test('the configured owner can open the private review and receives non-cacheable content', async () => {
  for (const path of ['/', '/review']) {
    const result = await handleRequest(request(path), env, authenticated('OWNER@example.com'));
    assert.equal(result.status, 200);
    assert.match(result.headers.get('cache-control'), /private, no-store/);
    const policy = result.headers.get('content-security-policy');
    const body = await result.text();
    assert(body.includes('id="review-template"'));
    assert(body.includes('/cdn-cgi/access/logout'));
    const nonce = body.match(/<script nonce="([^"]+)"/)[1];
    assert(policy.includes(`'nonce-${nonce}'`));
    assert(!policy.includes("script-src 'unsafe-inline'"));
    assert(!body.includes(env.SUPERVISOR_EMAIL));
  }
});

test('authorised requests cannot fetch source files or mutate the workspace', async () => {
  await assertDenied(await handleRequest(request('/worker.mjs'), env, authenticated()), 404);
  const post = await handleRequest(request('/', { method: 'POST', body: 'role=supervisor' }), env, authenticated());
  assert.equal(post.headers.get('allow'), 'GET, HEAD');
  await assertDenied(post, 405);
  const head = await handleRequest(request('/', { method: 'HEAD' }), env, authenticated());
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
});

test('the private application and review payload are absent from the public build', async () => {
  const root = fileURLToPath(new URL('../_site/', import.meta.url));
  const files = await readdir(root, { recursive: true });
  assert(files.length > 0);
  assert(files.every(path => !path.startsWith('supervisor-app/')));
  for (const name of files.filter(name => name.endsWith('.html') || name === 'search.json')) {
    const content = await readFile(join(root, name), 'utf8');
    assert(!content.includes('id="review-template"'), name);
    assert(!content.includes('id="copy-review"'), name);
    assert(!content.includes('Evidence reviewed (link/version)'), name);
  }
});

test('the owner review page works in a browser without sharing it through the static site', async t => {
  const { createServer } = await import('node:http');
  const { chromium } = await import('playwright');
  // A local test fixture supplies the trusted platform context. It is not a
  // production route, environment flag, or client-controlled authentication seam.
  const server = createServer(async (req, res) => {
    const result = await handleRequest(new Request(`http://127.0.0.1${req.url}`), env, authenticated());
    res.writeHead(result.status, Object.fromEntries(result.headers));
    res.end(await result.text());
  });
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  t.after(() => new Promise(done => server.close(done)));
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined });
  t.after(() => browser.close());
  const context = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/review`);
  await page.getByRole('button', { name: 'Copy review template' }).click();
  await page.waitForFunction(() => document.getElementById('copy-status').textContent.startsWith('Copied'));
  assert((await page.evaluate(() => navigator.clipboard.readText())).includes('Next action'));
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { value: undefined }));
  await page.getByRole('button', { name: 'Copy review template' }).click();
  assert(await page.locator('#review-template').isVisible());
  assert((await page.evaluate(() => getSelection().toString())).includes('Next action'));
  for (const width of [1200, 390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  }
  assert.deepEqual(errors, []);
});
