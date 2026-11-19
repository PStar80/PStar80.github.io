import { useEffect, useRef } from 'react';

// All comments and GitHub authorization remain owned by giscus.
// When configured, its public viewer metadata can feed a best-effort visitor
// observation. This is NOT a server-verified sign-in or security audit.
function observationEndpoint(): string | null {
  const raw = import.meta.env.VITE_VISITOR_HISTORY_WORKER_URL?.trim();
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:' || u.username || u.password ||
        u.pathname !== '/' || u.search || u.hash) return null;
    return new URL('/observe', u).toString();
  } catch { return null; }
}
const receiver = observationEndpoint();

const giscusOptions: Record<string, string> = {
  'data-repo': 'PStar80/PStar80.github.io',
  'data-repo-id': 'R_kgDOVyfkbg',
  'data-category': 'Announcements',
  'data-category-id': 'DIC_kwDOVyfkbs4DLdSP',
  'data-mapping': 'pathname',
  'data-strict': '0',
  'data-reactions-enabled': '0',
  'data-emit-metadata': receiver ? '1' : '0',
  'data-input-position': 'bottom',
  'data-theme': 'https://pstar80.github.io/giscus-portfolio.css?v=20261119b',
  'data-lang': 'en',
};

function signedInToGiscus() {
  try { return Boolean(window.localStorage.getItem('giscus-session')); }
  catch { return false; }
}

export default function GiscusDiscussion() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let sentLogin = '';

    const onMetadata = (event: MessageEvent) => {
      if (!receiver || event.origin !== 'https://giscus.app' || !signedInToGiscus()) return;
      const frame = container.querySelector<HTMLIFrameElement>('iframe.giscus-frame');
      if (!frame || event.source !== frame.contentWindow) return;

      const message = event.data;
      if (!message || typeof message !== 'object' ||
          !message.giscus || typeof message.giscus !== 'object') return;
      const viewer = (message.giscus as { viewer?: unknown }).viewer;
      if (!viewer || typeof viewer !== 'object') return;
      const { login, url } = viewer as { login?: unknown; url?: unknown };
      if (typeof login !== 'string' || !/^[A-Za-z0-9-]{1,39}$/.test(login) ||
          login.toLowerCase() === 'ghost' || typeof url !== 'string') return;
      try {
        const profile = new URL(url);
        if (profile.origin !== 'https://github.com' ||
            profile.pathname.toLowerCase() !== '/' + login.toLowerCase()) return;
      } catch { return; }
      if (sentLogin === login) return;
      sentLogin = login;

      // Best-effort, no credentials or access token. Worker controls the time
      // and records only public username + timestamp, not IP or email.
      void fetch(receiver, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login }),
        keepalive: true,
      }).catch(() => { /* Portfolio commenting must not depend on the log. */ });
    };

    if (receiver) window.addEventListener('message', onMetadata);
    const loadComments = () => {
      const script = document.createElement('script');
      script.src = 'https://giscus.app/client.js';
      script.async = true;
      script.crossOrigin = 'anonymous';
      for (const [name, value] of Object.entries(giscusOptions)) script.setAttribute(name, value);
      container.appendChild(script);
    };

    // When a visitor already has a giscus session, initialize the iframe
    // without scrolling so metadata can arrive even before Discussion is seen.
    // Signed-out visitors still benefit from near-viewport lazy loading.
    if ((receiver && signedInToGiscus()) || !('IntersectionObserver' in window)) {
      loadComments();
      return () => {
        window.removeEventListener('message', onMetadata);
        container.replaceChildren();
      };
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some(entry => entry.isIntersecting)) {
        observer.disconnect();
        loadComments();
      }
    }, { rootMargin: '350px' });
    observer.observe(container);
    return () => {
      observer.disconnect();
      window.removeEventListener('message', onMetadata);
      container.replaceChildren();
    };
  }, []);

  return <div ref={containerRef} className="giscus" aria-label="GitHub-powered project discussion" />;
}
