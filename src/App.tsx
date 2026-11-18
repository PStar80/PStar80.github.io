import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from 'react';
import { ArrowUpRight, ArrowRight, ArrowDown, ArrowUp, Menu, X, Github, Linkedin, Mail, MapPin, Workflow, Database, ChartNoAxesCombined, BrainCircuit, Layers3, Code2, Cpu, Network, ShieldCheck, Expand, ChevronLeft, ChevronRight, Check, Copy, Box, ExternalLink, FileText } from 'lucide-react';
import GitHubActivity from './GitHubActivity';

const github = 'https://github.com/PStar80';
const linkedin = 'https://www.linkedin.com/in/paulsattaur/';
const email = 'paulsattaur@hotmail.com';

type Shot = { image: string; title: string; caption: string };
const skyShots: Shot[] = [
  { image: '02-command-center.jpg', title: 'Command Center', caption: 'An overview of tool and workflow activity, utilization, scheduling, and performance in the development environment.' },
  { image: '06-workflow-running.jpg', title: 'Workflow Execution', caption: 'A workflow in progress. The graph highlights a running node alongside earlier completed steps.' },
  { image: '04-infrastructure.jpg', title: 'Infrastructure', caption: 'Operational visibility across the services that power the automation environment.' },
  { image: '07-tool-structured-result.jpg', title: 'Structured Results', caption: 'A separate successful tool execution with its structured result available for inspection.' },
  { image: '08-run-agents.jpg', title: 'Run Agents', caption: 'The agent workspace, shown idle and ready for a configured run.' },
  { image: '09-agent-capabilities.jpg', title: 'Agent Capabilities', caption: 'The capability catalogue and assigned operations. The pictured historical test item is marked not verified at dispatch.' },
];
const macroShots: Shot[] = [
  { image: '02-macro-dashboard.png', title: 'MacroAnalyzer Dashboard', caption: 'The macroeconomic dashboard in the application, currently titled SkyWeb Analytics. Real development capture with time-series charts and summary indicators.' },
  { image: '11-dashboard-presentation.png', title: 'Dashboard Presentation', caption: 'The chart-focused presentation view for exploring macroeconomic indicators.' },
];
const nav = [
  ['Home', 'home'], ['About', 'about'], ['Projects', 'projects'], ['Process', 'process'], ['Activity', 'activity'],
];

