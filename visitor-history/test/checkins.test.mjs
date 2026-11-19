import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.js';

const BASE = 'https://pstar80-visitor-checkins.example.workers.dev';
const SITE = 'https://pstar80.github.io';

function database() {
  const rows = [];
  return {
    rows,
    prepare(sql) {
      let params = [];
      return {
        bind(...args) { params = args; return this; },
        async run() {
          if (sql.startsWith('DELETE FROM giscus_observations')) {
            for (const row of [...rows]) {
              if (row.observed_at_ms < params[0]) rows.splice(rows.indexOf(row), 1);
            }
          } else if (sql.startsWith('INSERT INTO giscus_observations')) {
            const [login, stamp, duplicateLogin, since] = params;
            if (!rows.some(row => row.github_login === duplicateLogin && row.observed_at_ms >= since)) {
              rows.push({ github_login: login, observed_at_ms: stamp });
            }
          } else throw new Error('Unexpected SQL');
          return { success: true };
        },
        async all() {
          if (!sql.startsWith('SELECT github_login, observed_at_ms')) throw new Error('Unexpected SQL read');
          return { results: rows.filter(row => row.observed_at_ms >= params[0])
            .slice().sort((a, b) => b.observed_at_ms - a.observed_at_ms).slice(0, 100) };
        },
        async first() {
          if (!sql.startsWith('SELECT COUNT(*) AS total')) throw new Error('Unexpected SQL summary');
          const inRange = rows.filter(row => row.observed_at_ms >= params[1]);
          return {
            total: inRange.length,
            unique_users: new Set(inRange.map(row => row.github_login)).size,
            last_24h: inRange.filter(row => row.observed_at_ms >= params[0]).length,
          };
        },
      };
    },
  };
}
function request(path, init = {}) { return new Request(BASE + path, init); }
function visit(login, origin = SITE) {
  return request('/observe', {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify({ login }),
  });
}
test('public health and preflight are accessible without OAuth', async () => {
  const env = { DB: database() };
  assert.equal((await worker.fetch(request('/health'), env)).status, 200);
  assert.equal((await worker.fetch(request('/observe', {
    method: 'OPTIONS', headers: { Origin: SITE, 'Access-Control-Request-Method': 'POST' },
  }), env)).status, 204);
});
test('observes public username and Worker UTC time; suppresses repeat metadata', async () => {
  const db = database();
  const env = { DB: db };
  assert.equal((await worker.fetch(visit('PStar80'), env)).status, 204);
  assert.equal((await worker.fetch(visit('PStar80'), env)).status, 204);
  assert.equal(db.rows.length, 1);
  assert.equal(db.rows[0].github_login, 'PStar80');
  assert.ok(Math.abs(Date.now() - db.rows[0].observed_at_ms) < 5000);
  assert.deepEqual(Object.keys(db.rows[0]), ['github_login', 'observed_at_ms']);
});
test('rejects unauthorized origins and malformed inputs', async () => {
  const db = database();
  const env = { DB: db };
  assert.equal((await worker.fetch(visit('PStar80', 'https://untrusted.example'), env)).status, 403);
  assert.equal((await worker.fetch(visit('not a username'), env)).status, 400);
  assert.equal((await worker.fetch(request('/admin'), env)).status, 404);
  assert.equal((await worker.fetch(request('/observe'), env)).status, 403);
  assert.equal(db.rows.length, 0);
});

test('reads a capped observation list and summary without a separate login', async () => {
  const db = database();
  const env = { DB: db };
  const day = 86_400_000;
  db.rows.push({ github_login: 'PStar80', observed_at_ms: Date.now() - 2_000 });
  db.rows.push({ github_login: 'OtherDev', observed_at_ms: Date.now() - 6 * 3_600_000 });
  db.rows.push({ github_login: 'PStar80', observed_at_ms: Date.now() - 2 * day });
  db.rows.push({ github_login: 'expired', observed_at_ms: Date.now() - 40 * day });
  const res = await worker.fetch(request('/observations', { headers: { Origin: SITE } }), env);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), SITE);
  const data = await res.json();
  assert.equal(data.observations.length, 3);
  assert.equal(data.summary.total, 3);
  assert.equal(data.summary.uniqueUsers, 2);
  assert.equal(data.summary.last24h, 2);
  assert.equal(data.observations[0].github_login, 'PStar80');
  assert.deepEqual(Object.keys(data.observations[0]), ['github_login', 'observed_at_ms']);
});
test('history endpoint rejects other origins and accepts portfolio preflight', async () => {
  const env = { DB: database() };
  const denied = await worker.fetch(request('/observations', {
    headers: { Origin: 'https://other.example' },
  }), env);
  assert.equal(denied.status, 403);
  const preflight = await worker.fetch(request('/observations', {
    method: 'OPTIONS',
    headers: { Origin: SITE, 'Access-Control-Request-Method': 'GET' },
  }), env);
  assert.equal(preflight.status, 204);
  assert.match(preflight.headers.get('Access-Control-Allow-Methods'), /GET/);
});

test('30-day scheduled cleanup removes older observations', async () => {
  const db = database();
  const day = 86_400_000;
  db.rows.push({ github_login: 'old', observed_at_ms: Date.now() - day * 31 });
  db.rows.push({ github_login: 'new', observed_at_ms: Date.now() - day });
  await worker.scheduled({}, { DB: db });
  assert.deepEqual(db.rows.map(row => row.github_login), ['new']);
});
