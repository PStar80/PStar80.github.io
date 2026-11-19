import { useEffect, useState } from 'react';

type Observation = {
  login: string;
  profileUrl: string;
  observedAt: number;
};

/**
 * Optional, local-only feasibility test for giscus metadata.
 * No persistence, network requests, tokens, or server-side identity claims.
 * Anyone who explicitly enables the diagnostic sees only their own browser state.
 */
export default function GiscusAuthDiagnostic() {
  const [observation, setObservation] = useState<Observation | null>(null);
  const [status, setStatus] = useState('Waiting for giscus to publish viewer metadata…');

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      // Only metadata emitted by the known giscus iframe is relevant.
      if (event.origin !== 'https://giscus.app') return;
      const iframe = document.querySelector<HTMLIFrameElement>('iframe.giscus-frame');
      if (!iframe || event.source !== iframe.contentWindow) return;
      const outer = event.data;
      if (!outer || typeof outer !== 'object') return;
      const payload = (outer as { giscus?: unknown }).giscus;
      if (!payload || typeof payload !== 'object') return;

      const data = payload as { viewer?: unknown; discussion?: unknown };
      if (!data.viewer || typeof data.viewer !== 'object' || !data.discussion || typeof data.discussion !== 'object') return;
      const viewer = data.viewer as { login?: unknown; url?: unknown };
      if (typeof viewer.login !== 'string' || !/^[A-Za-z0-9-]{1,39}$/.test(viewer.login) ||
          typeof viewer.url !== 'string') return;

      let profileUrl: URL;
      try { profileUrl = new URL(viewer.url); } catch { return; }
      if (profileUrl.origin !== 'https://github.com' ||
          profileUrl.pathname.toLowerCase() !== `/${viewer.login.toLowerCase()}`) return;

      // This only indicates that the browser has giscus-managed session data.
      // It is not proof of a completed or newly performed authentication.
      let hasSession = false;
      try { hasSession = Boolean(window.localStorage.getItem('giscus-session')); }
      catch { /* Browser storage can be unavailable. */ }
      if (!hasSession) {
        setObservation(null);
        setStatus('Viewer metadata arrived, but no local giscus session was detected.');
        return;
      }

      setObservation({ login: viewer.login, profileUrl: profileUrl.href, observedAt: Date.now() });
      setStatus('Giscus metadata received in this browser.');
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  return (
    <aside className="giscus-auth-diagnostic" aria-label="Local GitHub identity diagnostic">
      <div className="giscus-auth-diagnostic-title">LOCAL IDENTITY CHECK · OPT-IN</div>
      <p>This is a temporary feasibility test, not an owner-only dashboard or verified sign-in log. No observation is stored or sent by this portfolio.</p>
      <p role="status" aria-live="polite">{status}</p>
      {observation && (
        <dl>
          <div><dt>Reported GitHub viewer</dt><dd><a href={observation.profileUrl} target="_blank" rel="noreferrer">{observation.login}</a></dd></div>
          <div><dt>Observed locally</dt><dd><time dateTime={new Date(observation.observedAt).toISOString()}>{new Date(observation.observedAt).toLocaleString()}</time></dd></div>
        </dl>
      )}
      <p className="giscus-auth-diagnostic-note">Metadata may arrive more than once. The observed time is not a login timestamp. A trusted server-side OAuth flow would be required for verified audit records.</p>
    </aside>
  );
}
