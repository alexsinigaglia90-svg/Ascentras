import type { TileKind } from '../hooks/useSimulationModel';

export const ASCENTRA_THEME = {
  color: {
    accent: '#d6b27a',
    accentStrong: '#c79758',
    neutral0: '#15100d',
    neutral1: '#221a14',
    neutral2: '#31251d',
    border: '#f0d7b347',
    glow: '#d0a86e'
  },
  radius: {
    panel: 1.05,
    control: 0.72,
    tile: 0.1,
    machine: 0.11
  },
  shadow: {
    soft: '0 16px 34px rgba(3, 8, 14, 0.5)',
    panel: '0 24px 54px rgba(2, 7, 14, 0.62)'
  },
  glow: {
    soft: '0 0 0 1px rgba(166, 200, 238, 0.16), 0 0 28px rgba(114, 156, 222, 0.2)',
    selected: '0 0 0 1px rgba(188, 214, 246, 0.26), 0 0 34px rgba(115, 165, 234, 0.28)'
  }
} as const;

export const MOVER_THEME: Record<TileKind, {
  label: string;
  uiClass: string;
  tileColor: string;
  tileEmissive: string;
  tileStrip: string;
}> = {
  F: {
    label: 'Fast',
    uiClass: 'mover-chip-fast',
    tileColor: '#d08657',
    tileEmissive: '#a95f37',
    tileStrip: '#e2b084'
  },
  M: {
    label: 'Mid',
    uiClass: 'mover-chip-mid',
    tileColor: '#9e8661',
    tileEmissive: '#7f6a4a',
    tileStrip: '#c5ad87'
  },
  S: {
    label: 'Slow',
    uiClass: 'mover-chip-slow',
    tileColor: '#66778d',
    tileEmissive: '#4e5f74',
    tileStrip: '#8da1ba'
  }
};

export const STATION_THEME = {
  base: '#4b3b2f',
  housing: '#655244',
  top: '#b99467',
  strip: '#d3aa79',
  led: '#f0d1a1',
  conveyorBase: '#4a433a',
  conveyorTrack: '#665b4e',
  conveyorStripe: '#c9a26f'
} as const;
