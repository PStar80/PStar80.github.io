# Portfolio Review Checkpoint

The contact-card and experience-timeline update was verified on the published [portfolio](https://pstar80.github.io/) on **November 18, 2026 (Toronto)**.

- Main changes: [beaafce](https://github.com/PStar80/PStar80.github.io/commit/beaafced611a73d8dbe14da0e162acc24a75ad3a)
- Short-viewport navigation fix: [ddf8f47](https://github.com/PStar80/PStar80.github.io/commit/ddf8f4738124274312a7c50fb212418ba93482b0)
- Final GitHub Pages build and deployment: [successful run](https://github.com/PStar80/PStar80.github.io/actions/runs/44256868248)

## Contact And Experience Release Checks

| Area | Observed result |
| --- | --- |
| Production build | TypeScript and Vite passed after the final CSS fix. JavaScript is 79.49 KB gzip and CSS is 12.20 KB gzip. No new dependencies. |
| Contact targets | A point near the outer top-left corner of every card resolved to its native email, LinkedIn, or GitHub anchor. The copy-button center resolved to the separate button; there are no buttons nested inside anchors. |
| Contact alignment | Redundant service-name labels are removed. Text and icon centers align within one CSS pixel on desktop, and all three cards render cleanly in the single-column narrow layout. |
| Copy email | Clicking Copy displayed the success message and left the current page in place. Pasting into the browser address field visibly produced the expected email address; no email or search was sent. |
| Keyboard controls | Shift+Tab from Copy reached the email link and its 2px inset full-card focus outline. Tab returned to Copy as a separate control. |
| Experience navigation | The new link reaches #experience and becomes the active navigation item. The tablet-width header has room for the added link without overlap. |
| Timeline | Four entries use the supplied year ranges: independent development 2025–Present, CAAT 2022–2025, The RecordKeeper 2014–2019, CPAS 2011–2013. All role-title/icon centers align on desktop and narrow layouts. Three connectors join the four markers, with no trailing connector. |
| Responsive layout | Document scroll width matched client width at 1348px, 674px, and 337px. Narrow layouts were checked using ordinary browser zoom. |
| Short-screen menu | At a 337px content width and 234px viewport height, the expanded menu initially extended below the viewport. It now scrolls within the available height. Experience and Let's Talk were both selected successfully, and each selection closed the menu. |
| Resume removal | Both resume links and the separate professional-background link are removed. The public PDF and its generator are removed from the current source. The old PDF URL returned GitHub Pages 404 / File not found. |
| Source documents | Supplied career files were used to ground concise summaries and dates. Neither the DOCX nor the info module was copied into the repository or production build. |

Screenshots:

- [Contact cards and navigation](previews/contact-refined-20261118.jpg)
- [Four-entry experience timeline](previews/experience-timeline-20261118.jpg)
- [Narrow experience and contact layout](previews/experience-contact-mobile-20261118.jpg)

The narrow checks used Chromium zoom, not a physical phone or Safari. Resume removal applies to the current source and deployed site; historical Git commits were not rewritten. Earlier release checks below are retained as dated checkpoints and were not all repeated for this update.

## Previous Visual Release

The interactive process and capability-card release was verified on the published [pstar80.github.io](https://pstar80.github.io/) site on **November 18, 2026 (Toronto)**.

- Implementation: [602a8c7](https://github.com/PStar80/PStar80.github.io/commit/602a8c73694349a4240e8d2b2830854a5c567cc0)
- GitHub Pages: [successful build and deployment](https://github.com/PStar80/PStar80.github.io/actions/runs/44245916629)

### Visual Release Checks — November 18, 2026

| Area | Observed Result |
| --- | --- |
| Production build | TypeScript checking and Vite production build pass. Generated JavaScript is 79.28 KB gzip and CSS is 12.14 KB gzip. No dependencies were added. |
| Published site | The successful GitHub Pages deployment was checked on the public site. Both the new home cards and interactive process component are present. |
| Home capability cards | Four full-card links use the existing metallic pointer reflection. The Data Engineering hover was observed with pointer coordinates updating, the light visible, and the card lifting 3px. |
| Card destinations | Workflow Automation links to SkyCommand; Data Engineering to SkyDataStudio; Data Visualization to MacroAnalyzer; AI-Native Applications to the process. The AI card was clicked and reached the process section. |
| Desktop layout | The home and process sections were visually reviewed. Document scroll width and client width both measured 1348px. Exactly one diagram layout was visible. |
| Process relationships | The original eight directed relationships remain present in the shared graph and both layouts. Selecting Operator highlights its three connected routes and displays its description. |
| Process motion | Directional trace offsets changed while running. Pause stopped the offsets across separate observations, and Play resumed them. Motion paused after scrolling the diagram offscreen. |
| Keyboard controls | Tab entered the current diagram node; ArrowRight moved to Local Agent and updated the details; Enter selected it. Clearing the selection returned focus to the same visible node. |
| Narrow layout and zoom | Chromium at 400% browser zoom produced a 337px content viewport. The home cards became one column and the vertical process SVG appeared. Scroll width equaled client width at 337px. Selecting Operator in the narrow layout displayed its details and three connected routes. Zoom was restored afterward. |
| Supporting improvements | At this checkpoint, the hero linked to a résumé PDF (removed in the subsequent contact/experience release). The architecture link has an outlined button treatment and project-image enlargement labels remain visible. |

Current screenshots:

- [Home capability cards](previews/capability-cards-20261118.jpg)
- [Desktop process](previews/process-desktop-20261118.jpg)
- [Narrow process](previews/process-mobile-20261118.jpg)

### Limits Of That Review

- The narrow layout was reviewed through browser zoom, not device emulation. Physical touch devices and Safari were not tested.
- Reduced-motion handling and hidden-tab pausing were reviewed in source. The operating-system preference was not emulated in this pass. Visible pause/play and offscreen pausing were tested directly.
- The activity, gallery, and contact checks below belong to the initial preview. This visual release did not repeat the full original review.

## Initial Preview Checks — November 17, 2026

| Area | Observed Result |
| --- | --- |
| Production build | TypeScript checking and Vite production build pass after the final application edits. The generated JavaScript is about 74 KB gzip and CSS about 10 KB gzip. |
| Content and assets | Public profile, SkyCommand-Demo, SkyDataStudio, MacroAnalyzer, and generated contribution assets were inspected. Product boundaries and image provenance are recorded in the README. |
| Desktop layout | Hero, both scenic sections, projects, process, activity, and contact were visually reviewed in Chromium at approximately 1363px viewport width. Images loaded; there was no horizontal page overflow. |
| Stationary scenes | The background layer remained fixed at viewport top while foreground content scrolled. Opaque/scenic transitions and dark foreground panels were visible. |
| Metallic interaction | A contained pointer reflection and edge highlight were observed on hovered cards. No custom cursor or page-wide mouse trail was implemented. |
| Project gallery | Screenshot tabs changed the real SkyCommand capture and caption. The image dialog opened, arrow keys advanced the gallery, Escape closed it, and focus returned to the initiating control. |
| Direct section links | Loading a fragment URL positions the requested section below the fixed header. The process fragment was verified after reload. |
| Narrow layout | A 390 × 844 desktop-browser iframe rendered the phone-width layout. Navigation, hero, process diagram, activity, project gallery, and contact were reviewed. Document scroll width matched client width (375px, with the desktop scrollbar occupying the remaining width). |
| Mobile menu | The toggle precedes the opened navigation in keyboard order; pressing Tab reached Home. Selecting a section closed the menu. |
| Process diagram | Duplicate embedded heading/frame were removed from local derived SVGs. Desktop and mobile retain the approved relationships; the mobile endpoint boxes remain readable. |
| Activity calendar | The page displays the actual dated snapshot: 367 days, 2,569 contributions, 166 active days. The mobile overflow starts on the newest months. Home selected November 16, 2025; End selected November 17, 2026 and its 26 contributions. |
| Contact | The copy-email control displayed its success message. Email and professional-profile links use the verified public contact details. No outbound message was sent. |
| Scenic image delivery | Same-dimension WebP encodings reduce the two served backgrounds from 4,593,237 bytes to 562,448 bytes. Their rendered appearance was reviewed afterward. Original PNGs are archived separately; the public repository serves WebP. |

## Existing Fallbacks

- Activity loads its local snapshot first and attempts a guarded 4.5-second public-source refresh. Code checks dates, totals, active-day count, known levels, and update time; invalid, stale, or unavailable refreshes preserve the dated fallback. Distinct network-failure cases were not fault-injected.
- Reduced-motion styles remove smooth scrolling and animated reflection and use static scenic positioning. Pointer updates check the motion preference; the process also disables its moving traces.

## Source References

- [PStar80 public profile](https://github.com/PStar80/PStar80/blob/main/README.md)
- [SkyCommand showcase](https://github.com/PStar80/SkyCommand-Demo)
- [SkyDataStudio](https://github.com/PStar80/SkyDataStudio)
- [MacroAnalyzer](https://github.com/PStar80/MacroAnalyzer)
- [Contribution source assets](https://github.com/PStar80/PStar80/tree/output)
- [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
