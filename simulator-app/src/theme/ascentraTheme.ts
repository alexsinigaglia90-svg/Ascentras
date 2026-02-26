import type { TileKind } from '../hooks/useSimulationModel';

export const ASCENTRA_THEME = {
  color: {
    accent: '#78b8ff',
    accentStrong: '#b9dcff',
    neutral0: '#060d16',
    neutral1: '#0f1a2a',
    neutral2: '#17263a',
    border: 'rgba(134, 177, 226, 0.34)',
    glow: '#7ab7f7',
    zoneHuman: '#b56b7d',
    zoneAi: '#8e6ea9',
    zoneSafety: '#d3bf8a',
    zoneMachine: '#b48d62',
    stagingLine: '#6ecf98',
    stagingLineEmissive: '#5fc58a',
    stagingLane: '#57bb87',
    stagingSlot: '#8bdfae',
    stagingOverflow: '#a7dfbe'
  },
  radius: {
    panel: 1.05,
    control: 0.72,
    tile: 0.1,
    machine: 0.11
  },
  shadow: {
    soft: '0 16px 34px rgba(2, 8, 16, 0.48)',
    panel: '0 24px 54px rgba(1, 6, 14, 0.64)'
  },
  glow: {
    soft: '0 0 0 1px rgba(134, 176, 224, 0.18), 0 0 28px rgba(97, 155, 228, 0.24)',
    selected: '0 0 0 1px rgba(179, 213, 246, 0.28), 0 0 34px rgba(118, 178, 248, 0.3)'
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
    tileColor: '#d08b5b',
    tileEmissive: '#ad653e',
    tileStrip: '#e7b78f'
  },
  M: {
    label: 'Mid',
    uiClass: 'mover-chip-mid',
    tileColor: '#7f99b7',
    tileEmissive: '#5f7795',
    tileStrip: '#a6bedc'
  },
  S: {
    label: 'Slow',
    uiClass: 'mover-chip-slow',
    tileColor: '#5f7598',
    tileEmissive: '#465c7d',
    tileStrip: '#84a2ca'
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
