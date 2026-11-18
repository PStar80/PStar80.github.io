# Paul Sattaur / PStar80 Portfolio

A personal portfolio for full-stack applications, agentic automation, data engineering, and interactive analytics. Built with React, TypeScript, Vite, and Lucide icons.

**Website:** [pstar80.github.io](https://pstar80.github.io/). This repository is configured to publish through GitHub Actions. See [verification notes](docs/verification.md) for the completed preview checks and remaining limits.

## Design

- Opaque graphite/navy sections use a faint grid. Alternating scenic sections reveal stationary artwork while foreground content scrolls.
- Two original backgrounds extend the existing blue cybernetic portrait and neural/workflow profile imagery. [Generation prompts and references](docs/artwork-prompts.md) are retained.
- Metallic pointer lighting is confined to the hovered card or panel. The regular cursor remains visible; there is no cursor trail or page-wide mouse spotlight.
- The four home capability cards link to the relevant work, with illuminated icons, compact descriptions, and the shared metallic reflection.
- The development process is an interactive SVG with directional traces, selectable node descriptions, keyboard exploration, and separate desktop/mobile layouts. Motion can be paused, respects reduced-motion preferences, and stops while the diagram is offscreen or the tab is hidden.
- Project sections use actual application captures, with a screenshot lightbox and captions describing the visible state.
- Experience is available in the main navigation and presents a brief, dated career timeline. The site does not serve a downloadable résumé.
- A full-width, flat world map leads the contact area, with three full-surface contact links in a horizontal row below it. Narrow screens use a North American map crop and stack the cards. The email copy button remains separate; success is shown by its checkmark with a screen-reader announcement, and copy errors alone display a message.
- The map uses real geographic outlines, a rectangular latitude/longitude grid, a Toronto city beacon, subtle motion, and Toronto local time. Its motion can be paused, respects reduced-motion preferences, and stops offscreen or while the tab is hidden.
- The personal site stays blue/cyan; SkyCommand retains its charcoal/gold product identity.
- GitHub Activity sits over the neural scene, with its calendar and labels on a dark foreground panel.

## Run Locally

Use Node.js 24 and npm. Install from the committed lockfile:

```bash
npm ci
npm run dev
```

Create and serve the static build:

```bash
npm run build
npm run preview
```

`npm run build` runs TypeScript checking and Vite, producing `dist/`. There is no application backend or contact-form delivery service; contact actions use the public email, LinkedIn, and GitHub links.

## Main Files

| File | Purpose |
| --- | --- |
| `src/App.tsx` | Page sections, project galleries, navigation, and card interaction |
| `src/styles.css` | Visual system and responsive layouts |
| `src/ProcessFlow.tsx`, `src/process-flow.css` | Shared architecture data, responsive SVG layouts, directional motion, and accessible node exploration |
| `src/LocationMap.tsx`, `src/location-map.css` | Flat location map, Toronto beacon, restrained motion, accessible pause control, responsive framing, and local time |
| `src/location-map-data.ts`, `scripts/build_location_map.py` | Committed geographic SVG paths and an optional reproducible generator |
| `src/GitHubActivity.tsx` | Contribution calendar and guarded source refresh |
| `src/github-activity.css` | Calendar styles, scoped with `gh-` classes |
| `public/assets/` | Portrait, original decorative scenes, reviewed screenshots, process diagram, and dated activity data |
| `.github/workflows/pages.yml` | Prepared GitHub Pages build/deployment workflow |

## Content And Asset Sources

| Material | Provenance |
| --- | --- |
| Identity, technology, contact, and project positioning | [PStar80 public profile README](https://github.com/PStar80/PStar80/blob/main/README.md) |
| `portrait-current.png` | Current [PStar80 GitHub avatar](https://avatars.githubusercontent.com/u/225520620?v=4), retrieved during this build; the existing cybernetic portrait is used as supplied |
| `cybernetic-scene.webp`, `neural-scene.webp` | Newly generated decorative backgrounds based on the existing avatar and profile hero; [full prompts](docs/artwork-prompts.md). This public repository contains the web-ready WebP versions; original generation PNGs are archived separately |
| Development Process Flow | `src/ProcessFlow.tsx` presents the approved [profile architecture](https://github.com/PStar80/PStar80/tree/main/assets/profile) as an interactive diagram. The original derived static `process.svg` and `process-mobile.svg` files remain available as reference assets. |
| Toronto location map | Natural Earth v5.1.2 land, borders, and lakes, with city coordinates from the City of Toronto; [sources and reproduction notes](docs/map-sources.md) |
| SkyCommand screenshots | Reviewed public assets from [SkyCommand-Demo](https://github.com/PStar80/SkyCommand-Demo/tree/main/assets/screenshots); [gallery and captions](https://github.com/PStar80/SkyCommand-Demo/blob/main/docs/gallery.md) |
| MacroAnalyzer screenshots | `02-macro-dashboard.png` and `11-dashboard-presentation.png` from [the public screenshot set](https://github.com/PStar80/MacroAnalyzer/tree/main/docs/assets/screenshots) |
| SkyDataStudio illustration and copy | A conceptual lineage illustration, not an application screenshot; product scope from [its README](https://github.com/PStar80/SkyDataStudio/blob/main/README.md) |
| Engineering highlights | Implementation decisions documented in [SkyCommand architecture](https://github.com/PStar80/SkyCommand-Demo/blob/main/docs/architecture.md), [SkyDataStudio](https://github.com/PStar80/SkyDataStudio/blob/main/README.md), and [MacroAnalyzer](https://github.com/PStar80/MacroAnalyzer/blob/main/README.md) |
| Experience timeline | Owner-supplied career details, summarized as four dated software-related entries from CPAS onward; source documents are not published |
| `portfolio-cover.png` | Original approved portfolio artwork, used for Open Graph and Twitter sharing previews |
| Activity data | [Public generated contribution assets](https://github.com/PStar80/PStar80/tree/output), described below |

The reference portfolios informed layout and interaction patterns; their artwork, source code, branding, and personal data are not part of this website.

## GitHub Activity

`public/assets/contributions.json` contains a dated local fallback extracted from the public contribution SVG: **367 days, 2,569 contributions, and 166 active days**, covering **2025-11-16 through 2026-11-17**, updated **2026-11-17 07:41 UTC**.

After loading that fallback, the component attempts a 4.5-second refresh from the public `engineering-activity-static.svg` and `engineering-activity.json` files. It parses only date/count titles and known metadata, verifies the date sequence and aggregate totals, and accepts a valid newer or equal snapshot. It never inserts remote SVG markup. Failed, older, or inconsistent refreshes retain the local snapshot and its timestamp.

Counts come from the public generated contribution assets. Visibility and refresh timing can differ from the native GitHub profile. This is a dated contribution snapshot, not live operational telemetry.

## Product Boundaries

- **SkyCommand:** the linked repository is a public showcase of a privately implemented application. Native work-order coordination is planned for Phase 20. The workflow screenshot shows a running node, and the successful tool screenshot is a separate capture.
- **SkyDataStudio:** consumes trusted ingested data and prepares governed analytical products. Source ingestion belongs to SkyCommand. Power BI deployment and AI-assisted engineering remain roadmap items.
- **MacroAnalyzer:** the repository and portfolio card retain this name; the current application UI and README use **SkyWeb Analytics**. It is documented as a local analytics application, with in-app signals; a hosted application and external alert delivery are not claimed.

## GitHub Pages Deployment

The workflow runs on a push to `main` or a manual `workflow_dispatch`. It installs locked dependencies, builds `dist/`, uploads the Pages artifact, and deploys through the `github-pages` environment. The repository's Pages source is configured as **GitHub Actions**.

Push source changes with the lockfile, then follow the [deployment workflow](https://github.com/PStar80/PStar80.github.io/actions). Confirm the workflow result and [published website](https://pstar80.github.io/) after deployment.

Vite uses `base: '/'`, matching the intended account-root site. A separate project-subpath deployment would require reviewing that base and the root-relative asset URLs.

Workflow references: [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [publishing-source configuration](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site), and [setup-node](https://github.com/actions/setup-node).
