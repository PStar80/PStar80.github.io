import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { BrainCircuit, Cloud, Code2, Database, FileCode2, FolderOpen, GitBranch, Layers3, Network, Pause, Play, UserRound, Workflow, X, type LucideIcon } from 'lucide-react';
import './process-flow.css';

type NodeId = 'cloud' | 'dropbox' | 'operator' | 'local' | 'app' | 'tools' | 'agents' | 'workflows' | 'files' | 'database' | 'git' | 'apis';
type GroupId = 'capabilities' | 'endpoints';
type Box = { x: number; y: number; width: number; height: number };
type FlowNode = { id: NodeId; title: string; subtitle: string; description: string; icon: LucideIcon; group?: GroupId };

const nodes: FlowNode[] = [
  { id: 'cloud', title: 'Cloud Agent', subtitle: 'Planning & design', description: 'Plans changes with the operator and supplies work artifacts through the Dropbox handoff.', icon: Cloud },
  { id: 'dropbox', title: 'Dropbox', subtitle: 'Artifact handoff', description: 'Carries the work artifacts from the cloud agent to the local agent.', icon: FolderOpen },
  { id: 'operator', title: 'Operator', subtitle: 'Human direction', description: 'Directs the work, initiates the local agent, and uses the application to follow execution and results.', icon: UserRound },
  { id: 'local', title: 'Local Agent', subtitle: 'Code & execution', description: 'Receives the handoff, works under the operator’s direction, and accesses the shared application services.', icon: Code2 },
  { id: 'app', title: 'React UI / Node.js Core API', subtitle: 'Shared application access', description: 'Connects the operator and local agent to the same execution capabilities through the application interface and core API.', icon: Layers3 },
  { id: 'tools', title: 'Registered Tools', subtitle: 'Focused operations', description: 'Reusable operations exposed through the shared execution layer. Tools, agents, and workflows connect to the grouped automation endpoints.', icon: FileCode2, group: 'capabilities' },
  { id: 'agents', title: 'Embedded AI Agents', subtitle: 'Adaptive reasoning', description: 'Configured agents contribute adaptive reasoning within the execution layer, alongside registered tools and published workflows.', icon: BrainCircuit, group: 'capabilities' },
  { id: 'workflows', title: 'Published Workflows', subtitle: 'Connected steps', description: 'Compose registered capabilities into repeatable execution paths with visible results.', icon: Workflow, group: 'capabilities' },
  { id: 'files', title: 'File System', subtitle: '', description: 'File operations are one of the endpoint types available through the shared execution layer.', icon: FolderOpen, group: 'endpoints' },
  { id: 'database', title: 'Database', subtitle: '', description: 'Database operations connect application execution to the underlying data systems.', icon: Database, group: 'endpoints' },
  { id: 'git', title: 'Git Repositories', subtitle: '', description: 'Repository operations connect development work to version-controlled source.', icon: GitBranch, group: 'endpoints' },
  { id: 'apis', title: 'Web APIs', subtitle: '', description: 'HTTP interfaces connect execution capabilities with application and external services.', icon: Network, group: 'endpoints' },
];

const routes: { id: string; from: NodeId | GroupId; to: NodeId | GroupId; desktop: string; mobile: string }[] = [
  { id: 'cloud-operator', from: 'cloud', to: 'operator', desktop: 'M240 100V150', mobile: 'M83 110V164' },
  { id: 'cloud-dropbox', from: 'cloud', to: 'dropbox', desktop: 'M390 62H730', mobile: 'M156 66H204' },
  { id: 'dropbox-local', from: 'dropbox', to: 'local', desktop: 'M880 100V150', mobile: 'M277 110V164' },
  { id: 'operator-local', from: 'operator', to: 'local', desktop: 'M390 188H730', mobile: 'M156 208H204' },
  { id: 'operator-app', from: 'operator', to: 'app', desktop: 'M240 226V245Q240 255 250 255H410Q420 255 420 265V284', mobile: 'M83 252V279Q83 289 93 289H102Q112 289 112 299V322' },
  { id: 'local-app', from: 'local', to: 'app', desktop: 'M880 226V245Q880 255 870 255H710Q700 255 700 265V284', mobile: 'M277 252V279Q277 289 267 289H258Q248 289 248 299V322' },
  { id: 'app-capabilities', from: 'app', to: 'capabilities', desktop: 'M560 364V408', mobile: 'M180 422V468' },
  { id: 'capabilities-endpoints', from: 'capabilities', to: 'endpoints', desktop: 'M560 528V572', mobile: 'M180 686V730' },
];

