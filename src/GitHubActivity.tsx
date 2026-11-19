import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import type { KeyboardEvent } from 'react';
import './github-activity.css';

type Day = { date: string; count: number; level: number };
type Snapshot = {
  updated_utc: string;
  from: string;
  through: string;
  total_contributions: number;
  active_days: number;
  days: Day[];
};

const RAW_SOURCE = 'https://raw.githubusercontent.com/PStar80/PStar80/output';
const COLORS = ['#14263a', '#17436b', '#2368ad', '#309be0', '#51d8ed'];
const SOURCE_LEVELS: Record<string, number> = {
  '#0B2030': 0, '#103E62': 1, '#1269A0': 2, '#109ED9': 3, '#25D6FF': 4,
};
const STEP = 14;
const LEFT = 34;
const TOP = 28;

function dateLabel(date: string, short = false) {
  return new Intl.DateTimeFormat('en-CA', {
    month: short ? 'short' : 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(`${date}T12:00:00Z`));
}

function snapshotTimestamp(value: string) {
  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(value)) return NaN;
  return Date.parse(`${value.replace(' ', 'T')}:00Z`);
}

function parseRemoteSnapshot(svg: string, metadata: unknown): Snapshot {
  if (!metadata || typeof metadata !== 'object') throw new Error('Missing contribution metadata');
  const meta = metadata as Snapshot & { calendar_days: number };
  if (
    !Number.isFinite(snapshotTimestamp(meta.updated_utc)) ||
    !Number.isSafeInteger(meta.calendar_days) || meta.calendar_days < 1 || meta.calendar_days > 400 ||
    !Number.isSafeInteger(meta.total_contributions) || meta.total_contributions < 0 ||
    !Number.isSafeInteger(meta.active_days) || meta.active_days < 0
  ) throw new Error('Invalid contribution metadata');

  const document = new DOMParser().parseFromString(svg, 'image/svg+xml');
  if (document.querySelector('parsererror')) throw new Error('Invalid contribution document');
  const days: Day[] = [];
  for (const title of document.querySelectorAll('rect > title')) {
    const match = title.textContent?.match(/^(\d{4}-\d{2}-\d{2}): (\d+) contributions?$/);
    if (!match) continue;
    const date = match[1];
    const count = Number(match[2]);
    const level = SOURCE_LEVELS[title.parentElement?.getAttribute('fill')?.toUpperCase() ?? ''];
    const timestamp = Date.parse(`${date}T00:00:00Z`);
    if (
      !Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== date ||
      !Number.isSafeInteger(count) || count < 0 || level === undefined
    ) throw new Error('Invalid daily contribution data');
    days.push({ date, count, level });
  }
  days.sort((a, b) => a.date.localeCompare(b.date));
  if (
    days.length !== meta.calendar_days ||
    days[0]?.date !== meta.from || days[days.length - 1]?.date !== meta.through ||
    days.reduce((sum, day) => sum + day.count, 0) !== meta.total_contributions ||
    days.filter(day => day.count > 0).length !== meta.active_days ||
    days.some((day, index) => index > 0 &&
      Date.parse(`${day.date}T00:00:00Z`) - Date.parse(`${days[index - 1].date}T00:00:00Z`) !== 86_400_000)
  ) throw new Error('Contribution snapshot does not match its metadata');
  return {
    updated_utc: meta.updated_utc, from: meta.from, through: meta.through,
    total_contributions: meta.total_contributions, active_days: meta.active_days, days,
  };
}

