# Ascentra – Control Room Detachering

Interactive 3D diorama landing page for Ascentra's control room staffing services.

## Quick Start

```bash
cd control-room-app
npm install
npm run dev
```

Opens at `http://localhost:5173/operis/control-room-planning/`

## Production Build

```bash
npm run build
```

Outputs static files to `../operis/control-room-planning/` for Cloudflare Pages.

## Architecture

```
src/
  state/store.ts          – Zustand global state (machine states, KPIs, incidents)
  data/profiles.ts        – Staff profile data and domain filters
  scene/
    ControlRoomScene.tsx   – Main Canvas + camera controller + sim ticker
    WarehouseEnvironment   – Floor, walls, ceiling, pedestal base
    ControlDesk.tsx        – Desk, monitors, props (mug, sticky notes, fan, LEDs)
    AutoStoreGrid.tsx      – Instanced mesh grid with heatmap + speed animation
    ConveyorBelt.tsx       – Animated belt with packages, divert gate, jam visual
    Depalletizer.tsx       – Robot arm with fault simulation
    Palletizer.tsx         – Gantry-style palletizer with pattern modes
    DustParticles.tsx      – Atmospheric floating dust
    SceneLighting.tsx      – Cinematic lighting responsive to shift/emergency
  components/ui/
    SystemsPanel.tsx       – Left HUD: machine controls (start/stop, sliders, faults)
    OperationsPanel.tsx    – Right HUD: live KPIs, incident feed, shift/perf toggles
    ProfilesDock.tsx       – Bottom dock: staff cards with filter, detail panel
    HeroOverlay.tsx        – Brand headline and subline
    RequestModal.tsx       – CTA form stub
```

## Keyboard Shortcuts

| Key     | Action                       |
|---------|------------------------------|
| Space   | Start/Stop conveyors         |
| A       | Acknowledge all alarms       |
| Esc     | Return to overview / close   |

## Adjusting Profiles & Copy

- Staff profiles: edit `src/data/profiles.ts`
- Headline / subline: edit `src/components/ui/HeroOverlay.tsx`
- KPI simulation logic: edit `src/state/store.ts` → `tick()` method

## Design Tokens

All colours, fonts, and radii are CSS custom properties in `src/index.css`.
