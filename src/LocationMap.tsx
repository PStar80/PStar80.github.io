import { memo, useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { ChevronDown, Map as MapIcon, MapPin, Pause, Play } from 'lucide-react';
import { MAP_VIEWBOX, MAP_COMPACT_VIEWBOX, LAND_PATH, BORDERS_PATH, LAKES_PATH, GRATICULE_PATH, TORONTO_POINT, COUNTRIES } from './location-map-data';
import './location-map.css';

const torontoClock = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Toronto', hour: 'numeric', minute: '2-digit', hour12: true, timeZoneName: 'short',
});

const countryById = new Map(COUNTRIES.map(country => [country.id, country]));
const countryOptions = [...COUNTRIES].sort((a, b) => a.name.localeCompare(b.name, 'en'));
const regionalOptions = countryOptions.filter(country => country.regional);
type PointerPosition = { x: number; y: number };
type SelectionGesture = PointerPosition & { pointerId: number; countryId: string | null; moved: boolean };

// These paths never change. Pointer movement only repositions the HTML label;
// changing countries updates a single highlight, not the full map geometry.
const CountryTargets = memo(function CountryTargets() {
  return <g className="lm-country-targets" aria-hidden="true">
    {COUNTRIES.map(country => <path key={country.id} d={country.path} data-country-id={country.id} className="lm-country-hit" fillRule="evenodd" />)}
  </g>;
});

function countryAt(target: EventTarget | null) {
  return target instanceof Element ? target.closest('[data-country-id]')?.getAttribute('data-country-id') ?? null : null;
}

