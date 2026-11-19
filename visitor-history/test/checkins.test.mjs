import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.js';

const BASE = 'https://pstar80-visitor-checkins.example.workers.dev';
function createDb() {
  const rows = [];
  return {
    rows,
    prepare(sql) {
      let values = [];
      return {
        bind(...args) { values = args; return this; },
        async run() {
          if (sql.startsWith('DELETE FROM visitor_checkins')) {
            const before = Number(values[0]);
            const old = rows.filter(x => x.verified_at_ms < before);
            for (const row of old) rows.splice(rows.indexOf(row), 1);
          } else if (sql.startsWith('INSERT INTO visitor_checkins')) {
            rows.push({ github_id: values[0], github_login: values[1], verified_at_ms: values[2] });
          } else {
            throw new Error('Unexpected D1 write query');
          }
          return { success: true };
        },
        async all() {
          if (!sql.startsWith('SELECT github_id, github_login, verified_at_ms')) throw new Error('Unexpected select');
          return { results: rows.filter(row => row.verified_at_ms >= Number(values[0]))
            .slice().sort((a, b) => b.verified_at_ms - a.verified_at_ms).slice(0, 100) };
        },
      };
    },
  };
}
function environment() {
  return {
    GITHUB_CLIENT_ID: 'test-client-id',
    GITHUB_CLIENT_SECRET: 'test-client-secret',
    OWNER_GITHUB_ID: '42',
    ADMIN_COOKIE_SECRET: 'a-mock-hmac-secret-for-tests-only-not-a-real-secret',
    DB: createDb(),
  };
}
function req(path, init = {}) { return new Request(BASE + path, init); }

async function authorizedCallback(env, mode = 'checkin', user = { id: 42, login: 'test-owner' }) {
  const startUrl = mode === 'admin' ? '/admin/login' : '/check-in/authorize';
  const auth = await worker.fetch(req(startUrl), env);
  assert.equal(auth.status, 302);
  const gotoGithub = new URL(auth.headers.get('Location'));
  assert.equal(gotoGithub.hostname, 'github.com');
  assert.equal(gotoGithub.pathname, '/login/oauth/authorize');
  assert.equal(gotoGithub.searchParams.get('code_challenge_method'), 'S256');
  assert.equal(gotoGithub.searchParams.get('scope'), null);
  const cookie = auth.headers.get('Set-Cookie').split(';')[0];
  const state = gotoGithub.searchParams.get('state');
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    if (String(url).endsWith('/login/oauth/access_token')) {
      assert.equal(options.method, 'POST');
      assert.ok(String(options.body).includes('code_verifier='));
      return Response.json({ access_token: 'mock-token-for-test', token_type: 'bearer' });
    }
    if (String(url) === 'https://api.github.com/user') {
      assert.equal(options.headers.Authorization, 'Bearer mock-token-for-test');
      return Response.json({ ...user, email: 'should-not-store@example.invalid' });
    }
    throw new Error('Unexpected network request');
  };
  let response;
  try {
    const path = `/oauth/callback?code=test-code&state=${encodeURIComponent(state)}`;
    response = await worker.fetch(req(path, { headers: { Cookie: cookie } }), env);
  } finally {
    globalThis.fetch = originalFetch;
  }
  return response;
}

test('consent page discloses retention and lets visitors skip logging', async () => {
  const env = environment();
  const response = await worker.fetch(req('/check-in'), env);
  const body = await response.text();
  assert.equal(response.status, 200);
  assert.match(body, /30 days/);
  assert.match(body, /Continue without check-in/);
  assert.equal(env.DB.rows.length, 0);
});

test('server-verifies a check-in then redirects to ordinary giscus', async () => {
  const env = environment();
  const response = await authorizedCallback(env);
  assert.equal(response.status, 302);
  assert.match(response.headers.get('Location'), /^https:\/\/giscus\.app\/api\/oauth\/authorize/);
  assert.equal(env.DB.rows.length, 1);
  assert.deepEqual(Object.keys(env.DB.rows[0]), ['github_id', 'github_login', 'verified_at_ms']);
  assert.equal(env.DB.rows[0].github_id, 42);
  assert.equal(env.DB.rows[0].github_login, 'test-owner');
  assert.ok(Math.abs(Date.now() - env.DB.rows[0].verified_at_ms) < 5000);
});

test('no unverified public POST can create a check-in', async () => {
  const env = environment();
  const response = await worker.fetch(req('/check-in', { method: 'POST' }), env);
  assert.equal(response.status, 404);
  assert.equal(env.DB.rows.length, 0);
});

test('history is not visible without server-verified owner OAuth', async () => {
  const env = environment();
  env.DB.rows.push({ github_id: 300, github_login: 'visitor-one', verified_at_ms: Date.now() });
  const anon = await worker.fetch(req('/admin'), env);
  assert.equal(anon.status, 200);
  const anonHtml = await anon.text();
  assert.match(anonHtml, /Owner sign-in/);
  assert.doesNotMatch(anonHtml, /visitor-one/);

  const wrong = await authorizedCallback(env, 'admin', { id: 99, login: 'not-the-owner' });
  assert.equal(wrong.status, 403);
  const owner = await authorizedCallback(env, 'admin', { id: 42, login: 'test-owner' });
  assert.equal(owner.status, 302);
  const sessionCookie = owner.headers.get('set-cookie')?.split(', ').find(x => x.startsWith('__Host-sc_admin='))
    || owner.headers.getSetCookie?.().find(x => x.startsWith('__Host-sc_admin='));
  assert.ok(sessionCookie, 'owner session cookie should be present');
  const admin = await worker.fetch(req('/admin', { headers: { Cookie: sessionCookie.split(';')[0] } }), env);
  assert.equal(admin.status, 200);
  assert.match(await admin.text(), /visitor-one/);
});

test('retention cleanup drops records older than 30 days', async () => {
  const env = environment();
  const day = 86_400_000;
  env.DB.rows.push({ github_id: 1, github_login: 'old-user', verified_at_ms: Date.now() - 31 * day });
  env.DB.rows.push({ github_id: 2, github_login: 'new-user', verified_at_ms: Date.now() });
  await worker.scheduled({}, env);
  assert.deepEqual(env.DB.rows.map(x => x.github_login), ['new-user']);
});
