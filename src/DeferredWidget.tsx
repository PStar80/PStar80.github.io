import { Suspense, useEffect, useRef, useState, type ReactNode } from 'react';

type WidgetKind = 'activity' | 'map';

export default function DeferredWidget({
  children,
  kind,
  label,
}: {
  children: ReactNode;
  kind: WidgetKind;
  label: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [nearViewport, setNearViewport] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      setNearViewport(true);
      return;
    }

    // Load each interactive module as the visitor approaches its section.
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        setNearViewport(true);
        observer.disconnect();
      }
    }, { rootMargin: '650px 0px' });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const placeholder = <p className="deferred-widget-fallback" role="status">{label}</p>;

  return (
    <div ref={containerRef} className={`deferred-widget deferred-widget-${kind}`}>
      {nearViewport
        ? <Suspense fallback={placeholder}>{children}</Suspense>
        : placeholder}
    </div>
  );
}
