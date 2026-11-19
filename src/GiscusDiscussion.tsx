import { useEffect, useRef } from 'react';
import GiscusAuthDiagnostic from './GiscusAuthDiagnostic';

// giscus stores portfolio comments in this repository's GitHub Discussions.
// Configuration IDs are public embed identifiers, not API credentials.
const giscusOptions: Record<string, string> = {
  'data-repo': 'PStar80/PStar80.github.io',
  'data-repo-id': 'R_kgDOVyfkbg',
  'data-category': 'Announcements',
  'data-category-id': 'DIC_kwDOVyfkbs4DLdSP',
  'data-mapping': 'pathname',
  'data-strict': '0',
  'data-reactions-enabled': '0',
  'data-emit-metadata': '0',
  'data-input-position': 'bottom',
  // Bump the CSS URL version when changing the portfolio's iframe-only theme.
  'data-theme': 'https://pstar80.github.io/giscus-portfolio.css?v=20261119b',
  'data-lang': 'en',
};

export default function GiscusDiscussion() {
  const containerRef = useRef<HTMLDivElement>(null);
  // An explicit local diagnostic flag is required; ordinary visitors do not
  // enable giscus metadata emission or render the diagnostic.
  const diagnosticsEnabled = typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('authDiagnostics') === '1';

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const loadComments = () => {
      const script = document.createElement('script');
      script.src = 'https://giscus.app/client.js';
      script.async = true;
      script.crossOrigin = 'anonymous';
      for (const [name, value] of Object.entries(giscusOptions)) {
        script.setAttribute(name, value);
      }
      script.setAttribute('data-emit-metadata', diagnosticsEnabled ? '1' : '0');
      container.appendChild(script);
    };

    // Keep third-party comments off the critical initial-render path.
    if (!('IntersectionObserver' in window)) {
      loadComments();
      return () => container.replaceChildren();
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        loadComments();
      }
    }, { rootMargin: '350px' });

    observer.observe(container);
    return () => {
      observer.disconnect();
      container.replaceChildren();
    };
  }, [diagnosticsEnabled]);

  return <>
    <div ref={containerRef} className="giscus" aria-label="GitHub-powered project discussion" />
    {diagnosticsEnabled && <GiscusAuthDiagnostic />}
  </>;
}