export default function LocationMap() {
  const ref = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const tooltip = useRef<HTMLDivElement>(null);
  const pointer = useRef<PointerPosition | null>(null);
  const selectionGesture = useRef<SelectionGesture | null>(null);
  const id = 'location-' + useId().replace(/:/g, '');
  const [compact, setCompact] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hovering, setHovering] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [paused, setPaused] = useState(false);
  const [clock, setClock] = useState(() => new Date());
  const clockMinute = useRef(Math.floor(clock.getTime() / 60_000));
  const running = visible && pageVisible && !reducedMotion && !paused;
  const activeId = hovering ? hoveredId : selectedId;
  const activeCountry = activeId ? countryById.get(activeId) : undefined;
  const selectedCountry = selectedId ? countryById.get(selectedId) : undefined;

  const clearHover = useCallback(() => {
    pointer.current = null;
    setHoveredId(null);
    setHovering(false);
  }, []);

  const positionTooltip = useCallback((position: PointerPosition) => {
    const container = stage.current;
    const label = tooltip.current;
    if (!container || !label) return;
    const bounds = container.getBoundingClientRect();
    const x = position.x - bounds.left - container.clientLeft;
    const y = position.y - bounds.top - container.clientTop;
    const width = label.offsetWidth;
    const height = label.offsetHeight;
    const gap = 15;
    const inset = 10;
    const preferredX = x + gap + width > container.clientWidth - inset ? x - width - gap : x + gap;
    const preferredY = y + gap + height > container.clientHeight - inset ? y - height - gap : y + gap;
    const left = Math.max(inset, Math.min(preferredX, container.clientWidth - width - inset));
    const top = Math.max(inset, Math.min(preferredY, container.clientHeight - height - inset));
    label.style.setProperty('--lm-label-x', `${left}px`);
    label.style.setProperty('--lm-label-y', `${top}px`);
  }, []);

  useLayoutEffect(() => {
    if (hovering && pointer.current) positionTooltip(pointer.current);
  }, [activeId, hovering, positionTooltip]);

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const gesture = selectionGesture.current;
    if (gesture?.pointerId === event.pointerId && Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > 8) gesture.moved = true;
    if (event.pointerType === 'touch') return;
    if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
    pointer.current = { x: event.clientX, y: event.clientY };
    setHovering(true);
    setHoveredId(countryAt(event.target));
    positionTooltip(pointer.current);
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || event.button !== 0) { selectionGesture.current = null; return; }
    if (event.pointerType === 'touch') clearHover();
    selectionGesture.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, countryId: countryAt(event.target), moved: false };
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const gesture = selectionGesture.current;
    selectionGesture.current = null;
    if (!event.isPrimary || event.button !== 0 || !gesture || gesture.pointerId !== event.pointerId || gesture.moved || Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > 8) return;
    // A single pointer path handles clicks and taps. Hit-test the release to
    // respect touch capture, and ignore synthesized click events entirely.
    const target = document.elementFromPoint(event.clientX, event.clientY);
    if (!stage.current?.contains(target) || countryAt(target) !== gesture.countryId) return;
    clearHover();
    setSelectedId(current => current === gesture.countryId ? null : gesture.countryId);
  }

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncPreferences = () => setReducedMotion(motion.matches);
    const syncPage = () => {
      const isVisible = document.visibilityState === 'visible';
      setPageVisible(isVisible);
      if (!isVisible) { clearHover(); selectionGesture.current = null; }
    };
    const clearOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { clearHover(); setSelectedId(null); selectionGesture.current = null; }
    };
    syncPreferences(); syncPage();
    motion.addEventListener('change', syncPreferences);
    document.addEventListener('visibilitychange', syncPage);
    document.addEventListener('keydown', clearOnEscape);
    const intersection = new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting);
      if (!entry.isIntersecting) { clearHover(); selectionGesture.current = null; }
    });
    const resize = new ResizeObserver(([entry]) => {
      const isCompact = entry.contentRect.width < 700;
      setCompact(isCompact);
      clearHover();
      selectionGesture.current = null;
      setSelectedId(current => isCompact && current && !countryById.get(current)?.regional ? null : current);
    });
    if (ref.current) intersection.observe(ref.current);
    if (stage.current) resize.observe(stage.current);
    return () => {
      intersection.disconnect(); resize.disconnect();
      motion.removeEventListener('change', syncPreferences);
      document.removeEventListener('visibilitychange', syncPage);
      document.removeEventListener('keydown', clearOnEscape);
    };
  }, [clearHover]);

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
      <div className="lm-country-picker">
        <select aria-label="Explore countries" aria-controls={id + '-map'} value={selectedId ?? ''} onChange={event => {
          clearHover();
          setSelectedId(event.target.value || null);
        }}>
          <option value="">Explore countries</option>
          {(compact ? regionalOptions : countryOptions).map(country => <option key={country.id} value={country.id}>{country.name}</option>)}
        </select>
        <ChevronDown size={13} aria-hidden="true" />
      </div>
      {!reducedMotion && <button className="lm-motion-control" type="button" onClick={() => setPaused(!paused)} aria-label={paused ? 'Play location animation' : 'Pause location animation'}>
        {paused ? <Play size={13} aria-hidden="true" /> : <Pause size={13} aria-hidden="true" />}<span>{paused ? 'Play motion' : 'Pause motion'}</span>
      </button>}
    </div>
    <div ref={stage} className="lm-stage" onPointerEnter={handlePointerMove} onPointerMove={handlePointerMove} onPointerDown={handlePointerDown} onPointerUp={handlePointerUp} onPointerCancel={() => { selectionGesture.current = null; clearHover(); }} onPointerLeave={event => { if (event.pointerType !== 'touch') { selectionGesture.current = null; clearHover(); } }}>
      <svg id={id + '-map'} className="lm-svg" viewBox={compact ? MAP_COMPACT_VIEWBOX : MAP_VIEWBOX} role="img" aria-label={compact ? 'Map of North America highlighting Toronto, Canada' : 'World map highlighting Toronto, Canada'} aria-describedby={id + '-description'}>
        <desc id={id + '-description'}>{compact ? 'A flat map of North America and the Great Lakes, with Toronto, Ontario, Canada highlighted.' : 'A flat world map with a latitude and longitude grid, highlighting Toronto, Ontario, Canada beside the Great Lakes.'} Hover a country to see its name; click or tap to select it. Select it again to clear, or use the Explore countries selector above the map.</desc>
        <defs>
          <linearGradient id={id + '-ocean'} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#0d2438" /><stop offset="1" stopColor="#071625" /></linearGradient>
          <linearGradient id={id + '-land'} x1="0" y1="0" x2=".7" y2="1"><stop stopColor="#3486d7" /><stop offset=".55" stopColor="#2466b3" /><stop offset="1" stopColor="#153d78" /></linearGradient>
          <radialGradient id={id + '-ambient'} cx="28%" cy="25%" r="65%"><stop stopColor="#6fd7ef" stopOpacity=".1" /><stop offset="1" stopColor="#6fd7ef" stopOpacity="0" /></radialGradient>
          <linearGradient id={id + '-scan'}><stop stopColor="#9de9ff" stopOpacity="0" /><stop offset=".8" stopColor="#9de9ff" stopOpacity=".12" /><stop offset="1" stopColor="#9de9ff" stopOpacity="0" /></linearGradient>
          <radialGradient id={id + '-beacon'}><stop stopColor="#b2f6ff" stopOpacity=".65" /><stop offset=".3" stopColor="#55d2f5" stopOpacity=".24" /><stop offset="1" stopColor="#44bff1" stopOpacity="0" /></radialGradient>
        </defs>
        <rect width="1200" height="480" fill={`url(#${id}-ocean)`} />
        <path d={GRATICULE_PATH} className="lm-graticule lm-graticule-under" />
        <path d={LAND_PATH} fill={`url(#${id}-land)`} className="lm-land" />
        <path d={BORDERS_PATH} className="lm-borders" />
        <CountryTargets />
        {activeCountry && <path d={activeCountry.path} className="lm-country-highlight" fillRule="evenodd" vectorEffect="non-scaling-stroke" aria-hidden="true" />}
        <path d={LAKES_PATH} className="lm-lakes" />
        <path d={GRATICULE_PATH} className="lm-graticule lm-graticule-over" />
        <rect width="1200" height="480" fill={`url(#${id}-ambient)`} className="lm-ambient" />
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
      {activeCountry && <div ref={tooltip} className="lm-country-tooltip" data-anchor={hovering ? 'pointer' : 'selection'} aria-hidden="true">{activeCountry.name}</div>}
    </div>
    <span className="lm-sr-only" role="status">{selectedCountry ? `${selectedCountry.name} highlighted on the map.` : ''}</span>
    <div className="lm-footer">
      <div className="lm-place"><MapPin size={18} aria-hidden="true" /><p><span>Based in</span><strong>Toronto, Canada</strong></p></div>
      <div className="lm-local-time"><span>LOCAL TIME</span><time dateTime={clock.toISOString()} title="Toronto local time — America/Toronto">{torontoClock.format(clock)}</time></div>
    </div>
  </div>;
}
