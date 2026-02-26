import type { TileKind } from '../hooks/useSimulationModel';

export const ASCENTRA_THEME = {
  color: {
    accent: '#86afe8',
    accentStrong: '#5f91da',
    neutral0: '#070d16',
    neutral1: '#0d1725',
    neutral2: '#162335',
    border: '#a2c3ec42',
    glow: '#7ca7e0'
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
    tileColor: '#4aa2ff',
    tileEmissive: '#2b86f0',
    tileStrip: '#8dc8ff'
  },
  M: {
    label: 'Mid',
    uiClass: 'mover-chip-mid',
    tileColor: '#82b8d7',
    tileEmissive: '#5f99bc',
    tileStrip: '#b4dbef'
  },
  S: {
    label: 'Slow',
    uiClass: 'mover-chip-slow',
    tileColor: '#c7b8a4',
    tileEmissive: '#a18f74',
    tileStrip: '#ecdfcd'
  }
};

export const STATION_THEME = {
  base: '#1f3046',
  housing: '#2c3f58',
  top: '#8eb2df',
  strip: '#95c0ee',
  led: '#9dd2ff',
  conveyorBase: '#27384e',
  conveyorTrack: '#3e5778',
  conveyorStripe: '#98c7ff'
} as const;
