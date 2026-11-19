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
test('rejects unauthorized origins, malformed inputs, and public history reads', async () => {
  const db = database();
  const env = { DB: db };
  assert.equal((await worker.fetch(visit('PStar80', 'https://untrusted.example'), env)).status, 403);
  assert.equal((await worker.fetch(visit('not a username'), env)).status, 400);
  assert.equal((await worker.fetch(request('/admin'), env)).status, 404);
  assert.equal((await worker.fetch(request('/observe'), env)).status, 403);
  assert.equal(db.rows.length, 0);
});
test('30-day scheduled cleanup removes older observations', async () => {
  const db = database();
  const day = 86_400_000;
  db.rows.push({ github_login: 'old', observed_at_ms: Date.now() - day * 31 });
  db.rows.push({ github_login: 'new', observed_at_ms: Date.now() - day });
  await worker.scheduled({}, { DB: db });
  assert.deepEqual(db.rows.map(row => row.github_login), ['new']);
});