const desktop: Record<NodeId, Box> = {
  cloud: { x: 90, y: 24, width: 300, height: 76 }, dropbox: { x: 730, y: 24, width: 300, height: 76 },
  operator: { x: 90, y: 150, width: 300, height: 76 }, local: { x: 730, y: 150, width: 300, height: 76 },
  app: { x: 280, y: 284, width: 560, height: 80 },
  tools: { x: 40, y: 451, width: 336, height: 58 }, agents: { x: 392, y: 451, width: 336, height: 58 }, workflows: { x: 744, y: 451, width: 336, height: 58 },
  files: { x: 40, y: 611, width: 248, height: 44 }, database: { x: 304, y: 611, width: 248, height: 44 }, git: { x: 568, y: 611, width: 248, height: 44 }, apis: { x: 832, y: 611, width: 248, height: 44 },
};
const mobile: Record<NodeId, Box> = {
  cloud: { x: 10, y: 22, width: 146, height: 88 }, dropbox: { x: 204, y: 22, width: 146, height: 88 },
  operator: { x: 10, y: 164, width: 146, height: 88 }, local: { x: 204, y: 164, width: 146, height: 88 },
  app: { x: 20, y: 322, width: 320, height: 100 },
  tools: { x: 23, y: 510, width: 314, height: 48 }, agents: { x: 23, y: 566, width: 314, height: 48 }, workflows: { x: 23, y: 622, width: 314, height: 48 },
  files: { x: 23, y: 771, width: 150, height: 67 }, database: { x: 187, y: 771, width: 150, height: 67 }, git: { x: 23, y: 850, width: 150, height: 67 }, apis: { x: 187, y: 850, width: 150, height: 67 },
};

