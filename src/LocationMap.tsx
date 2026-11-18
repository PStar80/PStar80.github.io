import { useEffect, useId, useRef, useState } from 'react';
import { Map as MapIcon, MapPin, Pause, Play } from 'lucide-react';
import { MAP_VIEWBOX, MAP_COMPACT_VIEWBOX, LAND_PATH, BORDERS_PATH, LAKES_PATH, GRATICULE_PATH, TORONTO_POINT } from './location-map-data';
import './location-map.css';

const torontoClock = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Toronto', hour: 'numeric', minute: '2-digit', hour12: true, timeZoneName: 'short',
});

export default function LocationMap() {
  const ref = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const id = 'location-' + useId().replace(/:/g, '');
  const [compact, setCompact] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [paused, setPaused] = useState(false);
  const [clock, setClock] = useState(() => new Date());
  const clockMinute = useRef(Math.floor(clock.getTime() / 60_000));
  const running = visible && pageVisible && !reducedMotion && !paused;

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncPreferences = () => setReducedMotion(motion.matches);
    const syncPage = () => setPageVisible(document.visibilityState === 'visible');
    syncPreferences(); syncPage();
    motion.addEventListener('change', syncPreferences);
    document.addEventListener('visibilitychange', syncPage);
    const intersection = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    const resize = new ResizeObserver(([entry]) => setCompact(entry.contentRect.width < 700));
    if (ref.current) intersection.observe(ref.current);
    if (stage.current) resize.observe(stage.current);
    return () => {
      intersection.disconnect(); resize.disconnect();
      motion.removeEventListener('change', syncPreferences);
      document.removeEventListener('visibilitychange', syncPage);
    };
  }, []);

  useEffect(() => {
    if (!visible || !pageVisible) return;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const now = Date.now();
      const minute = Math.floor(now / 60_000);
      if (minute !== clockMinute.current) {
        clockMinute.current = minute;
        setClock(new Date(now));
      }
      timer = setTimeout(tick, 60_000 - now % 60_000 + 40);
    };
    tick();
    return () => clearTimeout(timer);
  }, [visible, pageVisible]);

  return <div className="location-map" ref={ref} data-motion={running ? 'running' : 'paused'} data-view={compact ? 'regional' : 'world'}>
    <div className="lm-toolbar">
      <span className="lm-eyebrow"><MapIcon size={15} aria-hidden="true" /> LOCATION</span>
      {!reducedMotion && <button className="lm-motion-control" type="button" onClick={() => setPaused(!paused)} aria-label={paused ? 'Play location animation' : 'Pause location animation'}>
        {paused ? <Play size={13} aria-hidden="true" /> : <Pause size={13} aria-hidden="true" />}<span>{paused ? 'Play motion' : 'Pause motion'}</span>
      </button>}
    </div>
    <div ref={stage} className="lm-stage">
      <svg className="lm-svg" viewBox={compact ? MAP_COMPACT_VIEWBOX : MAP_VIEWBOX} role="img" aria-label={compact ? 'Map of North America highlighting Toronto, Canada' : 'World map highlighting Toronto, Canada'} aria-describedby={id + '-description'}>
        <desc id={id + '-description'}>{compact ? 'A flat map of North America and the Great Lakes, with Toronto, Ontario, Canada highlighted.' : 'A flat world map with a latitude and longitude grid, highlighting Toronto, Ontario, Canada beside the Great Lakes.'}</desc>
        <defs>
          <linearGradient id={id + '-ocean'} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#0d2438" /><stop offset="1" stopColor="#071625" /></linearGradient>
          <linearGradient id={id + '-land'} x1="0" y1="0" x2=".7" y2="1"><stop stopColor="#326479" /><stop offset=".55" stopColor="#244c62" /><stop offset="1" stopColor="#18394f" /></linearGradient>
          <radialGradient id={id + '-ambient'} cx="28%" cy="25%" r="65%"><stop stopColor="#6fd7ef" stopOpacity=".1" /><stop offset="1" stopColor="#6fd7ef" stopOpacity="0" /></radialGradient>
          <linearGradient id={id + '-scan'}><stop stopColor="#9de9ff" stopOpacity="0" /><stop offset=".8" stopColor="#9de9ff" stopOpacity=".12" /><stop offset="1" stopColor="#9de9ff" stopOpacity="0" /></linearGradient>
          <radialGradient id={id + '-beacon'}><stop stopColor="#b2f6ff" stopOpacity=".65" /><stop offset=".3" stopColor="#55d2f5" stopOpacity=".24" /><stop offset="1" stopColor="#44bff1" stopOpacity="0" /></radialGradient>
        </defs>
        <rect width="1200" height="480" fill={`url(#${id}-ocean)`} />
        <path d={GRATICULE_PATH} className="lm-graticule lm-graticule-under" />
        <path d={LAND_PATH} fill={`url(#${id}-land)`} className="lm-land" />
        <path d={BORDERS_PATH} className="lm-borders" />
        <path d={LAKES_PATH} className="lm-lakes" />
        <path d={GRATICULE_PATH} className="lm-graticule lm-graticule-over" />
        <rect width="1200" height="480" fill={`url(#${id}-ambient)`} />
        <g className="lm-sweep" aria-hidden="true"><rect width="120" height="480" fill={`url(#${id}-scan)`} /></g>
        <g transform={`translate(${TORONTO_POINT.x} ${TORONTO_POINT.y})`} className="lm-marker">
          <circle r="24" fill={`url(#${id}-beacon)`} />
          <circle r="9" className="lm-beacon-ring lm-beacon-ring-one" />
          <circle r="9" className="lm-beacon-ring lm-beacon-ring-two" />
          <circle r="9" className="lm-beacon-ring lm-beacon-ring-three" />
          <circle r="8" className="lm-marker-halo" />
          <circle r="3.8" className="lm-marker-point" />
          <circle r="1.2" fill="white" />
        </g>
        <g className="lm-city-label" aria-hidden="true">
          <path d={`M${TORONTO_POINT.x + 7} ${TORONTO_POINT.y - 6}L368 88H388`} className="lm-label-leader" />
          <rect x="388" y="57" width="118" height="56" rx="7" className="lm-label-back" />
          <text x="401" y="80" className="lm-city">Toronto</text>
          <text x="402" y="99" className="lm-country">CANADA</text>
        </g>
      </svg>
    </div>
    <div className="lm-footer">
      <div className="lm-place"><MapPin size={18} aria-hidden="true" /><p><span>Based in</span><strong>Toronto, Canada</strong></p></div>
      <div className="lm-local-time"><span>LOCAL TIME</span><time dateTime={clock.toISOString()} title="Toronto local time — America/Toronto">{torontoClock.format(clock)}</time></div>
    </div>
  </div>;
}
