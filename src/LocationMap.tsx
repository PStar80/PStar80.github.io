import { useEffect, useId, useRef, useState, type PointerEvent } from 'react';
import { Globe2, MapPin, Pause, Play } from 'lucide-react';
import { MAP_VIEWBOX, MAP_SPHERE, LAND_PATH, BORDERS_PATH, LAKES_PATH, GRATICULE_PATH, TORONTO_POINT } from './location-map-data';
import './location-map.css';

const torontoClock = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Toronto', hour: 'numeric', minute: '2-digit', hour12: true, timeZoneName: 'short',
});

const rimTicks = Array.from({ length: 32 }, (_, index) => {
  const angle = index * Math.PI / 16;
  const inner = MAP_SPHERE.radius + 7;
  const outer = inner + (index % 4 === 0 ? 6 : 3);
  return {
    x1: MAP_SPHERE.cx + Math.cos(angle) * inner,
    y1: MAP_SPHERE.cy + Math.sin(angle) * inner,
    x2: MAP_SPHERE.cx + Math.cos(angle) * outer,
    y2: MAP_SPHERE.cy + Math.sin(angle) * outer,
    major: index % 4 === 0,
  };
});

export default function LocationMap() {
  const ref = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const pointer = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const id = 'location-' + useId().replace(/:/g, '');
  const [compact, setCompact] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [finePointer, setFinePointer] = useState(false);
  const [paused, setPaused] = useState(false);
  const [clock, setClock] = useState(() => new Date());
  const clockMinute = useRef(Math.floor(clock.getTime() / 60_000));
  const running = visible && pageVisible && !reducedMotion && !paused;

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mouse = window.matchMedia('(hover: hover) and (pointer: fine)');
    const syncPreferences = () => { setReducedMotion(motion.matches); setFinePointer(mouse.matches); };
    const syncPage = () => setPageVisible(document.visibilityState === 'visible');
    syncPreferences(); syncPage();
    motion.addEventListener('change', syncPreferences);
    mouse.addEventListener('change', syncPreferences);
    document.addEventListener('visibilitychange', syncPage);
    const intersection = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    const resize = new ResizeObserver(([entry]) => setCompact(entry.contentRect.width < 460));
    if (ref.current) intersection.observe(ref.current);
    if (stage.current) resize.observe(stage.current);
    return () => {
      intersection.disconnect(); resize.disconnect();
      motion.removeEventListener('change', syncPreferences);
      mouse.removeEventListener('change', syncPreferences);
      document.removeEventListener('visibilitychange', syncPage);
      cancelAnimationFrame(frame.current);
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

  useEffect(() => {
    if (running && finePointer) return;
    cancelAnimationFrame(frame.current); frame.current = 0;
    pointer.current = { x: 0, y: 0, tx: 0, ty: 0 };
    ref.current?.style.setProperty('--lm-x', '0px');
    ref.current?.style.setProperty('--lm-y', '0px');
  }, [running, finePointer]);

  function easePointer() {
    const p = pointer.current;
    p.x += (p.tx - p.x) * .13; p.y += (p.ty - p.y) * .13;
    ref.current?.style.setProperty('--lm-x', p.x.toFixed(3) + 'px');
    ref.current?.style.setProperty('--lm-y', p.y.toFixed(3) + 'px');
    if (Math.abs(p.tx - p.x) > .012 || Math.abs(p.ty - p.y) > .012) frame.current = requestAnimationFrame(easePointer);
    else frame.current = 0;
  }

  function movePointer(event: PointerEvent<HTMLDivElement>) {
    if (!running || !finePointer || event.pointerType !== 'mouse') return;
    const box = event.currentTarget.getBoundingClientRect();
    pointer.current.tx = Math.max(-3, Math.min(3, ((event.clientX - box.left) / box.width - .5) * 6));
    pointer.current.ty = Math.max(-3, Math.min(3, ((event.clientY - box.top) / box.height - .5) * 6));
    if (!frame.current) frame.current = requestAnimationFrame(easePointer);
  }

  function resetPointer() {
    if (!running || !finePointer) return;
    pointer.current.tx = 0; pointer.current.ty = 0;
    if (!frame.current) frame.current = requestAnimationFrame(easePointer);
  }

  return <div className="location-map" ref={ref} data-motion={running ? 'running' : 'paused'}>
    <div className="lm-toolbar">
      <span className="lm-eyebrow"><Globe2 size={15} aria-hidden="true" /> LOCATION</span>
      {!reducedMotion && <button className="lm-motion-control" type="button" onClick={() => setPaused(!paused)} aria-label={paused ? 'Play location animation' : 'Pause location animation'}>
        {paused ? <Play size={13} aria-hidden="true" /> : <Pause size={13} aria-hidden="true" />}<span>{paused ? 'Play motion' : 'Pause motion'}</span>
      </button>}
    </div>
    <div ref={stage} className="lm-stage" onPointerMove={movePointer} onPointerLeave={resetPointer}>
      <svg className="lm-svg" viewBox={compact ? '100 12 440 416' : MAP_VIEWBOX} role="img" aria-labelledby={id + '-title'} aria-describedby={id + '-description'}>
        <title id={id + '-title'}>Toronto, Canada</title>
        <desc id={id + '-description'}>A curved view of North America and the Great Lakes, with Toronto, Ontario, Canada highlighted.</desc>
        <defs>
          <clipPath id={id + '-sphere'}><circle cx={MAP_SPHERE.cx} cy={MAP_SPHERE.cy} r={MAP_SPHERE.radius} /></clipPath>
          <radialGradient id={id + '-ocean'} cx="32%" cy="25%" r="83%"><stop stopColor="#173c53" /><stop offset=".42" stopColor="#0c263d" /><stop offset=".78" stopColor="#071a2d" /><stop offset="1" stopColor="#030c1b" /></radialGradient>
          <linearGradient id={id + '-land'} x1="0" y1="0" x2=".8" y2="1"><stop stopColor="#39798a" /><stop offset=".4" stopColor="#24576d" /><stop offset="1" stopColor="#14354f" /></linearGradient>
          <radialGradient id={id + '-light'} cx="28%" cy="18%" r="80%"><stop stopColor="#a3e8f5" stopOpacity=".10" /><stop offset=".47" stopColor="#8ccfe7" stopOpacity=".025" /><stop offset=".75" stopColor="#020c1a" stopOpacity=".1" /><stop offset="1" stopColor="#020715" stopOpacity=".68" /></radialGradient>
          <linearGradient id={id + '-atmosphere'} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#b4f2ff" stopOpacity=".8" /><stop offset=".34" stopColor="#5db4d8" stopOpacity=".4" /><stop offset=".65" stopColor="#236793" stopOpacity=".12" /><stop offset="1" stopColor="#77c4e9" stopOpacity=".4" /></linearGradient>
          <linearGradient id={id + '-scan'}><stop stopColor="#a0eaff" stopOpacity="0" /><stop offset=".5" stopColor="#a0eaff" stopOpacity=".42" /><stop offset="1" stopColor="#a0eaff" stopOpacity="0" /></linearGradient>
          <radialGradient id={id + '-beacon'}><stop stopColor="#b2f6ff" stopOpacity=".65" /><stop offset=".3" stopColor="#55d2f5" stopOpacity=".24" /><stop offset="1" stopColor="#44bff1" stopOpacity="0" /></radialGradient>
          <radialGradient id={id + '-halo'}><stop offset=".79" stopColor="#3faee1" stopOpacity="0" /><stop offset=".88" stopColor="#4db2d8" stopOpacity=".09" /><stop offset=".93" stopColor="#3aa9e2" stopOpacity=".025" /><stop offset="1" stopColor="#3aa9e2" stopOpacity="0" /></radialGradient>
        </defs>
        <g className="lm-corners" aria-hidden="true"><path d="M111 46V27H130M510 27H529V46M111 394V413H130M510 413H529V394" /></g>
        <g className="lm-globe">
          <circle cx={MAP_SPHERE.cx} cy={MAP_SPHERE.cy} r={MAP_SPHERE.radius + 24} fill={`url(#${id}-halo)`} />
          <g className="lm-rim-ticks" aria-hidden="true">{rimTicks.map((tick, index) => <line key={index} x1={tick.x1} y1={tick.y1} x2={tick.x2} y2={tick.y2} className={tick.major ? 'is-major' : undefined} />)}</g>
          <circle cx={MAP_SPHERE.cx} cy={MAP_SPHERE.cy} r={MAP_SPHERE.radius + 2} fill="none" stroke={`url(#${id}-atmosphere)`} strokeWidth="1.3" />
          <g clipPath={`url(#${id}-sphere)`}>
            <circle cx={MAP_SPHERE.cx} cy={MAP_SPHERE.cy} r={MAP_SPHERE.radius} fill={`url(#${id}-ocean)`} />
            <path d={GRATICULE_PATH} className="lm-graticule lm-graticule-under" />
            <path d={LAND_PATH} fill={`url(#${id}-land)`} className="lm-land" />
            <path d={BORDERS_PATH} className="lm-borders" />
            <path d={LAKES_PATH} className="lm-lakes" />
            <path d={GRATICULE_PATH} className="lm-graticule lm-graticule-over" />
            <circle cx={MAP_SPHERE.cx} cy={MAP_SPHERE.cy} r={MAP_SPHERE.radius} fill={`url(#${id}-light)`} />
            <g className="lm-sweep" aria-hidden="true"><ellipse cx="320" cy="220" rx="80" ry="248" transform="rotate(-24 320 220)" fill="none" stroke={`url(#${id}-scan)`} strokeWidth="30" /></g>
          </g>
          <circle cx={MAP_SPHERE.cx} cy={MAP_SPHERE.cy} r={MAP_SPHERE.radius - .7} fill="none" stroke={`url(#${id}-atmosphere)`} strokeWidth=".75" />
          <g transform={`translate(${TORONTO_POINT.x} ${TORONTO_POINT.y})`} className="lm-marker">
            <circle r="22" fill={`url(#${id}-beacon)`} />
            <circle r="9" className="lm-beacon-ring lm-beacon-ring-one" />
            <circle r="9" className="lm-beacon-ring lm-beacon-ring-two" />
            <circle r="9" className="lm-beacon-ring lm-beacon-ring-three" />
            <circle r="8" className="lm-marker-halo" />
            <circle r="3.8" className="lm-marker-point" />
            <circle r="1.2" fill="white" />
          </g>
          <g className="lm-city-label" aria-hidden="true">
            <path d={`M${TORONTO_POINT.x + 7} ${TORONTO_POINT.y - 6}L389 160H413`} className="lm-label-leader" />
            <rect x="413" y="127" width="118" height="56" rx="8" className="lm-label-back" />
            <text x="426" y="150" className="lm-city">Toronto</text>
            <text x="427" y="169" className="lm-country">CANADA</text>
          </g>
        </g>
      </svg>
    </div>
    <div className="lm-footer">
      <div className="lm-place"><MapPin size={18} aria-hidden="true" /><p><span>Based in</span><strong>Toronto, Canada</strong></p></div>
      <div className="lm-local-time"><span>LOCAL TIME</span><time dateTime={clock.toISOString()} title="Toronto local time — America/Toronto">{torontoClock.format(clock)}</time></div>
    </div>
  </div>;
}