export default function GitHubActivity() {
  const id = useId();
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [failed, setFailed] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const positionedCalendar = useRef(false);
  const snapshotRef = useRef<Snapshot | null>(null);
  const activeRequest = useRef<AbortController | null>(null);
  const mounted = useRef(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshStatus, setRefreshStatus] = useState('');

  const refreshLatest = useCallback(async (manual: boolean) => {
    // A manual refresh supersedes an automatic refresh already in progress.
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    if (manual) {
      setRefreshing(true);
      setRefreshStatus('Checking GitHub for updated contributions…');
    }
    const timeout = window.setTimeout(() => controller.abort(), manual ? 10000 : 4500);
    try {
      const query = manual ? `?refresh=${Date.now()}` : '';
      const [svgResponse, metadataResponse] = await Promise.all([
        fetch(`${RAW_SOURCE}/engineering-activity-static.svg${query}`, { signal: controller.signal, cache: 'no-store' }),
        fetch(`${RAW_SOURCE}/engineering-activity.json${query}`, { signal: controller.signal, cache: 'no-store' }),
      ]);
      if (!svgResponse.ok || !metadataResponse.ok) throw new Error('GitHub activity source unavailable');
      const [svg, metadata] = await Promise.all([svgResponse.text(), metadataResponse.json()]);
      const latest = parseRemoteSnapshot(svg, metadata);
      if (!mounted.current || controller.signal.aborted) return;

      const previous = snapshotRef.current;
      if (!previous || snapshotTimestamp(latest.updated_utc) > snapshotTimestamp(previous.updated_utc)) {
        snapshotRef.current = latest;
        setSnapshot(latest);
        setActiveIndex(index => index === null ? null : Math.min(index, latest.days.length - 1));
        setFailed(false);
        if (manual) setRefreshStatus(`Updated from GitHub · ${latest.updated_utc} UTC`);
      } else {
        setFailed(false);
        if (manual) setRefreshStatus(`Already showing the latest published snapshot (${latest.updated_utc} UTC).`);
      }
    } catch {
      if (!mounted.current) return;
      if (manual) {
        setRefreshStatus(controller.signal.aborted
          ? 'GitHub activity refresh timed out. Please try again.'
          : 'Could not refresh GitHub activity. The last available snapshot is preserved.');
      } else if (!snapshotRef.current) {
        setFailed(true);
      }
    } finally {
      window.clearTimeout(timeout);
      if (activeRequest.current === controller) {
        activeRequest.current = null;
        if (manual && mounted.current) setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();
    async function loadActivity() {
      try {
        const response = await fetch('/assets/contributions.json', { signal: controller.signal });
        if (!response.ok) throw new Error('Activity snapshot unavailable');
        const local: Snapshot = await response.json();
        if (!Array.isArray(local.days) || !local.days.length) throw new Error('Empty activity snapshot');
        if (!controller.signal.aborted &&
            (!snapshotRef.current || snapshotTimestamp(local.updated_utc) > snapshotTimestamp(snapshotRef.current.updated_utc))) {
          snapshotRef.current = local;
          setSnapshot(local);
          setFailed(false);
        }
      } catch {
        if (controller.signal.aborted) return;
      }
      if (!controller.signal.aborted) void refreshLatest(false);
    }
    void loadActivity();
    return () => {
      mounted.current = false;
      controller.abort();
      activeRequest.current?.abort();
    };
  }, [refreshLatest]);

  useEffect(() => {
    if (!snapshot || positionedCalendar.current) return;
    const frame = requestAnimationFrame(() => {
      const calendar = calendarRef.current;
      if (!calendar || positionedCalendar.current) return;
      calendar.scrollLeft = Math.max(0, calendar.scrollWidth - calendar.clientWidth);
      positionedCalendar.current = true;
    });
    return () => cancelAnimationFrame(frame);
  }, [snapshot]);

  const layout = useMemo(() => {
    if (!snapshot) return null;
    const offset = new Date(`${snapshot.days[0].date}T12:00:00Z`).getUTCDay();
    const columns = Math.ceil((snapshot.days.length + offset) / 7);
    const months: { text: string; column: number; key: string }[] = [];
    snapshot.days.forEach((day, index) => {
      const date = new Date(`${day.date}T12:00:00Z`);
      if (index === 0 || date.getUTCDate() === 1) {
        months.push({
          text: date.toLocaleDateString('en-CA', { month: 'short', timeZone: 'UTC' }),
          column: Math.floor((index + offset) / 7), key: day.date,
        });
      }
    });
    return { offset, columns, months, width: LEFT + columns * STEP + 4 };
  }, [snapshot]);

  function exploreCalendar(event: KeyboardEvent<HTMLDivElement>) {
    if (!snapshot) return;
    const last = snapshot.days.length - 1;
    const current = activeIndex ?? last;
    const movement: Record<string, number> = {
      ArrowLeft: current - 7, ArrowRight: current + 7,
      ArrowUp: current - 1, ArrowDown: current + 1,
      Home: 0, End: last,
    };
    if (!(event.key in movement)) return;
    event.preventDefault();
    const next = Math.max(0, Math.min(last, movement[event.key]));
    setActiveIndex(next);
    event.currentTarget.querySelector(`[data-day="${next}"]`)
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  const selected = snapshot && activeIndex !== null ? snapshot.days[activeIndex] : null;

  return (
    <div className="gh-activity">
      <div className="gh-heading-row">
        <h3>Contribution Activity</h3>
        <button type="button" className="button button-primary gh-refresh-button" onClick={() => void refreshLatest(true)} disabled={refreshing} aria-label="Refresh GitHub contribution activity">
          <RefreshCw size={15} aria-hidden="true" />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
      {refreshStatus && <p className="gh-refresh-status" role="status" aria-live="polite">{refreshStatus}</p>}

      {!snapshot && (
        <p className="gh-load-state" role="status">
          {failed ? 'The activity snapshot is unavailable. Explore the profile on GitHub.' : 'Loading the contribution calendar…'}
        </p>
      )}

      {snapshot && layout && (
        <>
          <div className="gh-summary">
            <div><strong>{snapshot.total_contributions.toLocaleString('en-CA')}</strong><span>Contributions</span></div>
            <div><strong>{snapshot.active_days}</strong><span>Active Days</span></div>
            <p className="gh-date-range">{dateLabel(snapshot.from, true)}<br /><span aria-hidden="true">— </span>{dateLabel(snapshot.through, true)}</p>
          </div>

          <p id={`${id}-instructions`} className="gh-sr-only">
            Use the arrow keys to explore daily counts, or Home and End to jump to the first and last day.
            Left and right move by a week. Up and down move by a day.
          </p>
          <div
            ref={calendarRef}
            className="gh-calendar-scroll"
            role="group"
            aria-label="Explore the contribution calendar"
            aria-describedby={`${id}-instructions ${id}-selection`}
            tabIndex={0}
            onKeyDown={exploreCalendar}
            onPointerLeave={() => setActiveIndex(null)}
            onBlur={() => setActiveIndex(null)}
            onFocus={event => {
              // Reveal the last day for keyboard focus, not for a mouse click.
              if (event.currentTarget.matches(':focus-visible')) {
                setActiveIndex(index => index ?? snapshot.days.length - 1);
              }
            }}
          >
            <svg className="gh-calendar" viewBox={`0 0 ${layout.width} 132`} role="img" aria-label="PStar80 GitHub Contribution Calendar" aria-describedby={`${id}-description`}>
              <desc id={`${id}-description`}>
                {snapshot.total_contributions.toLocaleString('en-CA')} contributions on {snapshot.active_days} active days,
                from {dateLabel(snapshot.from)} to {dateLabel(snapshot.through)}. Brighter blue cells indicate more activity.
              </desc>
              {layout.months.map(month => (
                <text key={month.key} x={LEFT + month.column * STEP} y={13} className="gh-month-label">{month.text}</text>
              ))}
              {['Mon', 'Wed', 'Fri'].map((day, index) => (
                <text key={day} x={0} y={TOP + (index * 2 + 1) * STEP + 9} className="gh-weekday-label">{day}</text>
              ))}
              {snapshot.days.map((day, index) => {
                const x = LEFT + Math.floor((index + layout.offset) / 7) * STEP;
                const y = TOP + ((index + layout.offset) % 7) * STEP;
                return (
                  <rect
                    key={day.date} data-day={index} x={x} y={y} width={10} height={10} rx={2}
                    fill={COLORS[Math.max(0, Math.min(4, day.level))]}
                    className={activeIndex === index ? 'gh-day gh-day-selected' : 'gh-day'}
                    onPointerEnter={() => setActiveIndex(index)}
                    onClick={() => setActiveIndex(index)}
                  />
                );
              })}
            </svg>
          </div>

          <div className="gh-chart-footer">
            <p id={`${id}-selection`} className="gh-day-detail" aria-live="polite">
              {selected
                ? `${dateLabel(selected.date, true)} · ${selected.count} ${selected.count === 1 ? 'contribution' : 'contributions'}`
                : 'Hover or select a day to explore'}
            </p>
            <div className="gh-legend" aria-label="Color scale from less to more activity">
              <span>Less</span>
              {COLORS.map(color => <i key={color} style={{ backgroundColor: color }} aria-hidden="true" />)}
              <span>More</span>
            </div>
          </div>

          <div className="gh-source-row">
            <p>Snapshot Updated <time dateTime={`${snapshot.updated_utc.replace(' ', 'T')}:00Z`}>{snapshot.updated_utc} UTC</time></p>
          </div>
          <p className="gh-source-note">GitHub-reported aggregate counts. Visibility and refresh timing can differ from the native profile calendar.</p>
        </>
      )}
    </div>
  );
}
