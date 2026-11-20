import { useCallback, useEffect, useState } from 'react';
import { Github, RefreshCw } from 'lucide-react';

type Observation = { github_login: string; observed_at_ms: number };
type HistoryResponse = {
  observations: Observation[];
  summary: { total: number; uniqueUsers: number; last24h: number };
};

function observationUrl() {
  const raw = import.meta.env.VITE_VISITOR_HISTORY_WORKER_URL?.trim();
  if (!raw) return null;
  try {
    const origin = new URL(raw);
    if (origin.protocol !== 'https:' || origin.username || origin.password ||
        origin.pathname !== '/' || origin.search || origin.hash) return null;
    return new URL('/observations', origin).toString();
  } catch { return null; }
}

export default function UserLog() {
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    const url = observationUrl();
    if (!url) { setError('Observation service is not configured.'); return; }
    setBusy(true);
    setError('');
    try {
      const res = await fetch(url, { cache: 'no-store', credentials: 'omit' });
      if (!res.ok) throw new Error('Service unavailable');
      const payload: HistoryResponse = await res.json();
      if (!Array.isArray(payload.observations) || !payload.summary ||
          typeof payload.summary.total !== 'number' ||
          typeof payload.summary.uniqueUsers !== 'number' ||
          typeof payload.summary.last24h !== 'number') throw new Error('Invalid response');
      setHistory(payload);
    } catch {
      setError('Could not load visitor observations. Please try Refresh.');
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  return <div className="user-log-content">
    <div className="user-log-toolbar">
      <div>
        <h3>GitHub Visitor Observations</h3>
        <p>Recent public GitHub usernames and the times they were observed.</p>
      </div>
      <button type="button" className="button button-primary" onClick={() => void refresh()} disabled={busy}>
        <RefreshCw size={16} aria-hidden="true" />{busy ? 'Refreshing…' : 'Refresh'}
      </button>
    </div>
    {history && <div className="user-log-metrics" aria-label="Observation summary">
      <div><strong>{history.summary.total.toLocaleString()}</strong><span>Observations · 30 days</span></div>
      <div><strong>{history.summary.uniqueUsers.toLocaleString()}</strong><span>Unique usernames</span></div>
      <div><strong>{history.summary.last24h.toLocaleString()}</strong><span>Last 24 hours</span></div>
    </div>}
    {error && <p role="alert" className="user-log-error">{error}</p>}
    {!history && busy && <p role="status">Loading observations…</p>}
    {history && <div className="user-log-table-wrap">
      <table className="user-log-table">
        <thead><tr><th scope="col">GitHub user</th><th scope="col">Observed (your local time)</th></tr></thead>
        <tbody>
          {history.observations.length === 0
            ? <tr><td colSpan={2}>No observations recorded yet.</td></tr>
            : history.observations.map((item, index) => {
              const validLogin = /^[A-Za-z0-9-]{1,39}$/.test(item.github_login);
              const stamp = new Date(item.observed_at_ms);
              const validTime = Number.isFinite(stamp.getTime());
              return <tr key={item.github_login + '-' + item.observed_at_ms + '-' + index}>
                <td>{validLogin
                  ? <a href={'https://github.com/' + encodeURIComponent(item.github_login)} target="_blank" rel="noreferrer"><Github size={15} aria-hidden="true" /> {item.github_login}</a>
                  : 'Unknown user'}</td>
                <td>{validTime
                  ? <time dateTime={stamp.toISOString()}>{stamp.toLocaleString()}</time>
                  : 'Unknown time'}</td>
              </tr>;
            })}
        </tbody>
      </table>
    </div>}
  </div>;
}
