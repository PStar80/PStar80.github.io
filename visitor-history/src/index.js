// PStar80 GitHub check-ins — an optional, separately deployed Cloudflare Worker.
// No public write API: only a completed server-side GitHub OAuth exchange can log a visit.
// The giscus comments app remains unchanged, and is reached after an optional check-in.

const SITE_ORIGIN = 'https://pstar80.github.io';
const OAUTH_COOKIE = '__Host-sc_oauth';
const ADMIN_COOKIE = '__Host-sc_admin';
const DAY_MS = 86_400_000;
const RETENTION_MS = 30 * DAY_MS;
const ADMIN_SESSION_MS = 20 * 60_000;
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function bytes(value) { return textEncoder.encode(value); }
function base64url(input) {
  const values = typeof input === 'string' ? bytes(input) : input;
  let binary = '';
  for (const value of values) binary += String.fromCharCode(value);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/g, '');
}
function fromBase64url(value) {
  if (!/^[A-Za-z0-9_-]{1,4096}$/.test(value)) throw new Error('Invalid value');
  const source = value.replaceAll('-', '+').replaceAll('_', '/');
  const binary = atob(source.padEnd(Math.ceil(source.length / 4) * 4, '='));
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}
function randomSecret() { return base64url(crypto.getRandomValues(new Uint8Array(32))); }
async function sha256(value) {
  return base64url(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes(value))));
}
function cookieString(name, value, maxAge) {
  return `${name}=${value}; Path=/; Max-Age=${maxAge}; Secure; HttpOnly; SameSite=Lax`;
}
function cookieValue(request, name) {
  const raw = request.headers.get('Cookie') || '';
  const match = raw.split(';').map(x => x.trim()).find(x => x.startsWith(name + '='));
  return match?.slice(name.length + 1) || null;
}
function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}
function headers(extra = {}) {
  return {
    'Cache-Control': 'no-store, private',
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Content-Security-Policy': "default-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'; style-src 'unsafe-inline'",
    ...extra,
  };
}
function redirect(url, cookies = []) {
  const h = new Headers(headers({ Location: url }));
  for (const cookie of cookies) h.append('Set-Cookie', cookie);
  return new Response(null, { status: 302, headers: h });
}
function page(title, body, status = 200) {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)} · PStar80</title><style>
:root{color-scheme:dark}*{box-sizing:border-box}body{background:#070d17;color:#eef7ff;font-family:system-ui,-apple-system,Segoe UI,sans-serif;margin:0;min-height:100vh;display:grid;place-items:center;padding:24px}
main{width:min(740px,100%);padding:36px;background:linear-gradient(145deg,#12253b,#081527);border:1px solid #40668c;border-radius:14px;box-shadow:0 20px 90px #0007}
small{letter-spacing:.16em;text-transform:uppercase;color:#79cbf8;font-weight:700}h1{font-size:clamp(1.6rem,4vw,2.4rem);margin:14px 0 16px}
p{line-height:1.7;color:#bed1e3}a{color:#93d9ff}a.button,button.button{display:inline-flex;justify-content:center;align-items:center;padding:13px 19px;border-radius:7px;border:1px solid #85cfff;background:linear-gradient(110deg,#2976df,#319ec8);color:white;font-weight:700;text-decoration:none;cursor:pointer}
.actions{display:flex;align-items:center;flex-wrap:wrap;gap:17px;margin-top:25px}
.note{font-size:.9rem;color:#90abc6}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:12px 10px;border-bottom:1px solid #315070;vertical-align:top}th{color:#a9cbe4;font-size:.8rem}
code{font-family:ui-monospace,monospace} .scroll{overflow-x:auto}
</style></head><body><main><small>SkyCommand ecosystem / GitHub</small>${body}</main></body></html>`;
  return new Response(html, { status, headers: headers({ 'Content-Type': 'text/html; charset=utf-8' }) });
}
function giscusUrl() {
  const u = new URL('https://giscus.app/api/oauth/authorize');
  u.searchParams.set('redirect_uri', SITE_ORIGIN + '/');
  return u.toString();
}
function callbackUrl(request) { return new URL('/oauth/callback', request.url).toString(); }
function ready(env) {
  return Boolean(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET &&
    env.ADMIN_COOKIE_SECRET && env.OWNER_GITHUB_ID && env.DB);
}
function setupError() {
  return page('Setup required',
    '<h1>Check-in service not configured</h1><p>The website can still use its existing GitHub Discussions sign-in.</p><div class="actions"><a class="button" href="' + escapeHtml(giscusUrl()) + '">Continue to GitHub Discussions</a></div>',
    503);
}

function consentPage() {
  return page('Optional GitHub check-in', `<h1>Continue with GitHub</h1>
<p>Before entering the portfolio discussion, you can opt to record a <strong>private GitHub check-in</strong>. We verify your GitHub account and store only your public username, numeric GitHub account ID, and the UTC time this check-in occurred.</p>
<p>The site owner can review these records; they are automatically deleted after 30 days. This service does not store your email, IP address, access token, or password in its database. GitHub and Cloudflare may independently process requests under their own policies.</p>
<p>You may be asked to authorize this site's read-only identity check and then giscus separately for comments. This check-in confirms your GitHub identity, <strong>not</strong> that you subsequently posted a comment.</p>
<div class="actions"><a class="button" href="/check-in/authorize">Continue &amp; record check-in</a>
<a href="${escapeHtml(giscusUrl())}">Continue without check-in</a></div>
<p class="note">Choosing the second link goes directly to the existing giscus sign-in without sending an event to this check-in service.</p>`);
}
async function beginOAuth(request, env, mode) {
  if (!ready(env)) return setupError();
  const nonce = randomSecret();
  const verifier = randomSecret();
  const csrf = { nonce, verifier, mode, created: Date.now() };
  const authorization = new URL('https://github.com/login/oauth/authorize');
  authorization.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
  authorization.searchParams.set('redirect_uri', callbackUrl(request));
  authorization.searchParams.set('state', nonce);
  authorization.searchParams.set('code_challenge', await sha256(verifier));
  authorization.searchParams.set('code_challenge_method', 'S256');
  // Intentionally request no additional OAuth scopes. Only public /user fields.
  return redirect(authorization.toString(), [cookieString(OAUTH_COOKIE, base64url(JSON.stringify(csrf)), 600)]);
}
function parseOAuthCookie(request) {
  const encoded = cookieValue(request, OAUTH_COOKIE);
  if (!encoded) return null;
  try {
    const s = JSON.parse(textDecoder.decode(fromBase64url(encoded)));
    if (!s || !['checkin', 'admin'].includes(s.mode) ||
        typeof s.nonce !== 'string' || typeof s.verifier !== 'string' ||
        !/^[A-Za-z0-9_-]{32,80}$/.test(s.nonce) ||
        !/^[A-Za-z0-9_-]{32,80}$/.test(s.verifier) ||
        !Number.isFinite(s.created) || Date.now() - s.created > 600_000 ||
        Date.now() < s.created) return null;
    return s;
  } catch { return null; }
}
async function verifiedGitHubUser(request, env, code, verifier) {
  const exchange = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST', headers: {
      Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'PStar80-Visitor-History',
    },
    body: new URLSearchParams({
      client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET,
      code, redirect_uri: callbackUrl(request), code_verifier: verifier,
    }),
  });
  if (!exchange.ok) throw new Error('GitHub token exchange unsuccessful');
  const result = await exchange.json();
  if (typeof result.access_token !== 'string' || !result.access_token ||
      result.token_type?.toLowerCase() !== 'bearer') throw new Error('GitHub authorization rejected');

  // The access token is used only server-side, once, and never persisted.
  const profile = await fetch('https://api.github.com/user', {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${result.access_token}`,
      'User-Agent': 'PStar80-Visitor-History',
    },
  });
  if (!profile.ok) throw new Error('GitHub account verification unsuccessful');
  const user = await profile.json();
  if (!Number.isSafeInteger(user.id) || user.id < 1 ||
      typeof user.login !== 'string' || !/^[A-Za-z0-9-]{1,39}$/.test(user.login))
    throw new Error('Invalid GitHub account response');
  return { id: user.id, login: user.login };
}
async function purgeOld(db) {
  return db.prepare('DELETE FROM visitor_checkins WHERE verified_at_ms < ?')
    .bind(Date.now() - RETENTION_MS).run();
}
async function handleCallback(request, env) {
  if (!ready(env)) return setupError();
  const url = new URL(request.url);
  const saved = parseOAuthCookie(request);
  const clearCsrf = cookieString(OAUTH_COOKIE, '', 0);
  const state = url.searchParams.get('state') || '';
  if (!saved || !state || state !== saved.nonce) {
    const response = page('Authorization expired',
      '<h1>Could not verify this authorization</h1><p>Please start again from the portfolio.</p><div class="actions"><a class="button" href="' + SITE_ORIGIN + '/">Portfolio homepage</a></div>', 400);
    response.headers.append('Set-Cookie', clearCsrf);
    return response;
  }
  if (url.searchParams.has('error')) {
    return redirect(SITE_ORIGIN + '/', [clearCsrf]);
  }
  const code = url.searchParams.get('code');
  if (!code || code.length > 1024) return redirect(SITE_ORIGIN + '/', [clearCsrf]);

  let verified;
  try {
    verified = await verifiedGitHubUser(request, env, code, saved.verifier);
  } catch {
    const response = page('Verification unavailable',
      '<h1>GitHub verification did not complete</h1><p>No visitor check-in was saved. You can still continue to the existing discussion sign-in.</p><div class="actions"><a class="button" href="' + escapeHtml(giscusUrl()) + '">Continue to comments</a></div>', 502);
    response.headers.append('Set-Cookie', clearCsrf);
    return response;
  }

  if (saved.mode === 'admin') {
    // Only the stable numeric GitHub ID grants the private history view.
    const ownerId = Number(env.OWNER_GITHUB_ID);
    if (!Number.isSafeInteger(ownerId) || verified.id !== ownerId) {
      const response = page('Access denied',
        '<h1>Owner access required</h1><p>This history is private to the site owner.</p>', 403);
      response.headers.append('Set-Cookie', clearCsrf);
      return response;
    }
    const token = await makeAdminCookie(env, verified.id);
    return redirect(new URL('/admin', request.url).toString(), [clearCsrf, token]);
  }

  try {
    await purgeOld(env.DB);
    await env.DB.prepare('INSERT INTO visitor_checkins (github_id, github_login, verified_at_ms) VALUES (?, ?, ?)')
      .bind(verified.id, verified.login, Date.now()).run();
  } catch {
    const response = page('Check-in unavailable',
      '<h1>Check-in could not be saved</h1><p>Your GitHub account was verified, but the history database was unavailable. No check-in record is guaranteed. You can still continue to comments without saving an event.</p><div class="actions"><a class="button" href="' + escapeHtml(giscusUrl()) + '">Continue to comments</a></div>', 503);
    response.headers.append('Set-Cookie', clearCsrf);
    return response;
  }
  // Preserve the existing giscus OAuth session and comments experience.
  return redirect(giscusUrl(), [clearCsrf]);
}
async function hmacKey(env) {
  return crypto.subtle.importKey('raw', bytes(env.ADMIN_COOKIE_SECRET),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}
async function makeAdminCookie(env, ownerId) {
  const payload = base64url(JSON.stringify({ id: ownerId, expires: Date.now() + ADMIN_SESSION_MS }));
  const key = await hmacKey(env);
  const signature = base64url(new Uint8Array(await crypto.subtle.sign('HMAC', key, bytes(payload))));
  return cookieString(ADMIN_COOKIE, payload + '.' + signature, Math.floor(ADMIN_SESSION_MS / 1000));
}
async function isOwner(request, env) {
  if (!env.ADMIN_COOKIE_SECRET || !env.OWNER_GITHUB_ID) return false;
  const cookie = cookieValue(request, ADMIN_COOKIE);
  if (!cookie || cookie.length > 2000) return false;
  const pieces = cookie.split('.');
  if (pieces.length !== 2) return false;
  try {
    const claims = JSON.parse(textDecoder.decode(fromBase64url(pieces[0])));
    if (!Number.isSafeInteger(claims.id) || claims.id !== Number(env.OWNER_GITHUB_ID) ||
        !Number.isFinite(claims.expires) || claims.expires < Date.now()) return false;
    return await crypto.subtle.verify('HMAC', await hmacKey(env),
      fromBase64url(pieces[1]), bytes(pieces[0]));
  } catch { return false; }
}
async function adminDashboard(request, env) {
  if (!ready(env)) return setupError();
  if (!(await isOwner(request, env))) {
    return page('Private check-in history',
      '<h1>Private visitor history</h1><p>Only the site owner can access the log. Sign in with GitHub to verify ownership.</p><div class="actions"><a class="button" href="/admin/login">Owner sign-in</a></div>');
  }
  await purgeOld(env.DB);
  const { results } = await env.DB.prepare(
    'SELECT github_id, github_login, verified_at_ms FROM visitor_checkins WHERE verified_at_ms >= ? ORDER BY verified_at_ms DESC, id DESC LIMIT 100'
  ).bind(Date.now() - RETENTION_MS).all();
  const tableRows = (results || []).map(row => {
    const login = escapeHtml(row.github_login);
    const profile = 'https://github.com/' + encodeURIComponent(row.github_login);
    const date = new Date(row.verified_at_ms).toISOString();
    return `<tr><td><a rel="noopener noreferrer" href="${escapeHtml(profile)}">${login}</a></td><td><time datetime="${date}">${date}</time></td></tr>`;
  }).join('');
  return page('Private check-in history',
    `<h1>GitHub visitor check-ins</h1>
<p>Server-verified GitHub identities observed when visitors explicitly chose the optional portfolio check-in. This does not prove they completed their separate giscus comment sign-in.</p>
<p class="note">Most recent 100 · Last 30 days · UTC · No IPs, emails, tokens or passwords stored.</p>
<div class="scroll"><table><thead><tr><th>GitHub account</th><th>Verified at (UTC)</th></tr></thead><tbody>${tableRows || '<tr><td colspan="2">No recent check-ins</td></tr>'}</tbody></table></div>
<form method="post" action="/admin/logout" class="actions"><button class="button" type="submit">Sign out of history</button></form>`);
}
export default {
  async fetch(request, env) {
    const u = new URL(request.url);
    if (u.protocol !== 'https:' || u.hostname === 'pstar80.github.io') {
      return new Response('HTTPS Worker endpoint required', { status: 400, headers: headers() });
    }
    if (request.method === 'GET' && u.pathname === '/check-in') return consentPage();
    if (request.method === 'GET' && u.pathname === '/check-in/authorize') return beginOAuth(request, env, 'checkin');
    if (request.method === 'GET' && u.pathname === '/admin/login') return beginOAuth(request, env, 'admin');
    if (request.method === 'GET' && u.pathname === '/oauth/callback') return handleCallback(request, env);
    if (request.method === 'GET' && u.pathname === '/admin') return adminDashboard(request, env);
    if (request.method === 'POST' && u.pathname === '/admin/logout') {
      if (request.headers.get('Origin') !== u.origin) return new Response('Forbidden', { status: 403, headers: headers() });
      return redirect(new URL('/admin', u).toString(), [cookieString(ADMIN_COOKIE, '', 0)]);
    }
    return new Response('Not found', { status: 404, headers: headers() });
  },
  async scheduled(controller, env) {
    await purgeOld(env.DB);
  },
};
