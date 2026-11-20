// Lightweight, informational giscus viewer observations.
// NOT a verified login audit: the browser submits an untrusted public GitHub
// login. No extra OAuth, secrets, custom owner auth, or collection of IP/email.

const PORTFOLIO_ORIGIN = 'https://pstar80.github.io';
// Hide owner observations from the read-only User Log without deleting D1 history.
const OWNER_LOGIN = 'PStar80';
const RETENTION_MS = 30 * 86_400_000;
const DEDUP_MS = 15 * 60_000;

function response(status, body = null, origin = null) {
  const headers = new Headers({
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  if (origin === PORTFOLIO_ORIGIN) {
    headers.set('Access-Control-Allow-Origin', PORTFOLIO_ORIGIN);
    headers.set('Vary', 'Origin');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type');
  }
  return new Response(body, { status, headers });
}

async function purgeExpired(db) {
  return db.prepare('DELETE FROM giscus_observations WHERE observed_at_ms < ?')
    .bind(Date.now() - RETENTION_MS).run();
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'GET' && url.pathname === '/health') {
      return response(200, 'ok');
    }
    // This read endpoint is intentionally NOT authenticated: the portfolio
    // hides its UI for non-owner viewers, but callers can request these
    // public GitHub usernames/timestamps directly. Do not add sensitive data.
    if (url.pathname === '/observations') {
      const origin = request.headers.get('Origin');
      if (origin !== PORTFOLIO_ORIGIN) return response(403, 'Forbidden');
      if (request.method === 'OPTIONS') return response(204, null, origin);
      if (request.method !== 'GET') return response(405, 'Method not allowed', origin);
      if (!env.DB) return response(503, 'Database unavailable', origin);
      const cutoff = Date.now() - RETENTION_MS;
      const dayAgo = Date.now() - 86_400_000;
      try {
        const [recent, summary] = await Promise.all([
          env.DB.prepare(
            'SELECT github_login, observed_at_ms FROM giscus_observations ' +
            'WHERE observed_at_ms >= ? AND github_login COLLATE NOCASE <> ? ' +
            'ORDER BY observed_at_ms DESC LIMIT 100'
          ).bind(cutoff, OWNER_LOGIN).all(),
          env.DB.prepare(
            'SELECT COUNT(*) AS total, COUNT(DISTINCT github_login) AS unique_users, ' +
            'COALESCE(SUM(CASE WHEN observed_at_ms >= ? THEN 1 ELSE 0 END), 0) AS last_24h ' +
            'FROM giscus_observations WHERE observed_at_ms >= ? ' +
            'AND github_login COLLATE NOCASE <> ?'
          ).bind(dayAgo, cutoff, OWNER_LOGIN).first(),
        ]);
        const body = JSON.stringify({
          observations: recent.results || [],
          summary: {
            total: summary?.total ?? 0,
            uniqueUsers: summary?.unique_users ?? 0,
            last24h: summary?.last_24h ?? 0,
          },
        });
        const result = response(200, body, origin);
        result.headers.set('Content-Type', 'application/json; charset=utf-8');
        return result;
      } catch {
        return response(503, 'Observation history unavailable', origin);
      }
    }

    if (url.pathname !== '/observe') return response(404, 'Not found');

    const origin = request.headers.get('Origin');
    if (origin !== PORTFOLIO_ORIGIN) return response(403, 'Forbidden');
    if (request.method === 'OPTIONS') return response(204, null, origin);
    if (request.method !== 'POST') return response(405, 'Method not allowed', origin);

    if (!env.DB) return response(503, 'Database unavailable', origin);
    if (!(request.headers.get('Content-Type') || '').toLowerCase().startsWith('application/json')) {
      return response(415, 'JSON required', origin);
    }
    if (Number(request.headers.get('Content-Length') || 0) > 192) {
      return response(413, 'Payload too large', origin);
    }
    let payload;
    try {
      const text = await request.text();
      if (text.length > 192) return response(413, 'Payload too large', origin);
      payload = JSON.parse(text);
    } catch {
      return response(400, 'Invalid JSON', origin);
    }
    if (!payload || typeof payload !== 'object' ||
        typeof payload.login !== 'string' ||
        !/^[A-Za-z0-9-]{1,39}$/.test(payload.login)) {
      return response(400, 'Invalid GitHub username', origin);
    }

    // The timestamp comes from the Worker, not the browser. Suppress duplicate
    // widget messages/refreshes; do not claim this is an actual login time.
    const now = Date.now();
    try {
      await env.DB.prepare(
        'INSERT INTO giscus_observations (github_login, observed_at_ms) ' +
        'SELECT ?, ? WHERE NOT EXISTS (' +
        'SELECT 1 FROM giscus_observations WHERE github_login = ? AND observed_at_ms >= ?)'
      ).bind(payload.login, now, payload.login, now - DEDUP_MS).run();
    } catch {
      return response(503, 'Unable to record observation', origin);
    }
    return response(204, null, origin);
  },
  async scheduled(_event, env) {
    if (env.DB) await purgeExpired(env.DB);
  },
};
