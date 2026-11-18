import { useEffect, useRef, type PointerEvent } from 'react';

/** Local pointer reflection only; the surface itself remains stationary. */
export default function usePointerLighting<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const animation = useRef(0);
  const enabled = useRef(false);
  const position = useRef({ x: 50, y: 50, tx: 50, ty: 50 });

  function reset() {
    cancelAnimationFrame(animation.current);
    animation.current = 0;
    const element = ref.current;
    if (!element) return;
    delete element.dataset.pointerActive;
  }

  useEffect(() => {
    const preference = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    const syncPreference = () => {
      enabled.current = preference.matches;
      if (!enabled.current) reset();
    };
    const onVisibility = () => { if (document.hidden) reset(); };
    syncPreference();
    preference.addEventListener('change', syncPreference);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', reset);
    return () => {
      reset();
      preference.removeEventListener('change', syncPreference);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', reset);
    };
  }, []);

  function update() {
    const element = ref.current;
    if (!element || !enabled.current) { reset(); return; }
    const p = position.current;
    p.x += (p.tx - p.x) * .16;
    p.y += (p.ty - p.y) * .16;
    element.style.setProperty('--mx', `${p.x}%`);
    element.style.setProperty('--my', `${p.y}%`);
    animation.current = Math.abs(p.tx - p.x) > .08 || Math.abs(p.ty - p.y) > .08
      ? requestAnimationFrame(update) : 0;
  }

  function onPointerMove(event: PointerEvent<T>) {
    if (event.pointerType !== 'mouse' || !enabled.current) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    position.current.tx = Math.max(0, Math.min(100, (event.clientX - rect.left) / rect.width * 100));
    position.current.ty = Math.max(0, Math.min(100, (event.clientY - rect.top) / rect.height * 100));
    event.currentTarget.dataset.pointerActive = 'true';
    if (!animation.current) animation.current = requestAnimationFrame(update);
  }

  return { ref, onPointerMove, onPointerLeave: reset, onPointerCancel: reset };
}
