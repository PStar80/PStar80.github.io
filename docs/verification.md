# Portfolio Review Checkpoint

## Map Selection And Header Refinements

Verified on the published [contact section](https://pstar80.github.io/#contact)
on **November 18, 2026 (Toronto)**.

- Implementation: [f1f9b6e](https://github.com/PStar80/PStar80.github.io/commit/f1f9b6e5347888ba320703de7dd86398ae8ae22c)
- GitHub Pages build and deployment: [successful run](https://github.com/PStar80/PStar80.github.io/actions/runs/44273037726)
- Left-clicking Canada selected it in the country chooser and retained its highlight after the pointer left the map. A second click cleared the selection, label, and chooser value.
- Selecting Brazil in the chooser and then clicking Brazil on the map cleared the same selection. Clicking Canada followed by Brazil switched the chooser to Brazil. Clicking ocean cleared selection; a dragged gesture did not select a country.
- The header shows the PS mark and Pstar80 without a subtitle. All seven links display uppercase, and Contact is a regular link with the shared active-section underline.
- At 1348px, the navigation's horizontal center exactly matched the page center. At 1078px, it was centered within 0.2px and had 122px of clearance from the brand.
- All three desktop contact cards measured 400px wide and 96px high. Equal widths also held at 1078px apart from fractional pixel rounding, with no email overflow. The narrow cards each measured 297px wide at a 337px viewport.
- At 899px and 337px, the centered menu opened and Contact could be selected, closing the menu. The short 337px-wide viewport kept the menu inside its available height with vertical scrolling and the first entry reachable.
- Document scroll width matched client width at 1348px, 1078px, 899px, and 337px. Browser zoom was restored to 100% after checking.
- TypeScript/Vite and the production deployment passed. Focused independent source review found no actionable regressions. No dependencies or test files were added.

Preview: [selected country, centered header, and equal contact cards](previews/map-selection-header-refinement-20261118.jpg).

Responsive checks used Chromium browser zoom. Touch/pen toggling, multitouch
cancellation, and non-left-button guards were reviewed in source; physical touch
devices and Safari were not exercised in this pass. Previous checkpoints below
describe their respective releases.

## Previous Country Hover And Map Exploration Release

Verified on the published [contact section](https://pstar80.github.io/#contact)
on **November 18, 2026 (Toronto)**.

- Implementation: [bd04cd5](https://github.com/PStar80/PStar80.github.io/commit/bd04cd5dac625efb54ec9457a8273499d63a0dc0)
- GitHub Pages build and deployment: [successful run](https://github.com/PStar80/PStar80.github.io/actions/runs/44268977108)
- Country paths and source provenance: [map sources](map-sources.md)

| Area | Observed result |
| --- | --- |
| Country hover | Canada, the United States, and Brazil showed their correct names and active country outlines. Canada's brighter fill and cyan outline were visually checked with Toronto's beacon still visible. |
| Water and exit | Moving onto the Atlantic or a Great Lakes lake surface cleared the hover label and outline. Moving outside the map also cleared transient hover. |
| Edge labels | New Zealand near the right edge and Argentina near the bottom edge retained their complete labels inside the map stage. |
| Keyboard selection | Selecting Brazil and pressing ArrowDown changed the selection and docked label to Brunei. Escape cleared the selection and highlight. The native chooser is one keyboard stop. |
| Responsive selection | A selected Japan was cleared when resizing into the regional crop. At 337px, the chooser remained 44px high, keyboard selection worked, and the selected-country label stayed inside the stage. |
| Layout | Document scroll width equalled client width at 1348px, 674px, and 337px. The existing regional crop and stacked contact cards remained on narrow layouts. At desktop size, the three contact cards shared the same top edge and 96px height. |
| Existing map controls | Pause and Play changed the map's motion state correctly with country selection present. Toronto's marker, permanent city label, and local clock remained visible. Browser zoom was restored to 100%. |
| Native tooltip removal | The map SVG contains no title element; its accessible map name remains available through its ARIA label and description. The map-wide Toronto native hover tooltip is removed. |
| Build and source review | TypeScript and Vite passed; JavaScript is 165.17 KB gzip and CSS is 13.81 KB gzip. No runtime dependencies were added. Focused independent review found no actionable issues in hit testing, tooltip positioning, selection state, touch cancellation, or cleanup. |

Previews: [desktop hover](previews/country-hover-desktop-20261118.jpg) ·
[narrow-screen selection](previews/country-hover-mobile-20261118.jpg).

Narrow layouts were checked with Chromium browser zoom, not a physical phone or
Safari. Touch tap/scroll cancellation, reduced-motion preferences, and hidden-tab
handling were reviewed in source rather than exercised on a touch device or by
changing operating-system preferences. Coverage follows the existing simplified
map data; small islands and microstates are not guaranteed to be present or easy
to target. Earlier checkpoints below describe their respective releases.

## Previous Flat Map And Contact Row Release

Verified on the published [contact section](https://pstar80.github.io/#contact)
on **November 18, 2026 (Toronto)**.

- Implementation: [7519e3b](https://github.com/PStar80/PStar80.github.io/commit/7519e3b0e69bf6445750c3089b497ccdc0b538f4)
- GitHub Pages build and deployment: [successful run](https://github.com/PStar80/PStar80.github.io/actions/runs/44265491308)
- The globe is replaced by a flat world map with straight latitude/longitude grid lines. Its panel spans the contact container, with email, LinkedIn, and GitHub in a horizontal row below. At the 1348px desktop viewport, the panel was 1236px wide and all three contact cards aligned at the same top edge with 96px height.
- Toronto's beacon, label, local clock, and motion control remain. Pause held all animation transforms unchanged across observations; Space resumed them. Returning home paused the offscreen map. The globe's parallax and circular framing are removed.
- The email-copy button produced its checkmark state and clipped screen-reader announcement without a visible status row. Points near each card's outside corner resolved to the correct native link, preserving the full-card target.
- At 674px and 337px, the map used its North America crop and the contact cards stacked beneath it. Toronto's complete label remained inside the map. Document scroll width matched client width at all three tested widths. Zoom was restored to 100%.
- TypeScript/Vite build passed: JavaScript 120.82 KB gzip, CSS 13.15 KB gzip; no new runtime dependencies. Focused independent source review found no actionable bugs in the projection/crop, SVG IDs, motion gates, clock cleanup, or contact controls.

Previews: [desktop](previews/flat-map-desktop-20261118.jpg) ·
[narrow screen](previews/flat-map-mobile-20261118.jpg).

Narrow checks used Chromium browser zoom, not physical phones or Safari.
Reduced-motion and hidden-tab handling were reviewed in source, not exercised
directly. Earlier checkpoints below describe their respective releases.

## Previous Curved Toronto Map Release

The location-map and contact-cleanup update was verified on the published
[contact section](https://pstar80.github.io/#contact) on **November 18, 2026 (Toronto)**.

- Implementation: [7868f4f](https://github.com/PStar80/PStar80.github.io/commit/7868f4f7f7d438d76bbe26edbdd2c118e108f02e)
- GitHub Pages build and deployment: [successful run](https://github.com/PStar80/PStar80.github.io/actions/runs/44263214687)
- Geographic provenance and regeneration: [map sources](map-sources.md)

| Area | Observed result |
| --- | --- |
| Production build | TypeScript and Vite passed. JavaScript is 106.46 KB gzip and CSS is 13.27 KB gzip. No runtime dependencies were added; geographic paths are bundled locally. |
| Desktop presentation | Three contact cards form a single stack beside the curved North America map. Real coastlines, international borders, major lakes, the geographic grid, and the Toronto beacon render clearly in the existing navy/cyan theme. |
| Contact cleanup | The extra contact-section Get In Touch button is removed. The hero contact link remains. Existing email, LinkedIn, and GitHub anchors retain their destinations, and the copy control remains a separate native button. |
| Copy feedback | Clicking Copy changed the button to Email copied. The success announcement is an absolutely positioned, clipped 1px screen-reader status; no visible status row remains. Contact-layout height stayed at 471px before and after copying. Error feedback remains available in source; a clipboard failure was not injected. |
| Motion controls | Pause changed the map state to paused, and all four animation transforms stayed identical across separate observations. Space on Play resumed motion and changed the beacon transforms. The compact-layout pause control also worked and retained its 44px height. |
| Pointer motion | Moving over the map changed the shared globe transform by a small amount (observed 1.351px, -1.052px). Land, city marker, leader, and label share that transform. Returning home paused the offscreen map and reset the transform to zero. |
| Local time | The footer displayed Toronto time with EST and updated from 3:00 to 3:01 a.m. during review. Returning to the map refreshed it to the current minute. |
| Responsive layout | Document scroll width equalled client width at 1348px, 674px, and 337px. The contact stack moves above the map at narrower widths. At 337px the map uses its compact viewBox, keeps the Toronto label inside the stage, and fits both footer columns. |
| Narrow navigation | The short-screen menu reached Let's Talk and closed after selection. Browser zoom was restored to 100% at the end of review. |
| Source review | Independent read-only review found no actionable issues in observer cleanup, minute scheduling, unique SVG IDs, keyboard controls, or the shared map/marker transform. Reduced-motion and hidden-tab gates were reviewed in source. |

Screenshots from the deployed release:

- [Desktop contact map](previews/contact-map-desktop-20261118.jpg)
- [Narrow contact map](previews/contact-map-mobile-20261118.jpg)

Narrow layouts were tested with Chromium browser zoom, not a physical phone or
Safari. The operating-system reduced-motion preference and hidden-tab behavior
were not exercised directly in this pass. Earlier release checks below remain
historical checkpoints and were not all repeated for this update.

## Previous Contact And Experience Release

The contact-card and experience-timeline update was verified on the published [portfolio](https://pstar80.github.io/) on **November 18, 2026 (Toronto)**.

- Main changes: [beaafce](https://github.com/PStar80/PStar80.github.io/commit/beaafced611a73d8dbe14da0e162acc24a75ad3a)
- Short-viewport navigation fix: [ddf8f47](https://github.com/PStar80/PStar80.github.io/commit/ddf8f4738124274312a7c50fb212418ba93482b0)
- Final GitHub Pages build and deployment: [successful run](https://github.com/PStar80/PStar80.github.io/actions/runs/44256868248)

### Contact And Experience Release Checks

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
