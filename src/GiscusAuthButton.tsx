import { useEffect, useState } from 'react';
import { Github, LogOut } from 'lucide-react';

// giscus owns GitHub OAuth. This is the same browser session key used by its client.js.
// The portfolio doesn't handle GitHub access tokens or maintain its own accounts.
const SESSION_KEY = 'giscus-session';

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
  returnUrl.hash = 'discussion';
  return `https://giscus.app/api/oauth/authorize?redirect_uri=${encodeURIComponent(returnUrl.toString())}`;
}

export default function GiscusAuthButton() {
  const [signedIn, setSignedIn] = useState(hasGiscusSession);

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
    return <a className="button button-primary github-auth-button" href={getGiscusLoginUrl()} aria-label="Sign in with GitHub to comment">{content}</a>;
  }

  const signOut = () => {
    try {
      window.localStorage.removeItem(SESSION_KEY);
      window.location.reload(); // Also reload the cross-origin giscus iframe with no session.
    } catch {
      window.alert('Unable to sign out. Please check your browser storage settings.');
    }
  };

  return <button type="button" className="button button-primary github-auth-button" aria-label="Sign out of GitHub project discussions" onClick={signOut}>{content}</button>;
}
