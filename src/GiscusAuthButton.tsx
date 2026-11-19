import { useEffect, useState } from 'react';
import { Github, LogOut } from 'lucide-react';

// giscus owns GitHub OAuth. This is the same browser session key used by its client.js.
// The portfolio doesn't handle GitHub access tokens or maintain its own accounts.
const SESSION_KEY = 'giscus-session';
const SCROLL_KEY = 'giscus-auth-scroll';

// Preserve the visitor's position during OAuth redirects and sign-out reloads.
function saveScrollPosition() {
  try {
    window.sessionStorage.setItem(SCROLL_KEY, JSON.stringify({ y: window.scrollY, at: Date.now() }));
  } catch { /* Private browsing may disallow session storage. */ }
}

function hasGiscusSession() {
  try {
    return Boolean(window.localStorage.getItem(SESSION_KEY));
  } catch {
    return false;
  }
}

function getGiscusLoginUrl() {
  const returnUrl = new URL(window.location.href);
  returnUrl.searchParams.delete('giscus');
  returnUrl.hash = ''; // Authentication must not navigate to a page section.
  return `https://giscus.app/api/oauth/authorize?redirect_uri=${encodeURIComponent(returnUrl.toString())}`;
}

export default function GiscusAuthButton() {
  const [signedIn, setSignedIn] = useState(hasGiscusSession);

  useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem(SCROLL_KEY);
      if (!stored) return;
      window.sessionStorage.removeItem(SCROLL_KEY);
      const position: { y?: number; at?: number } = JSON.parse(stored);
      const { y, at } = position;
      if (typeof y !== 'number' || !Number.isFinite(y) || y < 0 ||
          typeof at !== 'number' || Date.now() - at > 300000) return;
      requestAnimationFrame(() => window.scrollTo({ top: y, behavior: 'instant' }));
    } catch { /* Browser storage is optional for scroll restoration. */ }
  }, []);

  useEffect(() => {
    const syncSession = () => setSignedIn(hasGiscusSession());
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://giscus.app') return;
      if (!event.data || typeof event.data !== 'object' || !event.data.giscus) return;
      const message = event.data.giscus;
      if (message.signOut ||
        (typeof message.error === 'string' &&
          /Bad credentials|Invalid state value|State has expired/.test(message.error))) {
        setSignedIn(false);
      }
    };
    window.addEventListener('storage', syncSession);
    window.addEventListener('focus', syncSession);
    window.addEventListener('message', onMessage);
    return () => {
      window.removeEventListener('storage', syncSession);
      window.removeEventListener('focus', syncSession);
      window.removeEventListener('message', onMessage);
    };
  }, []);

  const content = signedIn
    ? <><LogOut size={16} /><span className="github-auth-desktop">Sign Out</span><span className="github-auth-mobile">Sign Out</span></>
    : <><Github size={16} /><span className="github-auth-desktop">Sign in with GitHub</span><span className="github-auth-mobile">Sign In</span></>;

  if (!signedIn) {
    return <a className="button button-primary github-auth-button" href={getGiscusLoginUrl()} onClick={saveScrollPosition} aria-label="Sign in with GitHub to comment">{content}</a>;
  }

  const signOut = () => {
    try {
      saveScrollPosition();
      window.localStorage.removeItem(SESSION_KEY);
      const url = new URL(window.location.href);
      url.hash = '';
      window.history.replaceState(window.history.state, document.title, url.pathname + url.search);
      window.location.reload(); // Refresh the giscus iframe without jumping to a section.
    } catch {
      window.alert('Unable to sign out. Please check your browser storage settings.');
    }
  };

  return <button type="button" className="button button-primary github-auth-button" aria-label="Sign out of GitHub project discussions" onClick={signOut}>{content}</button>;
}
