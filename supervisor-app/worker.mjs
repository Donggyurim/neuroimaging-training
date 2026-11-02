import { renderSupervisorPage, renderMessage } from './page.mjs';

function response(status, title, message, { body, nonce, head = false } = {}) {
  const headers = {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'private, no-store, max-age=0',
    'Pragma': 'no-cache',
    'Vary': 'Cookie, Cf-Access-Jwt-Assertion',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Content-Security-Policy': [
      "default-src 'none'", "style-src 'unsafe-inline'",
      nonce ? `script-src 'nonce-${nonce}'` : "script-src 'none'",
      "frame-ancestors 'none'", "base-uri 'none'", "form-action 'none'"
    ].join('; ')
  };
  if (status === 405) headers.Allow = 'GET, HEAD';
  return new Response(head ? null : body ?? renderMessage(title, message), { status, headers });
}

export async function handleRequest(request, env, ctx) {
  const head = request.method === 'HEAD';
  const owner = typeof env.SUPERVISOR_EMAIL === 'string' ? env.SUPERVISOR_EMAIL.trim().toLowerCase() : '';
  const audience = typeof env.ACCESS_AUD === 'string' ? env.ACCESS_AUD.trim() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(owner) || !audience) {
    return response(503, 'Access unavailable', 'Supervisor sign-in has not been configured.', { head });
  }

  // ctx.access is supplied by Cloudflare after authentication, never by the browser.
  // Do not substitute a request header, cookie, query parameter, or local flag here.
  if (!ctx?.access) return response(403, 'Sign-in required', 'Open this workspace through Cloudflare Access.', { head });
  const audiences = Array.isArray(ctx.access.aud) ? ctx.access.aud : [ctx.access.aud];
  if (!audiences.includes(audience)) return response(403, 'Access denied', 'This sign-in is not allowed.', { head });
  let identity;
  try {
    identity = await ctx.access.getIdentity();
  } catch {
    return response(503, 'Access unavailable', 'Your sign-in could not be verified. Try again later.', { head });
  }
  if (typeof identity?.email !== 'string' || identity.email.trim().toLowerCase() !== owner) {
    return response(403, 'Access denied', 'This account is not allowed.', { head });
  }

  // Every route, including errors, reaches this point only after owner verification.
  const path = new URL(request.url).pathname;
  if (path !== '/' && path !== '/review') return response(404, 'Page not found', 'This page is unavailable.', { head });
  if (!['GET', 'HEAD'].includes(request.method)) return response(405, 'Method not allowed', 'Use the workspace links to continue.');
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  const nonce = btoa(String.fromCharCode(...bytes));
  return response(200, '', '', { body: renderSupervisorPage(nonce), nonce, head });
}

export default { fetch: handleRequest };