function Metal({ children, className = '', id, style }: { children: ReactNode; className?: string; id?: string; style?: CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const animation = useRef<number>(0);
  const position = useRef({ x: 50, y: 50, tx: 50, ty: 50 });
  const active = useRef(false);
  useEffect(() => () => cancelAnimationFrame(animation.current), []);
  function update() {
    const p = position.current;
    p.x += (p.tx - p.x) * 0.16;
    p.y += (p.ty - p.y) * 0.16;
    ref.current?.style.setProperty('--mx', p.x + '%');
    ref.current?.style.setProperty('--my', p.y + '%');
    if (active.current && (Math.abs(p.tx - p.x) > .08 || Math.abs(p.ty - p.y) > .08)) animation.current = requestAnimationFrame(update);
    else animation.current = 0;
  }
  return <div ref={ref} id={id} style={style} className={'metal ' + className}
    onPointerMove={event => {
      if (event.pointerType !== 'mouse' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const rect = event.currentTarget.getBoundingClientRect();
      const p = position.current;
      p.tx = (event.clientX - rect.left) / rect.width * 100;
      p.ty = (event.clientY - rect.top) / rect.height * 100;
      active.current = true;
      if (!animation.current) animation.current = requestAnimationFrame(update);
    }}
    onPointerLeave={() => { active.current = false; cancelAnimationFrame(animation.current); animation.current = 0; }}>
    {children}
  </div>;
}

function Eyebrow({ children, number }: { children: ReactNode; number?: string }) {
  return <div className="eyebrow">{number && <span className="section-number">{number}</span>}<span className="eyebrow-line" />{children}</div>;
}
function Tag({ children }: { children: ReactNode }) { return <span className="tech-tag">{children}</span>; }
function EngineeringHighlight({ children }: { children: ReactNode }) {
  return <div className="engineering-highlight"><span className="micro">ENGINEERING HIGHLIGHT</span><p>{children}</p></div>;
}
function OutLink({ href, children, className = '' }: { href: string; children: ReactNode; className?: string }) {
  return <a className={className} href={href} target="_blank" rel="noreferrer">{children}</a>;
}

function Lightbox({ shots, index, onClose, onIndex }: { shots: Shot[]; index: number; onClose: () => void; onIndex: (i: number) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const shot = shots[index];
  useEffect(() => {
    const el = ref.current;
    const previous = document.activeElement as HTMLElement;
    const overflow = document.body.style.overflow;
    el?.showModal();
    document.body.style.overflow = 'hidden';
    return () => { el?.close(); document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  return <dialog ref={ref} className="lightbox" aria-labelledby="lightbox-title" onCancel={onClose}
    onClick={event => { if (event.target === event.currentTarget) onClose(); }}
    onKeyDown={event => {
      if (event.key === 'ArrowRight') { event.preventDefault(); onIndex((index + 1) % shots.length); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); onIndex((index - 1 + shots.length) % shots.length); }
    }}>
    <div className="lightbox-inner">
      <div className="lightbox-top"><div><span className="micro">{String(index + 1).padStart(2, '0')} / {String(shots.length).padStart(2, '0')}</span><h2 id="lightbox-title">{shot.title}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close image gallery"><X /></button></div>
      <img src={'/assets/' + shot.image} alt={shot.title} />
      <div className="lightbox-bottom"><p>{shot.caption}</p><div className="lightbox-actions">
        <a href={'/assets/' + shot.image} target="_blank" rel="noreferrer" className="icon-button" aria-label="Open original image"><ExternalLink size={18} /></a>
        {shots.length > 1 && <><button className="icon-button" aria-label="Previous image" onClick={() => onIndex((index - 1 + shots.length) % shots.length)}><ChevronLeft /></button><button className="icon-button" aria-label="Next image" onClick={() => onIndex((index + 1) % shots.length)}><ChevronRight /></button></>}
      </div></div>
    </div>
  </dialog>;
}

function DataIllustration() {
  return <div className="data-illustration" aria-label="Conceptual data flow from trusted data through transformation to an analytical product">
    <div className="data-illustration-top"><span><Database size={14} /> SKY DATA STUDIO</span><span className="micro">CONCEPTUAL DATA FLOW</span></div>
    <div className="data-orbit orbit-one" /><div className="data-orbit orbit-two" />
    <div className="data-flow">
      <div className="data-node"><Database /><span>Trusted Data</span></div><div className="data-path"><span /></div>
      <div className="data-node transform-node"><Layers3 /><span>Transform</span></div><div className="data-path"><span /></div>
      <div className="data-node"><Box /><span>Data Product</span></div>
    </div>
    <div className="data-proof"><span><Network size={13} /> Lineage</span><span><ShieldCheck size={13} /> Quality</span><span><Code2 size={13} /> dbt Models</span></div>
  </div>;
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState('home');
  const progressRef = useRef<HTMLDivElement>(null);
  const [shotIndex, setShotIndex] = useState(0);
  const [gallery, setGallery] = useState<{ shots: Shot[]; index: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const menuRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const target = window.location.hash.slice(1);
    if (!target) return;
    const frame = requestAnimationFrame(() => document.getElementById(target)?.scrollIntoView({ behavior: 'instant', block: 'start' }));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${progress})`;
      let current = 'home';
      for (const id of ['home', 'about', 'projects', 'process', 'activity', 'contact']) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top < window.innerHeight * .35) current = id;
      }
      setActive(current);
    };
    const scroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update(); window.addEventListener('scroll', scroll, { passive: true }); window.addEventListener('resize', scroll);
    return () => { window.removeEventListener('scroll', scroll); window.removeEventListener('resize', scroll); cancelAnimationFrame(frame); };
  }, []);
  useEffect(() => () => clearTimeout(copyTimer.current), []);
  useEffect(() => {
    function onEscape(event: KeyboardEvent) { if (event.key === 'Escape' && menuOpen) { setMenuOpen(false); menuRef.current?.focus(); } }
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [menuOpen]);

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true); setCopyFailed(false);
      clearTimeout(copyTimer.current); copyTimer.current = setTimeout(() => setCopied(false), 2600);
    } catch { setCopyFailed(true); }
  }

  return <>
    <a className="skip-link" href="#main">Skip To Content</a>
    <header className="site-header">
      <div ref={progressRef} className="scroll-progress" style={{ transform: 'scaleX(0)' }} aria-hidden="true" />
      <div className="container header-inner">
        <a href="#home" className="brand" aria-label="Paul Sattaur home" onClick={() => setMenuOpen(false)}><span className="brand-mark">PS<span>.</span></span><span className="brand-name">Paul Sattaur<span>ENGINEER & BUILDER</span></span></a>
        <button ref={menuRef} className="menu-toggle icon-button" aria-expanded={menuOpen} aria-controls="main-navigation" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
        <nav id="main-navigation" className={menuOpen ? 'navigation is-open' : 'navigation'} aria-label="Main navigation">
          {nav.map(([label, id]) => <a key={id} href={'#' + id} className={active === id ? 'active' : ''} aria-current={active === id ? 'location' : undefined} onClick={() => setMenuOpen(false)}>{label}</a>)}
          <a href="#contact" className="nav-contact" onClick={() => setMenuOpen(false)}>Let's Talk <ArrowUpRight size={15} /></a>
        </nav>
      </div>
    </header>
    <main id="main">
      <section className="opaque hero-section" id="home" aria-labelledby="hero-title">
        <div className="hero-ambient" aria-hidden="true" />
        <div className="container">
          <div className="hero-grid">
            <div className="hero-copy">
              <div className="availability"><span /> FULL-STACK SOFTWARE ENGINEER</div>
              <h1 id="hero-title">Paul{' '}<br /><span>Sattaur.</span></h1>
              <p className="hero-statement">Connected Systems.<br />Intelligent Experiences.</p>
              <p className="hero-description">I build applications that bring automation, data, and AI together—from the interface to the infrastructure.</p>
              <div className="hero-actions"><a href="#projects" className="button button-primary">Explore My Work <ArrowUpRight size={19} /></a><a href="#contact" className="button button-quiet">Get In Touch <ArrowRight size={18} /></a></div>
              <div className="hero-social"><OutLink href={github} className="social-link"><Github size={18} /><span>GitHub</span></OutLink><OutLink href={linkedin} className="social-link"><Linkedin size={18} /><span>LinkedIn</span></OutLink><span className="social-divider" /><span className="location"><MapPin size={15} /> Greater Toronto Area, Canada</span></div>
            </div>
            <div className="portrait-composition">
              <div className="portrait-frame">
                <div className="portrait-corner corner-top" /><div className="portrait-corner corner-bottom" />
                <img className="portrait-image" src="/assets/portrait-current.png" alt="Paul Sattaur's blue cybernetic profile portrait" width="460" height="460" fetchPriority="high" />
                <div className="portrait-caption"><span><span className="tiny-square" /> HUMAN IN THE LOOP</span><Code2 size={20} /></div>
              </div>
              <div className="portrait-foot"><span>FULL STACK. FORWARD THINKING.</span><span>01 / PS</span></div>
            </div>
          </div>
          <div className="focus-strip" aria-label="Areas of focus">
            {[{ icon: Workflow, title: 'Workflow Automation' }, { icon: Database, title: 'Data Engineering' }, { icon: ChartNoAxesCombined, title: 'Data Visualization' }, { icon: BrainCircuit, title: 'AI-Native Applications' }].map(({ icon: Icon, title }) => <div className="focus-item" key={title}><Icon size={20} /><span>{title}</span></div>)}
          </div>
          <div className="hero-scroll"><a href="#about"><span>SCROLL TO EXPLORE</span><ArrowDown size={14} /></a><span>DESIGNED WITH PURPOSE · BUILT WITH PRECISION</span></div>
        </div>
      </section>

      <section className="opaque about-section" id="about" aria-labelledby="about-title">
        <div className="container about-grid">
          <div><Eyebrow number="01">The Builder</Eyebrow><h2 id="about-title">From Interface{' '}<br />To <span className="text-accent">Infrastructure.</span></h2></div>
          <div className="about-copy"><p>I’m a software engineer who enjoys connecting the pieces: thoughtful interfaces, dependable services, and the data that makes them useful.</p><p>My work spans three full-stack applications—workflow automation with <strong>SkyCommand</strong>, data engineering with <strong>SkyDataStudio</strong>, and interactive analytics with <strong>MacroAnalyzer</strong>. Today, I’m bringing agentic AI into that ecosystem through embedded agents, MCP connections, and observable workflows.</p><div className="about-foot"><span>USER EXPERIENCE</span><span className="small-cross">+</span><span>SYSTEMS THINKING</span><span className="small-cross">+</span><span>AI</span></div></div>
        </div>
      </section>

      <section className="scenic expertise-section" id="expertise" aria-labelledby="expertise-title">
        <div className="scenic-backdrop cybernetic-backdrop" aria-hidden="true" /><div className="scenic-shade" aria-hidden="true" />
        <div className="container">
          <div className="scenic-heading"><Eyebrow number="02">Engineering Focus</Eyebrow><h2 id="expertise-title">Three Lanes.<br /><span className="text-accent">One Connected Vision.</span></h2><p>Full-stack thinking, from a single interaction<br className="desktop-break" /> to the systems working behind it.</p></div>
          <div className="expertise-grid">
            <Metal className="expertise-card"><div className="card-icon"><Workflow /></div><span className="card-index">01</span><h3>Automation & AI</h3><p>Durable workflows, reusable tools, and AI agents connected through clear interfaces and observable execution.</p><div className="tags"><Tag>Node.js</Tag><Tag>Temporal</Tag><Tag>MCP</Tag></div><a className="card-foot" href="#project-skycommand">SkyCommand <ArrowDown size={15} /></a></Metal>
            <Metal className="expertise-card"><div className="card-icon"><Database /></div><span className="card-index">02</span><h3>Data Engineering</h3><p>Trusted data shaped into analytical products through versioned pipelines, transformations, quality, and lineage.</p><div className="tags"><Tag>Python</Tag><Tag>Airflow</Tag><Tag>dbt</Tag></div><a className="card-foot" href="#project-skydatastudio">SkyDataStudio <ArrowDown size={15} /></a></Metal>
            <Metal className="expertise-card"><div className="card-icon"><ChartNoAxesCombined /></div><span className="card-index">03</span><h3>Interactive Experiences</h3><p>Clear interfaces and explorable visualizations that make complex data useful to the person on the other side.</p><div className="tags"><Tag>React</Tag><Tag>ASP.NET Core</Tag><Tag>ECharts</Tag></div><a className="card-foot" href="#project-macroanalyzer">MacroAnalyzer <ArrowDown size={15} /></a></Metal>
          </div>
          <div className="expertise-note"><BrainCircuit size={18} /><span>AI-Native Applications</span><span className="note-rule" /><p>Adaptive intelligence, connected to practical software.</p></div>
        </div>
      </section>

      <section className="opaque projects-section" id="projects" aria-labelledby="projects-title">
        <div className="container">
          <div className="section-header"><div><Eyebrow number="03">Selected Work</Eyebrow><h2 id="projects-title">Built To <span className="text-accent">Do More.</span></h2></div><p>Three applications. A connected ecosystem<br />for work, data, and insight.</p></div>
          <Metal className="featured-project" id="project-skycommand">
            <div className="featured-overview">
              <div className="project-copy"><span className="featured-label"><span /> FEATURED APPLICATION</span><h3>SkyCommand<span className="gold-dot">.</span></h3><p className="project-category">Workflow Automation & Agentic AI</p><p>Build workflows. Run agents.{' '}<br /><strong>Understand every result.</strong></p><p className="project-description">A full-stack platform bringing reusable tools, durable workflows, and AI agents into one operational interface. Coding agents can also use SkyCommand directly through MCP.</p><EngineeringHighlight>I built shared execution services for the React interface and MCP-connected coding agents, with embedded-agent capabilities scoped by project and agent version. Reusing registered tools and workflows keeps operations consistent and their results inspectable.</EngineeringHighlight><div className="tags"><Tag>React</Tag><Tag>Node.js</Tag><Tag>PostgreSQL</Tag><Tag>Temporal</Tag></div><OutLink href={github + '/SkyCommand-Demo'} className="text-link gold-link">Explore The Public Showcase <ArrowUpRight size={17} /></OutLink><span className="project-source-note">Public Showcase · Private Implementation</span></div>
              <div className="project-screen">
                <div className="window-bar"><span className="window-dots"><i /><i /><i /></span><span>SKYCOMMAND / {skyShots[shotIndex].title.toUpperCase()}</span><button className="icon-button" aria-label="Enlarge SkyCommand screenshot" onClick={() => setGallery({ shots: skyShots, index: shotIndex })}><Expand size={15} /></button></div>
                <button className="screenshot-button" onClick={() => setGallery({ shots: skyShots, index: shotIndex })} aria-label={'View ' + skyShots[shotIndex].title + ' screenshot'}><img src={'/assets/' + skyShots[shotIndex].image} alt={skyShots[shotIndex].title + ' — real SkyCommand interface'} loading="lazy" /><span className="image-expand"><Expand size={16} /> View Screenshot</span></button>
                <div className="screen-tabs" role="tablist" aria-label="SkyCommand screenshot views">
                  {skyShots.slice(0, 3).map((shot, i) => <button key={shot.title} role="tab" aria-selected={shotIndex === i} aria-controls="sky-screen-caption" tabIndex={shotIndex === i ? 0 : -1} onClick={() => setShotIndex(i)} onKeyDown={event => {
                    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                      const n = (i + (event.key === 'ArrowRight' ? 1 : 2)) % 3; setShotIndex(n);
                      (event.currentTarget.parentElement?.children[n] as HTMLElement)?.focus();
                    }
                  }}>{shot.title}</button>)}
                </div>
                <p id="sky-screen-caption" className="screenshot-caption" role="tabpanel">{skyShots[shotIndex].caption}</p>
              </div>
            </div>
            <div className="featured-bottom"><div><span><Workflow size={15} /> Durable Workflows</span><span><BrainCircuit size={15} /> AI Agents</span><span><Network size={15} /> MCP Access</span></div><button onClick={() => setGallery({ shots: skyShots, index: shotIndex })}>Browse The Gallery <ArrowRight size={16} /></button></div>
          </Metal>
          <div className="companion-grid">
            <Metal className="companion-project data-project" id="project-skydatastudio">
              <DataIllustration />
              <div className="companion-body"><span className="project-kicker">DATA ENGINEERING</span><h3>SkyDataStudio</h3><p>A workbench for turning trusted data into governed analytical products, with versioned pipelines, dbt transformations, data quality, and traceable lineage.</p><EngineeringHighlight>I built versioned pipelines that consume SkyCommand’s data contracts, record evidence for each step, and reuse existing runs on replay. Airflow orchestrates the same execution engine, while dbt checks and lineage make transformations and downstream dependencies inspectable.</EngineeringHighlight><div className="tags"><Tag>React</Tag><Tag>Python / FastAPI</Tag><Tag>Airflow</Tag><Tag>dbt</Tag></div><OutLink href={github + '/SkyDataStudio'} className="text-link">Explore The Repository <ArrowUpRight size={17} /></OutLink></div>
            </Metal>
            <Metal className="companion-project macro-project" id="project-macroanalyzer">
              <button className="screenshot-button macro-image" onClick={() => setGallery({ shots: macroShots, index: 0 })} aria-label="View MacroAnalyzer dashboard screenshot"><img src="/assets/02-macro-dashboard.png" alt="MacroAnalyzer's SkyWeb Analytics dashboard with macroeconomic time-series charts" loading="lazy" /><span className="image-expand"><Expand size={16} /> View Dashboard</span></button>
              <div className="companion-body"><span className="project-kicker">INTERACTIVE ANALYTICS</span><h3>MacroAnalyzer</h3><p>A full-stack macroeconomic analytics application with interactive time-series charts, personalized dashboards, saved views, alert rules, and in-app signals.</p><EngineeringHighlight>I paired interactive React charts with a dedicated ASP.NET Core API, migrating analytics and account routes into native C# services. Alert evaluation remains in the operational control plane, keeping the analytics experience separate from ingestion and automation.</EngineeringHighlight><div className="tags"><Tag>React</Tag><Tag>C# / ASP.NET Core</Tag><Tag>PostgreSQL</Tag><Tag>ECharts</Tag></div><OutLink href={github + '/MacroAnalyzer'} className="text-link">Explore The Repository <ArrowUpRight size={17} /></OutLink></div>
            </Metal>
          </div>
          <div className="projects-footer"><OutLink href={github + '?tab=repositories'} className="text-link muted-link"><Github size={18} /> View All Repositories <ArrowUpRight size={16} /></OutLink></div>
        </div>
      </section>

      <section className="opaque process-section" id="process" aria-labelledby="process-title">
        <div className="container">
          <div className="section-header"><div><Eyebrow number="04">How I Build</Eyebrow><h2 id="process-title">Development <span className="text-accent">Process Flow.</span></h2></div><p>Human direction. Connected agents.<br />Visible execution.</p></div>
          <Metal className="process-panel">
            <picture><source media="(max-width: 680px)" srcSet="/assets/process-mobile.svg" /><img src="/assets/process.svg" alt="Development Process Flow: Cloud Agent connects to Operator and Dropbox. Dropbox connects to Local Agent, initiated by Operator. Operator and Local Agent access React UI / Node.js Core API. Execution Capabilities contain Registered Tools, Embedded AI Agents and Published Workflows. Automation Endpoints contain File System, Database, Git Repositories and Web APIs." loading="lazy" /></picture>
          </Metal>
          <div className="process-notes"><p>Cloud planning and a local coding agent work through structured handoffs. I direct the work, define its scope, and follow the results across application services.</p><OutLink href={github + '/SkyCommand-Demo/blob/main/docs/architecture.md'} className="text-link">Explore The Architecture <ArrowUpRight size={17} /></OutLink></div>
        </div>
      </section>

      <section className="scenic activity-section" id="activity" aria-labelledby="activity-title">
        <div className="scenic-backdrop neural-backdrop" aria-hidden="true" /><div className="scenic-shade activity-shade" aria-hidden="true" />
        <div className="container">
          <div className="scenic-heading"><Eyebrow number="05">Work In Motion</Eyebrow><h2 id="activity-title">Building.<br /><span className="text-accent">One Commit At A Time.</span></h2><p>A window into the work behind the applications.</p></div>
          <div className="activity-grid">
            <Metal className="github-profile"><img src="/assets/portrait-current.png" alt="" width="80" height="80" loading="lazy" /><h3>PStar80</h3><span>Paul Sattaur</span><p>Full-stack applications.<br />Agentic automation.<br />A habit of building.</p><OutLink href={github} className="button button-quiet"><Github size={17} /> GitHub Profile <ArrowUpRight size={16} /></OutLink></Metal>
            <Metal className="activity-panel"><GitHubActivity /></Metal>
          </div>
        </div>
      </section>

      <section className="opaque experience-section" aria-labelledby="experience-title">
        <div className="container experience-grid">
          <div><Eyebrow number="06">Engineering Background</Eyebrow><h2 id="experience-title">Built On{' '}<br /><span className="text-accent">Real Experience.</span></h2><p className="experience-intro">Enterprise problem solving meets independent product development.</p></div>
          <div className="experience-list">
            <div className="experience-entry"><span className="experience-marker"><Layers3 size={19} /></span><div><span className="micro">INDEPENDENT DEVELOPMENT</span><h3>Full-Stack Applications & Agentic AI</h3><p>Designing and building SkyCommand, SkyDataStudio, and MacroAnalyzer—from interactive interfaces to APIs, data services, and containerized infrastructure.</p><div className="experience-tech">React / TypeScript / Node.js / Python / C# / PostgreSQL</div></div></div>
            <div className="experience-entry"><span className="experience-marker"><Database size={19} /></span><div><span className="micro">ENTERPRISE FOUNDATION</span><h3>Senior Programmer Analyst</h3><p className="experience-role">CAAT Pension Plan · Toronto <span className="experience-dates">2022–2025</span></p><p>Led systems analysis and data-workflow delivery for GROWTHplus, translating pension business rules into Oracle PL/SQL processing and integrations. Worked with business, development, and QA teams through validation, release, and production support.</p><div className="experience-tech">Oracle / SQL & PL/SQL / Java / Systems Analysis</div></div></div>
            <div className="experience-actions"><OutLink href={linkedin} className="text-link experience-link">View My Professional Background <ArrowUpRight size={17} /></OutLink><OutLink href="/assets/paul-sattaur-resume.pdf" className="button button-quiet"><FileText size={17} /> View Résumé (PDF) <ArrowUpRight size={16} /></OutLink></div>
          </div>
        </div>
      </section>

      <section className="opaque contact-section" id="contact" aria-labelledby="contact-title">
        <div className="container">
          <div className="contact-heading"><Eyebrow number="07">Start A Conversation</Eyebrow><h2 id="contact-title">Let’s Build<br /><span className="text-accent">Something That Matters.</span></h2><p>Have a role, a project, or a system worth improving?<br />I’d like to hear about it.</p><a href={'mailto:' + email} className="button button-primary">Get In Touch <ArrowUpRight size={20} /></a></div>
          <div className="contact-grid">
            <Metal className="contact-card"><Mail size={22} /><div><span className="micro">EMAIL</span><a href={'mailto:' + email}>{email}</a></div><button className="icon-button" aria-label={copied ? 'Email copied' : 'Copy email address'} onClick={copyEmail}>{copied ? <Check size={17} /> : <Copy size={17} />}</button></Metal>
            <Metal className="contact-card"><Linkedin size={22} /><div><span className="micro">LINKEDIN</span><OutLink href={linkedin}>Let’s Connect</OutLink></div><ArrowUpRight size={18} /></Metal>
            <Metal className="contact-card"><Github size={22} /><div><span className="micro">GITHUB</span><OutLink href={github}>Explore PStar80</OutLink></div><ArrowUpRight size={18} /></Metal>
          </div>
          <div className="copy-status" aria-live="polite">{copied ? 'Email address copied.' : copyFailed ? 'Please select and copy the email address above.' : ''}</div>
        </div>
      </section>
    </main>
    <footer className="site-footer"><div className="container footer-inner"><a href="#home" className="footer-brand">Paul Sattaur<span>.</span></a><p>Built With Intent. Always Evolving.</p><span>© {new Date().getFullYear()} Paul Sattaur</span><a href="#home" className="back-top" aria-label="Back to top"><ArrowUp size={17} /></a></div></footer>
    {gallery && <Lightbox shots={gallery.shots} index={gallery.index} onClose={() => setGallery(null)} onIndex={index => setGallery({ ...gallery, index })} />}
  </>;
}