export default function ProcessFlow() {
  const ref = useRef<HTMLDivElement>(null);
  const id = 'flow-' + useId().replace(/:/g, '');
  const [hovered, setHovered] = useState<NodeId | null>(null);
  const [focused, setFocused] = useState<NodeId | null>(null);
  const [selected, setSelected] = useState<NodeId | null>(null);
  const [tabStop, setTabStop] = useState<NodeId>('operator');
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotion = () => setReducedMotion(media.matches);
    const syncVisibility = () => setPageVisible(document.visibilityState === 'visible');
    syncMotion(); syncVisibility();
    media.addEventListener('change', syncMotion);
    document.addEventListener('visibilitychange', syncVisibility);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0 });
    if (ref.current) observer.observe(ref.current);
    return () => { observer.disconnect(); media.removeEventListener('change', syncMotion); document.removeEventListener('visibilitychange', syncVisibility); };
  }, []);

  const active = hovered ?? focused ?? selected;
  const activeNode = nodes.find(node => node.id === active);
  const group = activeNode?.group;
  const connected = routes.filter(route => active && (route.from === active || route.to === active || route.from === group || route.to === group));
  const related = new Set(connected.flatMap(route => [route.from, route.to]));
  const running = visible && pageVisible && !paused && !reducedMotion;

  function navigate(event: KeyboardEvent<SVGGElement>, nodeId: NodeId) {
    setHovered(null);
    const index = nodes.findIndex(node => node.id === nodeId);
    let next: number | undefined;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % nodes.length;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index + nodes.length - 1) % nodes.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = nodes.length - 1;
    if (next !== undefined) {
      event.preventDefault();
      const nextId = nodes[next].id;
      setTabStop(nextId);
      event.currentTarget.closest('svg')?.querySelector<SVGGElement>(`[data-node="${nextId}"]`)?.focus();
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault(); setSelected(selected === nodeId ? null : nodeId);
    } else if (event.key === 'Escape') { setSelected(null); }
  }

  function renderDiagram(small: boolean) {
    const prefix = id + (small ? '-mobile' : '-desktop');
    const layout = small ? mobile : desktop;
    const groupBoxes: { id: GroupId; title: string; box: Box }[] = small ? [
      { id: 'capabilities', title: 'Execution Capabilities', box: { x: 8, y: 468, width: 344, height: 218 } },
      { id: 'endpoints', title: 'Automation Endpoints', box: { x: 8, y: 730, width: 344, height: 205 } },
    ] : [
      { id: 'capabilities', title: 'Execution Capabilities', box: { x: 20, y: 408, width: 1080, height: 120 } },
      { id: 'endpoints', title: 'Automation Endpoints', box: { x: 20, y: 572, width: 1080, height: 101 } },
    ];
    return <svg className={'pf-diagram ' + (small ? 'pf-mobile' : 'pf-desktop')} viewBox={small ? '0 0 360 949' : '0 0 1120 690'} role="group" aria-label="Development Process Flow — explore the connected architecture" aria-describedby={id + '-instructions'}>
      <defs>
        <linearGradient id={prefix + '-surface'} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#23364a" /><stop offset=".38" stopColor="#142438" /><stop offset="1" stopColor="#0c192a" /></linearGradient>
        <linearGradient id={prefix + '-operator'} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#2a4658" /><stop offset=".46" stopColor="#183044" /><stop offset="1" stopColor="#0d2032" /></linearGradient>
        <linearGradient id={prefix + '-core'} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#244765" /><stop offset=".42" stopColor="#16364f" /><stop offset="1" stopColor="#10253f" /></linearGradient>
        <linearGradient id={prefix + '-edge'} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#b0d9e8" stopOpacity=".72" /><stop offset=".3" stopColor="#5b8da5" stopOpacity=".35" /><stop offset=".65" stopColor="#233e59" stopOpacity=".5" /><stop offset="1" stopColor="#7aaabe" stopOpacity=".46" /></linearGradient>
        <linearGradient id={prefix + '-shine'}><stop stopColor="#d9f7ff" stopOpacity="0" /><stop offset=".4" stopColor="#a8ecff" stopOpacity=".8" /><stop offset="1" stopColor="#4fafff" stopOpacity="0" /></linearGradient>
        <linearGradient id={prefix + '-icon'} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#8adfff" stopOpacity=".12" /><stop offset="1" stopColor="#379df4" stopOpacity=".035" /></linearGradient>
        <marker id={prefix + '-arrow'} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1L7 4L1 7" fill="none" stroke="#70cbe9" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" /></marker>
        <filter id={prefix + '-glow'} filterUnits="userSpaceOnUse" x="0" y="0" width={small ? 360 : 1120} height={small ? 949 : 690}><feGaussianBlur stdDeviation="2.5" /></filter>
      </defs>

      <g aria-hidden="true" className="pf-connections">
        {routes.map((route, index) => {
          const path = small ? route.mobile : route.desktop;
          const emphasized = connected.includes(route);
          return <g className={'pf-route' + (emphasized ? ' is-connected' : '')} key={route.id} style={{ '--pf-delay': `${-index * 0.79}s` } as CSSProperties}>
            <path d={path} className="pf-route-halo" />
            <path d={path} className="pf-route-line" markerEnd={`url(#${prefix}-arrow)`} />
            <path d={path} pathLength="100" className="pf-trace pf-trace-glow" filter={`url(#${prefix}-glow)`} />
            <path d={path} pathLength="100" className="pf-trace pf-trace-tail" />
            <path d={path} pathLength="100" className="pf-trace pf-trace-tip" />
          </g>;
        })}
        {!small && <><text x="560" y="46" textAnchor="middle" className="pf-route-label">STRUCTURED HANDOFF</text><text x="560" y="172" textAnchor="middle" className="pf-route-label">INITIATE & DIRECT</text></>}
      </g>

      {groupBoxes.map(({ id: groupId, title, box }) => <g key={groupId} className={'pf-group' + (related.has(groupId) ? ' is-related' : '')} aria-hidden="true">
        <rect {...box} rx="14" className="pf-group-surface" />
        <path d={`M${box.x + 19} ${box.y + 1}H${box.x + box.width - 19}`} className="pf-group-rim" />
        <text x={box.x + (small ? 16 : 20)} y={box.y + 26} className="pf-group-title">{title}</text>
        {!small && <text x={box.x + box.width - 20} y={box.y + 26} className="pf-group-meta" textAnchor="end">{groupId === 'capabilities' ? 'REUSABLE CAPABILITIES' : 'CONNECTED SYSTEMS'}</text>}
      </g>)}

      {nodes.map(node => {
        const box = layout[node.id];
        const Icon = node.icon;
        const endpoint = node.group === 'endpoints';
        const capability = node.group === 'capabilities';
        const core = node.id === 'app';
        const stacked = small && !capability && !core;
        const iconSize = stacked ? 23 : endpoint ? 21 : capability ? 22 : 25;
        const iconX = box.x + (stacked ? 14 : endpoint ? 16 : capability ? 17 : 23);
        const iconY = box.y + (stacked ? 12 : (box.height - iconSize) / 2);
        const textX = stacked ? box.x + 14 : iconX + (endpoint ? 34 : capability ? 37 : 46);
        const titleY = stacked ? box.y + (endpoint ? 49 : 52) : core && small ? box.y + 31 : endpoint ? box.y + 28 : capability ? box.y + (small ? 21 : 25) : box.y + 32;
        const fill = node.id === 'operator' ? 'operator' : core ? 'core' : 'surface';
        return <g key={node.id} data-node={node.id} role="button" tabIndex={tabStop === node.id ? 0 : -1}
          aria-label={`${node.title}. ${node.description}`} aria-pressed={selected === node.id}
          className={'pf-node' + (active === node.id ? ' is-active' : '') + (related.has(node.id) ? ' is-related' : '') + (core ? ' pf-core' : '') + (endpoint ? ' pf-endpoint' : '') + (capability ? ' pf-capability' : '')}
          onMouseEnter={() => setHovered(node.id)} onMouseLeave={() => setHovered(null)}
          onFocus={() => { setHovered(null); setFocused(node.id); setTabStop(node.id); }} onBlur={() => setFocused(null)}
          onClick={() => { setSelected(selected === node.id ? null : node.id); setTabStop(node.id); }}
          onKeyDown={event => navigate(event, node.id)}>
          <rect x={box.x} y={box.y + 3} width={box.width} height={box.height} rx="11" className="pf-node-shadow" />
          <rect {...box} rx="11" className="pf-node-shell" fill={`url(#${prefix}-${fill})`} stroke={`url(#${prefix}-edge)`} />
          <rect x={box.x + 1} y={box.y + 1} width={box.width - 2} height={box.height - 2} rx="10" className="pf-node-inner" />
          <path d={`M${box.x + 14} ${box.y + .7}H${box.x + box.width - 14}`} className="pf-node-rim" stroke={`url(#${prefix}-shine)`} />
          {!stacked && !endpoint && <rect x={iconX - 9} y={iconY - 9} width={iconSize + 18} height={iconSize + 18} rx="10" className="pf-icon-tile" fill={`url(#${prefix}-icon)`} />}
          <Icon x={iconX} y={iconY} width={iconSize} height={iconSize} strokeWidth={1.65} className="pf-node-icon" aria-hidden="true" />
          <text x={textX} y={titleY} className="pf-node-title" aria-hidden="true">{core && small ? <><tspan x={textX}>React UI /</tspan><tspan x={textX} dy="23">Node.js Core API</tspan></> : node.title}</text>
          {node.subtitle && <text x={textX} y={core && small ? box.y + 77 : stacked ? box.y + 73 : capability ? box.y + (small ? 37 : 43) : box.y + 53} className="pf-node-subtitle" aria-hidden="true">{node.subtitle}</text>}
        </g>;
      })}
    </svg>;
  }

  return <div ref={ref} className="process-flow" data-motion={running ? 'running' : 'paused'} data-exploring={active ? 'true' : 'false'}>
    <div className="pf-toolbar">
      <span className="pf-eyebrow"><Network size={14} aria-hidden="true" /> CONNECTED BY DESIGN</span>
      {!reducedMotion && <button type="button" className="pf-motion-control" onClick={() => setPaused(!paused)} aria-label={paused ? 'Play flow animation' : 'Pause flow animation'}>{paused ? <Play size={13} aria-hidden="true" /> : <Pause size={13} aria-hidden="true" />}<span>{paused ? 'Play motion' : 'Pause motion'}</span></button>}
    </div>
    <p id={id + '-instructions'} className="pf-sr-only">An illustrative development architecture. Cloud Agent connects to Operator and Dropbox. Dropbox connects to Local Agent. Operator initiates Local Agent. Operator and Local Agent access React UI / Node.js Core API, which connects to the Execution Capabilities group, then the Automation Endpoints group. Use the arrow keys to explore nodes, Enter or Space to select one, and Escape to clear selection. Home and End move to the first and last node.</p>
    {renderDiagram(false)}
    {renderDiagram(true)}
    <div className={'pf-detail' + (activeNode ? ' is-active' : '')}>
      <span className="pf-detail-icon" aria-hidden="true">{activeNode ? <activeNode.icon size={21} /> : <Network size={21} />}</span>
      <div className="pf-detail-copy"><span className="pf-detail-title">{activeNode?.title ?? 'Explore the connections'}</span><p>{activeNode?.description ?? 'Point to a node or select it to see its role and connected paths.'}</p></div>
      {selected && <button type="button" className="pf-clear" onClick={() => {
        const previous = selected;
        setSelected(null);
        Array.from(ref.current?.querySelectorAll<SVGGElement>(`[data-node="${previous}"]`) ?? [])
          .find(element => element.getClientRects().length > 0)?.focus();
      }} aria-label="Clear selected node"><X size={17} aria-hidden="true" /></button>}
    </div>
  </div>;
}
