import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>,
);

// Present the initial branded boot screen while the app and the eager giscus
// iframe initialize. Never block the site indefinitely on a third party.
const boot = document.getElementById('portfolio-boot');
if (boot) {
  const startedAt = performance.now();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let finished = false;
  let observedFrame: HTMLIFrameElement | null = null;

  const reveal = () => {
    if (finished) return;
    finished = true;
    observer.disconnect();
    window.clearTimeout(fallback);
    const remaining = reducedMotion ? 0 : Math.max(0, 650 - (performance.now() - startedAt));
    window.setTimeout(() => {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        boot.classList.add('is-complete');
        window.setTimeout(() => boot.remove(), reducedMotion ? 0 : 420);
      }));
    }, remaining);
  };

  const observer = new MutationObserver(() => {
    const frame = document.querySelector<HTMLIFrameElement>('iframe.giscus-frame');
    if (!frame || frame === observedFrame) return;
    observedFrame = frame;
    frame.addEventListener('load', reveal, { once: true });
  });
  observer.observe(document.body, { childList: true, subtree: true });
  // The giscus service can be slow, blocked, or unavailable; keep navigation usable.
  const fallback = window.setTimeout(reveal, 1650);
  // An existing iframe can appear before observation begins on fast loads.
  const existingFrame = document.querySelector<HTMLIFrameElement>('iframe.giscus-frame');
  if (existingFrame) {
    observedFrame = existingFrame;
    existingFrame.addEventListener('load', reveal, { once: true });
  }
}
