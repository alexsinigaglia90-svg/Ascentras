# Ascentras
Staging enviroment Ascentra site

## Platform Journey

Homepage now includes a pinned scroll journey directly below the hero:

- Section: `#platform-journey` in `index.html`
- Styles: `assets/css/platform-journey.css`
- Logic: `assets/js/platform-journey.js` (GSAP + ScrollTrigger)
- Lane navigation: `assets/js/lane-navigator.js` (3-lane cinematic fly-to with history + focus management)

### Tuning

- Scroll duration: edit `end: '+=300%'` in `platform-journey.js`
- Segment switching: adjust progress gates `0.15 / 0.55 / 0.88`
- Colors: edit CSS vars `--cream`, `--blue`, `--brown`, `--glass`
- Reduced motion: handled via `prefers-reduced-motion` and mobile fallback (< 760px)
- Side lanes: click Operis/Astra chips or branch CTAs to open cinematic side lanes; `Esc`, back button UI, and browser Back return to center.

### Dedicated routes

- `/ascentra`
- `/operis`
- `/astra`

Routes are mapped in `_redirects` to dedicated static pages.

## LaneShell Navigation

Homepage now runs as a horizontal LaneShell with five lanes and cinematic transitions:

- Home (`/`)
- Pyramid Hub (`/hub`)
- Ascentra (`/ascentra`)
- Operis (`/operis`)
- Astra (`/astra`)

Implementation:

- Layout: `index.html`
- Styles: `assets/css/lane-shell.css`
- Logic: `assets/js/lane-shell.js`

Notes:

- Lane transitions are transform-based (`translate3d`) with reduced-motion fallback.
- Browser back/forward integrates via `history.pushState` + `popstate`.
- Vertical scroll positions are preserved per lane scroll container.
