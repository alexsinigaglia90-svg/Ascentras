import { useEffect, useMemo, useRef, useState } from 'react';

export const BOARD_COLS = 16;
export const BOARD_ROWS = 10;
export const CELL_SIZE = 1;

export const HUMAN_COL_RANGE = { min: 0, max: 7 };
export const AI_COL_RANGE = { min: 8, max: 15 };

export type Side = 'human' | 'ai';
export type TileKind = 'F' | 'M' | 'S';
export type Phase = 'build' | 'ready' | 'simulating' | 'paused' | 'finished';

export type GridCell = {
  col: number;
  row: number;
};

export type CircuitTile = {
  id: string;
  kind: TileKind;
  cell: GridCell;
  side: Side;
};

export type StationSet = {
  depot: GridCell;
  dropoff: GridCell;
  packingTable: GridCell;
  machine: GridCell;
  outbound: GridCell;
  docks: GridCell[];
};

export type Mission = {
  startLabel: string;
  endLabel: string;
  targetOrders: number;
};

export type BuildCounts = Record<TileKind, number>;

export type BuildMetrics = {
  travelDistance: number;
  congestionPenalty: number;
  zoningScore: number;
  efficiencyScore: number;
  totalTiles: number;
};

export type SimKpis = {
  completedOrders: number;
  avgCycleTimeSeconds: number;
  avgPickTravelPerOrder: number;
  congestionTimeSeconds: number;
};

export type FteResult = {
  pickers: number;
  runners: number;
  total: number;
};

export type SideResult = {
  kpis: SimKpis;
  requiredFte: FteResult;
};

export type SimResults = {
  missionTarget: number;
  human: SideResult;
  ai: SideResult;
  conclusion: string;
};

export type AgentVisual = {
  id: string;
  role: 'picker' | 'runner';
  side: Side;
  cell: GridCell;
  target: GridCell;
};

export type BoxVisual = {
  id: string;
  side: Side;
  cell: GridCell;
};

type DemandOrder = {
  createdMinute: number;
  kinds: TileKind[];
};

type VisualState = {
  humanAgents: AgentVisual[];
  aiAgents: AgentVisual[];
  humanBoxes: BoxVisual[];
  aiBoxes: BoxVisual[];
  humanTargets: GridCell[];
  aiTargets: GridCell[];
};

type ObjectiveResult = {
  score: number;
  metrics: BuildMetrics;
  kpis: SimKpis;
};

const SHIFT_MINUTES = 8 * 60;
const SHIFT_SECONDS = SHIFT_MINUTES * 60;
const SIM_SPEED = 60;
const REQUIRED_COUNTS: BuildCounts = { F: 6, M: 6, S: 6 };
const AI_MAIN_AISLE_COL = 12;
const AI_SECONDARY_AISLE_COL = 10;
const AI_CORRIDOR_ROWS = [2, 5, 8] as const;

const MISSION: Mission = {
  startLabel: '09:00',
  endLabel: '17:00',
  targetOrders: 1200
};

const HUMAN_STATIONS: StationSet = {
  depot: { col: 1, row: 1 },
  dropoff: { col: 5, row: 3 },
  packingTable: { col: 4, row: 7 },
  machine: { col: 6, row: 7 },
  outbound: { col: 3, row: 8 },
  docks: [
    { col: 1, row: 9 },
    { col: 3, row: 9 },
    { col: 6, row: 9 }
  ]
};

const AI_STATIONS: StationSet = {
  depot: { col: 9, row: 1 },
  dropoff: { col: 13, row: 3 },
  packingTable: { col: 12, row: 7 },
  machine: { col: 14, row: 7 },
  outbound: { col: 11, row: 8 },
  docks: [
    { col: 9, row: 9 },
    { col: 11, row: 9 },
    { col: 14, row: 9 }
  ]
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function cellKey(cell: GridCell): string {
  return `${cell.col}:${cell.row}`;
}

function manhattan(a: GridCell, b: GridCell): number {
  return Math.abs(a.col - b.col) + Math.abs(a.row - b.row);
}

function getCounts(tiles: CircuitTile[]): BuildCounts {
  const counts: BuildCounts = { F: 0, M: 0, S: 0 };
  tiles.forEach((tile) => {
    counts[tile.kind] += 1;
  });
  return counts;
}

function sideStations(side: Side): StationSet {
  return side === 'human' ? HUMAN_STATIONS : AI_STATIONS;
}

function sideCols(side: Side): { min: number; max: number } {
  return side === 'human' ? HUMAN_COL_RANGE : AI_COL_RANGE;
}

function sideClamp(cell: GridCell, side: Side): GridCell {
  const cols = sideCols(side);
  return {
    col: clamp(cell.col, cols.min, cols.max),
    row: clamp(cell.row, 0, BOARD_ROWS - 1)
  };
}

function blockedCells(side: Side): Set<string> {
  const stations = sideStations(side);
  const blocked = new Set<string>([
    cellKey(stations.depot),
    cellKey(stations.dropoff),
    cellKey(stations.packingTable),
    cellKey(stations.machine),
    cellKey(stations.outbound),
    ...stations.docks.map((dock) => cellKey(dock))
  ]);

  if (side === 'ai') {
    for (let row = 0; row < BOARD_ROWS; row += 1) {
      blocked.add(cellKey({ col: AI_MAIN_AISLE_COL, row }));
    }
  }

  return blocked;
}

function buildMetrics(tiles: CircuitTile[], side: Side): BuildMetrics {
  const stations = sideStations(side);
  if (tiles.length === 0) {
    return {
      travelDistance: 0,
      congestionPenalty: 0,
      zoningScore: 0,
      efficiencyScore: 0,
      totalTiles: 0
    };
  }

  let weightedTravel = 0;
  let zoning = 0;
  let congestionPairs = 0;

  for (const tile of tiles) {
    const depotDist = manhattan(tile.cell, stations.depot);
    const dropDist = manhattan(tile.cell, stations.dropoff);

    weightedTravel +=
      tile.kind === 'F'
        ? depotDist * 1.35 + dropDist * 0.62
        : tile.kind === 'M'
          ? depotDist * 0.92 + dropDist * 0.95
          : depotDist * 0.56 + dropDist * 1.24;

    if (tile.kind === 'F') {
      zoning += depotDist <= 3 ? 2.2 : depotDist <= 5 ? 0.9 : -1.5;
    } else if (tile.kind === 'M') {
      zoning += depotDist >= 3 && depotDist <= 7 ? 1.4 : -0.7;
    } else {
      zoning += depotDist >= 6 ? 1.85 : -1.2;
    }
  }

  for (let i = 0; i < tiles.length; i += 1) {
    for (let j = i + 1; j < tiles.length; j += 1) {
      const dist = manhattan(tiles[i].cell, tiles[j].cell);
      if (dist <= 1) congestionPairs += 1;
      if (tiles[i].kind === 'F' && tiles[j].kind === 'F' && dist <= 2) congestionPairs += 0.9;
    }
  }

  const travelDistance = weightedTravel / tiles.length;
  const congestionPenalty = congestionPairs / Math.max(tiles.length / 3, 1);
  const zoningScore = zoning / tiles.length;

  const efficiencyScore = clamp(
    100 - travelDistance * 6.1 - congestionPenalty * 7.2 + zoningScore * 12.3 + (tiles.length / 18) * 10,
    0,
    100
  );

  return {
    travelDistance,
    congestionPenalty,
    zoningScore,
    efficiencyScore,
    totalTiles: tiles.length
  };
}

function validCounts(counts: BuildCounts): boolean {
  return counts.F >= REQUIRED_COUNTS.F && counts.M >= REQUIRED_COUNTS.M && counts.S >= REQUIRED_COUNTS.S;
}

function mulberry32(seed: number): () => number {
  let current = seed >>> 0;
  return () => {
    current += 0x6d2b79f5;
    let value = Math.imul(current ^ (current >>> 15), 1 | current);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function pickWeightedKind(rng: () => number): TileKind {
  const r = rng();
  if (r < 0.6) return 'F';
  if (r < 0.9) return 'M';
  return 'S';
}

function generateDemandStream(seed: number, count: number): DemandOrder[] {
  const rng = mulberry32(seed);
  const orders: DemandOrder[] = [];

  for (let index = 0; index < count; index += 1) {
    const linesCount = 3 + Math.floor(rng() * 6);
    const kinds: TileKind[] = [];
    for (let line = 0; line < linesCount; line += 1) {
      kinds.push(pickWeightedKind(rng));
    }

    orders.push({
      createdMinute: Math.floor(rng() * SHIFT_MINUTES),
      kinds
    });
  }

  return orders.sort((left, right) => left.createdMinute - right.createdMinute);
}

function createKindPools(tiles: CircuitTile[]): Record<TileKind, GridCell[]> {
  const pools: Record<TileKind, GridCell[]> = { F: [], M: [], S: [] };
  tiles.forEach((tile) => {
    pools[tile.kind].push(tile.cell);
  });
  return pools;
}

function sampleLineCell(kind: TileKind, pools: Record<TileKind, GridCell[]>, rng: () => number): GridCell {
  const preferred = pools[kind];
  if (preferred.length > 0) {
    return preferred[Math.floor(rng() * preferred.length)];
  }

  const fallback = [...pools.F, ...pools.M, ...pools.S];
  if (fallback.length === 0) {
    return { col: 0, row: 0 };
  }

  return fallback[Math.floor(rng() * fallback.length)];
}

function moveSeconds(from: GridCell, to: GridCell, speedCellsPerSecond: number): number {
  return manhattan(from, to) / speedCellsPerSecond;
}

function pickLineService(kind: TileKind): number {
  if (kind === 'F') return 3.2;
  if (kind === 'M') return 4.3;
  return 5.6;
}

function evaluateLayoutRun(
  side: Side,
  tiles: CircuitTile[],
  demandOrders: DemandOrder[],
  seed: number,
  fte: FteResult,
  sideOptimizationBoost = 1
): SimKpis {
  if (tiles.length === 0) {
    return {
      completedOrders: 0,
      avgCycleTimeSeconds: 0,
      avgPickTravelPerOrder: 0,
      congestionTimeSeconds: 0
    };
  }

  const stations = sideStations(side);
  const pools = createKindPools(tiles);
  const rng = mulberry32(seed);

  const speed = 1.4 * sideOptimizationBoost;
  const pickerAvailability = new Array<number>(fte.pickers).fill(0);
  const pickerPos = new Array<GridCell>(fte.pickers).fill(stations.depot).map(() => ({ ...stations.depot }));
  const runnerAvailability = new Array<number>(fte.runners).fill(0);
  const cellQueue = new Map<string, number>();
  let machineFreeAt = 0;

  let completedOrders = 0;
  let cycleTotal = 0;
  let pickTravelTotal = 0;
  let congestionTimeSeconds = 0;

  for (const order of demandOrders) {
    const pickerIdx = pickerAvailability.reduce((best, value, index, array) => (value < array[best] ? index : best), 0);

    let time = Math.max(order.createdMinute * 60, pickerAvailability[pickerIdx]);
    let currentCell = pickerPos[pickerIdx];
    let orderTravel = 0;

    for (const lineKind of order.kinds) {
      const lineCell = sampleLineCell(lineKind, pools, rng);

      const travelSec = moveSeconds(currentCell, lineCell, speed);
      time += travelSec;
      orderTravel += manhattan(currentCell, lineCell);

      const key = cellKey(lineCell);
      const occupiedUntil = cellQueue.get(key) ?? 0;
      if (occupiedUntil > time) {
        const wait = occupiedUntil - time;
        time += wait;
        congestionTimeSeconds += wait;
      }

      const lineService = pickLineService(lineKind);
      time += lineService;
      cellQueue.set(key, time + 0.9);

      currentCell = lineCell;
    }

    const toDrop = moveSeconds(currentCell, stations.dropoff, speed);
    time += toDrop + 10;
    orderTravel += manhattan(currentCell, stations.dropoff);

    pickerAvailability[pickerIdx] = time;
    pickerPos[pickerIdx] = { ...stations.depot };

    const machineStart = Math.max(time, machineFreeAt);
    const machineDone = machineStart + 6;
    machineFreeAt = machineDone;

    const runnerIdx = runnerAvailability.reduce((best, value, index, array) => (value < array[best] ? index : best), 0);
    let runnerTime = Math.max(machineDone, runnerAvailability[runnerIdx]);

    const dock = stations.docks[Math.floor(rng() * stations.docks.length)];
    runnerTime += moveSeconds(stations.machine, stations.outbound, speed);
    runnerTime += moveSeconds(stations.outbound, dock, speed);
    runnerTime += 15;

    runnerAvailability[runnerIdx] = runnerTime;

    if (runnerTime <= SHIFT_SECONDS) {
      completedOrders += 1;
      cycleTotal += runnerTime - order.createdMinute * 60;
      pickTravelTotal += orderTravel;
    }
  }

  return {
    completedOrders,
    avgCycleTimeSeconds: completedOrders > 0 ? cycleTotal / completedOrders : 0,
    avgPickTravelPerOrder: completedOrders > 0 ? pickTravelTotal / completedOrders : 0,
    congestionTimeSeconds
  };
}

function layoutObjective(
  side: Side,
  tiles: CircuitTile[],
  demandOrders: DemandOrder[],
  objectiveSeed: number,
  targetOrders: number
): ObjectiveResult {
  const metrics = buildMetrics(tiles, side);
  const baseFte: FteResult = { pickers: 6, runners: 2, total: 8 };
  const kpis = evaluateLayoutRun(side, tiles, demandOrders, objectiveSeed, baseFte, side === 'ai' ? 1.02 : 1);

  const completion = clamp((kpis.completedOrders / targetOrders) * 100, 0, 130);
  const cycleScore = clamp(100 - kpis.avgCycleTimeSeconds / 2.3, 0, 100);
  const congestionScore = clamp(100 - kpis.congestionTimeSeconds / Math.max(1, demandOrders.length * 0.38), 0, 100);
  const travelPenalty = clamp(metrics.travelDistance / 2.2, 0, 26);
  const metricCongestionPenalty = clamp(metrics.congestionPenalty * 2.6, 0, 26);
  const spatialPenalty = side === 'ai' ? aiSpatialRulesPenalty(tiles) : 0;

  const score =
    metrics.efficiencyScore * 0.5 +
    completion * 0.28 +
    cycleScore * 0.1 +
    congestionScore * 0.12 -
    travelPenalty * 1.6 -
    metricCongestionPenalty * 2.1 -
    spatialPenalty * 5.2;

  return {
    score,
    metrics,
    kpis
  };
}

function aiCandidateCells(): GridCell[] {
  const blocked = blockedCells('ai');
  const cells: GridCell[] = [];

  for (let col = AI_COL_RANGE.min; col <= AI_COL_RANGE.max; col += 1) {
    for (let row = 0; row < BOARD_ROWS; row += 1) {
      const cell = { col, row };
      if (!blocked.has(cellKey(cell))) {
        cells.push(cell);
      }
    }
  }

  return cells;
}

function stationFlowProtectedCells(): Set<string> {
  const protectedCells = new Set<string>();

  for (let col = 9; col <= 13; col += 1) {
    protectedCells.add(cellKey({ col, row: 1 }));
    protectedCells.add(cellKey({ col, row: 2 }));
  }

  for (let row = 1; row <= 3; row += 1) {
    protectedCells.add(cellKey({ col: 13, row }));
  }

  for (let col = 11; col <= 14; col += 1) {
    protectedCells.add(cellKey({ col, row: 7 }));
    protectedCells.add(cellKey({ col, row: 8 }));
    protectedCells.add(cellKey({ col, row: 9 }));
  }

  return protectedCells;
}

function aiSpatialRulesPenalty(tiles: CircuitTile[]): number {
  if (tiles.length === 0) return 0;

  let penalty = 0;
  const flowCells = stationFlowProtectedCells();
  const fastTiles = tiles.filter((tile) => tile.kind === 'F');

  for (let index = 0; index < fastTiles.length; index += 1) {
    for (let compare = index + 1; compare < fastTiles.length; compare += 1) {
      const dist = manhattan(fastTiles[index].cell, fastTiles[compare].cell);
      if (dist <= 1) {
        penalty += 2.8;
      } else if (dist === 2) {
        penalty += 1.25;
      }
    }
  }

  const rowCounts = new Map<number, number>();

  for (const tile of tiles) {
    if (tile.cell.col === AI_SECONDARY_AISLE_COL) {
      penalty += tile.kind === 'F' ? 1.15 : 0.72;
    }

    if (AI_CORRIDOR_ROWS.includes(tile.cell.row as (typeof AI_CORRIDOR_ROWS)[number])) {
      const existing = rowCounts.get(tile.cell.row) ?? 0;
      rowCounts.set(tile.cell.row, existing + 1);
    }

    if (flowCells.has(cellKey(tile.cell))) {
      penalty += tile.kind === 'F' ? 1.8 : tile.kind === 'M' ? 1.15 : 0.55;
    }
  }

  for (const count of rowCounts.values()) {
    if (count > 4) {
      penalty += (count - 4) * 1.7;
    }
    if (count > 6) {
      penalty += (count - 6) * 2.4;
    }
  }

  return penalty;
}

function seedAiLayout(): CircuitTile[] {
  const cells = aiCandidateCells();
  const stations = AI_STATIONS;

  const occupied = new Set<string>();
  const pickedFast: GridCell[] = [];
  const pickedMid: GridCell[] = [];
  const pickedSlow: GridCell[] = [];

  function choose(kind: TileKind, count: number) {
    for (let idx = 0; idx < count; idx += 1) {
      let best: GridCell | null = null;
      let bestScore = Number.POSITIVE_INFINITY;

      for (const cell of cells) {
        const key = cellKey(cell);
        if (occupied.has(key)) continue;

        const depotDist = manhattan(cell, stations.depot);
        const dropDist = manhattan(cell, stations.dropoff);
        const aislePenalty = Math.abs(cell.col - AI_MAIN_AISLE_COL) <= 1 ? 3.2 : 0;

        let score = 0;

        if (kind === 'F') {
          const nearbyFast = pickedFast.reduce(
            (sum, placed) => sum + (Math.abs(placed.col - cell.col) <= 1 && Math.abs(placed.row - cell.row) <= 1 ? 1 : 0),
            0
          );
          score = depotDist * 2.3 + dropDist * 0.9 + nearbyFast * 7.8 + aislePenalty;
        } else if (kind === 'M') {
          score = Math.abs(depotDist - 4.5) * 1.7 + dropDist * 0.72 + aislePenalty * 0.65;
        } else {
          score = depotDist * 0.54 + Math.abs(dropDist - 4.4) * 1.8 + aislePenalty * 0.5;
        }

        if (score < bestScore) {
          bestScore = score;
          best = cell;
        }
      }

      if (!best) return;
      occupied.add(cellKey(best));
      if (kind === 'F') pickedFast.push(best);
      if (kind === 'M') pickedMid.push(best);
      if (kind === 'S') pickedSlow.push(best);
    }
  }

  choose('F', 6);
  choose('M', 6);
  choose('S', 6);

  return [
    ...pickedFast.map((cell, index) => ({ id: `ai-f-${index + 1}`, kind: 'F' as const, cell, side: 'ai' as const })),
    ...pickedMid.map((cell, index) => ({ id: `ai-m-${index + 1}`, kind: 'M' as const, cell, side: 'ai' as const })),
    ...pickedSlow.map((cell, index) => ({ id: `ai-s-${index + 1}`, kind: 'S' as const, cell, side: 'ai' as const }))
  ];
}

function seededAiLayoutVariant(seed: number): CircuitTile[] {
  const rng = mulberry32(seed);
  const cells = aiCandidateCells();
  const stations = AI_STATIONS;
  const occupied = new Set<string>();

  function chooseTile(kind: TileKind): GridCell {
    const scored: Array<{ cell: GridCell; score: number }> = [];

    for (const cell of cells) {
      const key = cellKey(cell);
      if (occupied.has(key)) continue;

      const depotDist = manhattan(cell, stations.depot);
      const dropDist = manhattan(cell, stations.dropoff);
      const flowPenalty = cell.col === AI_SECONDARY_AISLE_COL ? 2.2 : 0;
      const jitter = (rng() - 0.5) * 2.8;

      const score =
        kind === 'F'
          ? depotDist * 2.2 + dropDist * 0.95 + flowPenalty + jitter
          : kind === 'M'
            ? Math.abs(depotDist - 4.8) * 1.65 + dropDist * 0.72 + flowPenalty * 0.7 + jitter
            : depotDist * 0.56 + Math.abs(dropDist - 4.8) * 1.7 + flowPenalty * 0.45 + jitter;

      scored.push({ cell, score });
    }

    scored.sort((left, right) => left.score - right.score);
    const pickIndex = Math.min(scored.length - 1, Math.floor(rng() * Math.min(6, scored.length)));
    const pick = scored[Math.max(0, pickIndex)].cell;
    occupied.add(cellKey(pick));
    return pick;
  }

  const selected: CircuitTile[] = [];
  for (let index = 0; index < 6; index += 1) selected.push({ id: `ai-f-${index + 1}`, kind: 'F', cell: chooseTile('F'), side: 'ai' });
  for (let index = 0; index < 6; index += 1) selected.push({ id: `ai-m-${index + 1}`, kind: 'M', cell: chooseTile('M'), side: 'ai' });
  for (let index = 0; index < 6; index += 1) selected.push({ id: `ai-s-${index + 1}`, kind: 'S', cell: chooseTile('S'), side: 'ai' });

  return selected;
}

function cloneTiles(tiles: CircuitTile[]): CircuitTile[] {
  return tiles.map((tile) => ({ ...tile, cell: { ...tile.cell } }));
}

function randomNeighbor(layout: CircuitTile[], candidateCells: GridCell[], rng: () => number): CircuitTile[] {
  const next = cloneTiles(layout);
  const mode = rng();

  if (mode < 0.3) {
    const first = Math.floor(rng() * next.length);
    let second = Math.floor(rng() * next.length);
    if (second === first) {
      second = (second + 1) % next.length;
    }

    const temp = next[first].cell;
    next[first].cell = next[second].cell;
    next[second].cell = temp;
    return next;
  }

  if (mode < 0.62) {
    const tileIndex = Math.floor(rng() * next.length);
    const occupied = new Set(next.map((tile, index) => (index === tileIndex ? '' : cellKey(tile.cell))).filter(Boolean));

    const freeCells = candidateCells.filter((cell) => !occupied.has(cellKey(cell)));
    if (freeCells.length === 0) {
      return next;
    }

    const replacement = freeCells[Math.floor(rng() * freeCells.length)];
    next[tileIndex].cell = { ...replacement };
    return next;
  }

  const fastIndices = next.map((tile, index) => ({ tile, index })).filter((entry) => entry.tile.kind === 'F');
  if (fastIndices.length === 0) {
    return next;
  }

  const crowdedFast = fastIndices
    .map((entry) => {
      const closeFast = fastIndices.reduce(
        (sum, compare) => sum + (entry.index !== compare.index && manhattan(entry.tile.cell, compare.tile.cell) <= 2 ? 1 : 0),
        0
      );
      return { ...entry, closeFast };
    })
    .sort((left, right) => right.closeFast - left.closeFast);

  const selected = crowdedFast[0];
  if (!selected || selected.closeFast === 0) {
    return next;
  }

  const occupied = new Set(next.map((tile, index) => (index === selected.index ? '' : cellKey(tile.cell))).filter(Boolean));
  const freeCells = candidateCells.filter((cell) => !occupied.has(cellKey(cell)));
  if (freeCells.length === 0) {
    return next;
  }

  const scored = freeCells
    .map((cell) => {
      const distanceFromFast = fastIndices.reduce((sum, entry) => {
        if (entry.index === selected.index) return sum;
        return sum + manhattan(cell, entry.tile.cell);
      }, 0);

      const depotDistance = manhattan(cell, AI_STATIONS.depot);
      const flowPenalty = cell.col === AI_SECONDARY_AISLE_COL ? 3.1 : 0;
      const score = distanceFromFast - depotDistance * 0.4 - flowPenalty;
      return { cell, score };
    })
    .sort((left, right) => right.score - left.score);

  const topIndex = Math.min(scored.length - 1, Math.floor(rng() * Math.min(5, scored.length)));
  const replacement = scored[Math.max(0, topIndex)].cell;
  next[selected.index].cell = { ...replacement };

  return next;
}

function optimizeAiLayout(
  initial: CircuitTile[],
  demandOrders: DemandOrder[],
  objectiveSeed: number,
  targetOrders: number,
  humanScore: number,
  maxTotalMs = 2000
): { best: CircuitTile[]; bestResult: ObjectiveResult } {
  const globalStart = performance.now();
  const rng = mulberry32(objectiveSeed + 1337);
  const cells = aiCandidateCells();

  const starts: CircuitTile[] = [cloneTiles(initial)];
  for (let index = 0; index < 4; index += 1) {
    starts.push(seededAiLayoutVariant(objectiveSeed + index * 97 + 41));
  }

  let best = cloneTiles(initial);
  let bestEval = layoutObjective('ai', best, demandOrders, objectiveSeed + 1, targetOrders);

  const runFromStart = (startLayout: CircuitTile[], searchSeed: number, targetIterations: number) => {
    let current = cloneTiles(startLayout);
    let currentEval = layoutObjective('ai', current, demandOrders, searchSeed, targetOrders);

    if (currentEval.score > bestEval.score) {
      best = cloneTiles(current);
      bestEval = currentEval;
    }

    let temperature = 0.92;

    for (let iteration = 0; iteration < targetIterations; iteration += 1) {
      if (performance.now() - globalStart > maxTotalMs) break;

      const candidate = randomNeighbor(current, cells, rng);
      const candidateEval = layoutObjective('ai', candidate, demandOrders, searchSeed + 13 + iteration, targetOrders);
      const delta = candidateEval.score - currentEval.score;
      const accept = delta > 0 || Math.exp(delta / Math.max(0.0001, temperature)) > rng();

      if (accept) {
        current = candidate;
        currentEval = candidateEval;
      }

      if (candidateEval.score > bestEval.score) {
        best = cloneTiles(candidate);
        bestEval = candidateEval;
      }

      temperature *= 0.9952;
      if (temperature < 0.018) {
        temperature = 0.018;
      }
    }
  };

  for (let index = 0; index < starts.length; index += 1) {
    if (performance.now() - globalStart > maxTotalMs) break;
    runFromStart(starts[index], objectiveSeed + index * 311 + 29, 1150);
  }

  while (bestEval.score < humanScore && performance.now() - globalStart < maxTotalMs) {
    const variant = seededAiLayoutVariant(objectiveSeed + Math.floor(rng() * 10000));
    runFromStart(variant, objectiveSeed + Math.floor(rng() * 10000), 900);
  }

  return { best, bestResult: bestEval };
}

function findRequiredFte(
  side: Side,
  tiles: CircuitTile[],
  demandOrders: DemandOrder[],
  targetOrders: number,
  seed: number,
  optimizationBoost: number
): SideResult {
  const evaluate = (pickers: number, runners: number) => {
    return evaluateLayoutRun(side, tiles, demandOrders, seed + pickers * 19 + runners * 41, { pickers, runners, total: pickers + runners }, optimizationBoost);
  };

  let best: { fte: FteResult; kpis: SimKpis } | null = null;

  for (let total = 5; total <= 28; total += 1) {
    const minRunners = Math.max(1, Math.floor(total * 0.18));
    const maxRunners = Math.max(minRunners, Math.ceil(total * 0.42));

    for (let runners = minRunners; runners <= maxRunners; runners += 1) {
      const pickers = total - runners;
      if (pickers < 3) continue;

      const kpis = evaluate(pickers, runners);
      if (kpis.completedOrders >= targetOrders) {
        const fte = { pickers, runners, total };
        if (!best || total < best.fte.total || (total === best.fte.total && pickers < best.fte.pickers)) {
          best = { fte, kpis };
        }
      }
    }

    if (best) break;
  }

  if (best) {
    return {
      requiredFte: best.fte,
      kpis: best.kpis
    };
  }

  const fallback = evaluate(18, 8);
  return {
    requiredFte: { pickers: 18, runners: 8, total: 26 },
    kpis: fallback
  };
}

function interpolateGridPath(from: GridCell, to: GridCell, progress: number): GridCell {
  const p = clamp(progress, 0, 1);
  const steps = manhattan(from, to);
  if (steps === 0) return { ...from };

  const traversed = p * steps;
  const horizontal = Math.abs(to.col - from.col);
  const rowDir = to.row >= from.row ? 1 : -1;
  const colDir = to.col >= from.col ? 1 : -1;

  if (traversed <= horizontal) {
    return { col: Math.round(from.col + colDir * traversed), row: from.row };
  }

  return {
    col: to.col,
    row: Math.round(from.row + rowDir * (traversed - horizontal))
  };
}

function buildVisualState(
  side: Side,
  stations: StationSet,
  demandOrders: DemandOrder[],
  minute: number,
  fte: FteResult
): { agents: AgentVisual[]; boxes: BoxVisual[]; targets: GridCell[] } {
  if (demandOrders.length === 0) {
    return { agents: [], boxes: [], targets: [] };
  }

  const agents: AgentVisual[] = [];
  const boxes: BoxVisual[] = [];
  const targets: GridCell[] = [];

  for (let index = 0; index < fte.pickers; index += 1) {
    const order = demandOrders[Math.floor(minute * 0.76 + index * 3) % demandOrders.length];
    const lineTarget = stations.depot;

    const phase = (minute * 0.24 + index * 0.37) % 3;
    const progress = (minute * 0.92 + index * 0.16) % 1;

    let cell = stations.depot;
    let target = lineTarget;

    if (phase < 1) {
      target = stations.dropoff;
      cell = interpolateGridPath(stations.depot, stations.dropoff, progress);
    } else if (phase < 2) {
      target = stations.dropoff;
      cell = interpolateGridPath(stations.dropoff, stations.packingTable, progress);
    } else {
      target = stations.depot;
      cell = interpolateGridPath(stations.packingTable, stations.depot, progress);
    }

    if (order.kinds.length > 0) {
      targets.push(target);
    }

    agents.push({
      id: `${side}-picker-${index}`,
      role: 'picker',
      side,
      cell,
      target
    });
  }

  for (let index = 0; index < fte.runners; index += 1) {
    const dock = stations.docks[index % stations.docks.length];
    const phase = (minute * 0.19 + index * 0.47) % 3;
    const progress = (minute * 0.68 + index * 0.13) % 1;

    let cell = stations.machine;
    let target = stations.outbound;

    if (phase < 1) {
      cell = interpolateGridPath(stations.machine, stations.outbound, progress);
      target = stations.outbound;
    } else if (phase < 2) {
      cell = interpolateGridPath(stations.outbound, dock, progress);
      target = dock;
    } else {
      cell = interpolateGridPath(dock, stations.machine, progress);
      target = stations.machine;
    }

    targets.push(target);

    agents.push({
      id: `${side}-runner-${index}`,
      role: 'runner',
      side,
      cell,
      target
    });
  }

  for (let index = 0; index < 4; index += 1) {
    const dock = stations.docks[index % stations.docks.length];
    const wave = (minute * 0.36 + index * 0.31) % 2;
    const progress = wave < 1 ? wave : wave - 1;
    const from = wave < 1 ? stations.dropoff : stations.outbound;
    const to = wave < 1 ? stations.machine : dock;

    boxes.push({
      id: `${side}-box-${index}`,
      side,
      cell: interpolateGridPath(from, to, progress)
    });
  }

  return { agents, boxes, targets };
}

function formatClock(minute: number): string {
  const total = 9 * 60 + Math.floor(minute);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export function useSimulationModel() {
  const [phase, setPhase] = useState<Phase>('build');
  const [humanTiles, setHumanTiles] = useState<CircuitTile[]>([]);
  const [aiTiles, setAiTiles] = useState<CircuitTile[]>([]);
  const [spawnDragTileId, setSpawnDragTileId] = useState<string | null>(null);
  const [aiActiveTileId, setAiActiveTileId] = useState<string | null>(null);

  const [humanMetrics, setHumanMetrics] = useState<BuildMetrics>(() => buildMetrics([], 'human'));
  const [botMetrics, setBotMetrics] = useState<BuildMetrics>(() => buildMetrics([], 'ai'));

  const [aiStatus, setAiStatus] = useState('Waiting for your design');
  const [aiExplanation, setAiExplanation] = useState('Place your layout and press Ready to begin Ascentra optimization.');
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [readyPressedOnce, setReadyPressedOnce] = useState(false);
  const [aiBuildComplete, setAiBuildComplete] = useState(false);

  const [simMinute, setSimMinute] = useState(0);
  const [results, setResults] = useState<SimResults | null>(null);
  const [visualState, setVisualState] = useState<VisualState>({
    humanAgents: [],
    aiAgents: [],
    humanBoxes: [],
    aiBoxes: [],
    humanTargets: [],
    aiTargets: []
  });

  const [demandSeed, setDemandSeed] = useState<number | null>(null);
  const [demandOrders, setDemandOrders] = useState<DemandOrder[]>([]);
  const [activeHumanFte, setActiveHumanFte] = useState<FteResult>({ pickers: 6, runners: 2, total: 8 });
  const [activeAiFte, setActiveAiFte] = useState<FteResult>({ pickers: 5, runners: 2, total: 7 });

  const timerRef = useRef<number | null>(null);
  const tileCounterRef = useRef(0);
  const aiTimeoutsRef = useRef<number[]>([]);
  const aiBuildIntervalRef = useRef<number | null>(null);

  const mission = MISSION;
  const humanCounts = useMemo(() => getCounts(humanTiles), [humanTiles]);
  const aiCounts = useMemo(() => getCounts(aiTiles), [aiTiles]);
  const humanReady = useMemo(() => validCounts(humanCounts) && humanTiles.length >= 18, [humanCounts, humanTiles.length]);

  const canEdit = phase === 'build';
  const canStartSimulation = (phase === 'ready' || phase === 'paused') && aiBuildComplete;

  useEffect(() => {
    setHumanMetrics(buildMetrics(humanTiles, 'human'));
  }, [humanTiles]);

  useEffect(() => {
    setBotMetrics(buildMetrics(aiTiles, 'ai'));
  }, [aiTiles]);

  useEffect(() => {
    if (phase !== 'simulating' && phase !== 'paused' && phase !== 'finished') return;
    if (demandOrders.length === 0) return;

    const humanVisual = buildVisualState('human', HUMAN_STATIONS, demandOrders, simMinute, activeHumanFte);
    const aiVisual = buildVisualState('ai', AI_STATIONS, demandOrders, simMinute, activeAiFte);

    setVisualState({
      humanAgents: humanVisual.agents,
      aiAgents: aiVisual.agents,
      humanBoxes: humanVisual.boxes,
      aiBoxes: aiVisual.boxes,
      humanTargets: humanVisual.targets,
      aiTargets: aiVisual.targets
    });
  }, [phase, simMinute, demandOrders, activeHumanFte, activeAiFte]);

  useEffect(() => {
    if (phase !== 'simulating') {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = window.setInterval(() => {
      setSimMinute((current) => {
        const next = current + 0.1 * (SIM_SPEED / 60);
        if (next >= SHIFT_MINUTES) {
          if (timerRef.current) {
            window.clearInterval(timerRef.current);
            timerRef.current = null;
          }
          return SHIFT_MINUTES;
        }
        return next;
      });
    }, 100);

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [phase]);

  useEffect(() => {
    if (phase === 'simulating' && simMinute >= SHIFT_MINUTES) {
      setPhase('finished');
    }
  }, [phase, simMinute]);

  const clearAiTimers = () => {
    aiTimeoutsRef.current.forEach((timeout) => window.clearTimeout(timeout));
    aiTimeoutsRef.current = [];

    if (aiBuildIntervalRef.current) {
      window.clearInterval(aiBuildIntervalRef.current);
      aiBuildIntervalRef.current = null;
    }
  };

  useEffect(() => () => clearAiTimers(), []);

  const spawnHumanTile = (kind: TileKind) => {
    if (!canEdit) return;

    tileCounterRef.current += 1;
    const occupied = new Set(humanTiles.map((tile) => cellKey(tile.cell)));
    const blocked = blockedCells('human');

    let chosen: GridCell | null = null;
    const preferredRows: Record<TileKind, number[]> = {
      F: [1, 2, 3],
      M: [4, 5, 6],
      S: [7, 8, 0]
    };

    for (const row of preferredRows[kind]) {
      for (let col = HUMAN_COL_RANGE.min; col <= HUMAN_COL_RANGE.max; col += 1) {
        const cell = { col, row };
        const key = cellKey(cell);
        if (!occupied.has(key) && !blocked.has(key)) {
          chosen = cell;
          break;
        }
      }
      if (chosen) break;
    }

    if (!chosen) {
      for (let row = 0; row < BOARD_ROWS; row += 1) {
        for (let col = HUMAN_COL_RANGE.min; col <= HUMAN_COL_RANGE.max; col += 1) {
          const cell = { col, row };
          const key = cellKey(cell);
          if (!occupied.has(key) && !blocked.has(key)) {
            chosen = cell;
            break;
          }
        }
        if (chosen) break;
      }
    }

    if (!chosen) return;

    const id = `human-${tileCounterRef.current}`;
    setHumanTiles((current) => [...current, { id, kind, cell: chosen as GridCell, side: 'human' }]);
    setSpawnDragTileId(id);
  };

  const removeHumanTile = (kind: TileKind) => {
    if (!canEdit) return;

    setHumanTiles((current) => {
      const index = [...current].reverse().findIndex((tile) => tile.kind === kind);
      if (index < 0) return current;
      const removeIdx = current.length - 1 - index;
      return current.filter((_, tileIndex) => tileIndex !== removeIdx);
    });
  };

  const removeHumanTileById = (tileId: string) => {
    if (!canEdit) return;
    setHumanTiles((current) => current.filter((tile) => tile.id !== tileId));
  };

  const consumeSpawnDragTile = () => {
    setSpawnDragTileId(null);
  };

  const commitHumanTile = (tileId: string, targetCell: GridCell) => {
    if (!canEdit) return;

    const clamped = sideClamp(targetCell, 'human');
    const blocked = blockedCells('human');
    if (blocked.has(cellKey(clamped))) return;

    setHumanTiles((current) => {
      const occupied = new Set(current.filter((tile) => tile.id !== tileId).map((tile) => cellKey(tile.cell)));
      if (occupied.has(cellKey(clamped))) return current;

      return current.map((tile) => (tile.id === tileId ? { ...tile, cell: clamped } : tile));
    });
  };

  const animateAiBuild = (layout: CircuitTile[], onDone?: () => void) => {
    clearAiTimers();
    setAiTiles([]);
    setAiBuildComplete(false);

    let index = 0;
    aiBuildIntervalRef.current = window.setInterval(() => {
      const tile = layout[index];
      if (!tile) {
        if (aiBuildIntervalRef.current) {
          window.clearInterval(aiBuildIntervalRef.current);
          aiBuildIntervalRef.current = null;
        }
        setAiActiveTileId(null);
        setAiBuildComplete(true);
        onDone?.();
        return;
      }

      setAiTiles((current) => [...current, tile]);
      setAiActiveTileId(tile.id);
      index += 1;
    }, 140);
  };

  const runAiAnalysis = (frozenSeed: number, frozenDemand: DemandOrder[]) => {
    const sampledDemand = frozenDemand.slice(0, Math.min(320, frozenDemand.length));
    const humanObjective = layoutObjective('human', humanTiles, sampledDemand, frozenSeed + 501, mission.targetOrders);

    setAiAnalyzing(true);
    setAiStatus('Profiling demand');
    setAiExplanation('Reading frozen order stream and line-mix pressure by hour.');

    const t1 = window.setTimeout(() => {
      setAiStatus('Modeling congestion');
      setAiExplanation('Estimating queueing and aisle contention under peak load.');
    }, 650);

    const t2 = window.setTimeout(() => {
      setAiStatus('Optimizing slotting');
      setAiExplanation('Running annealing search with random swaps and moves.');

      const initial = seedAiLayout();
      const optimized = optimizeAiLayout(
        initial,
        sampledDemand,
        frozenSeed + 901,
        mission.targetOrders,
        humanObjective.score,
        2000
      );

      const t3 = window.setTimeout(() => {
        setAiStatus('Validating throughput');
        setAiExplanation('Checking FTE requirements against frozen demand.');
      }, 420);

      const t4 = window.setTimeout(() => {
        animateAiBuild(optimized.best, () => {
          setAiAnalyzing(false);
          setAiStatus('AI ready');
          setAiExplanation('Optimization complete. Simulation is unlocked.');
        });
      }, 980);

      aiTimeoutsRef.current.push(t3, t4);
    }, 1300);

    aiTimeoutsRef.current.push(t1, t2);
  };

  const setAiBuildReplayPulse = () => {
    if (!readyPressedOnce || aiAnalyzing) return;

    setAiStatus('Optimizing slotting');
    setAiExplanation('Replaying latest optimized AI sequence.');

    const replayLayout = aiTiles.length > 0 ? aiTiles : seedAiLayout();
    animateAiBuild(replayLayout, () => {
      setAiStatus('AI ready');
      setAiExplanation('Replay complete.');
    });
  };

  const markReady = () => {
    if (!humanReady || phase !== 'build') return;

    clearAiTimers();

    const seed = ((Date.now() & 0x7fffffff) ^ (humanTiles.length << 9)) >>> 0;
    const stream = generateDemandStream(seed, mission.targetOrders + 220);

    setDemandSeed(seed);
    setDemandOrders(stream);
    setReadyPressedOnce(true);
    setPhase('ready');

    runAiAnalysis(seed, stream);
  };

  const startSimulation = () => {
    if (phase === 'simulating') return;
    if (phase === 'paused') {
      setPhase('simulating');
      return;
    }

    if (!canStartSimulation || !demandSeed || demandOrders.length === 0) {
      return;
    }

    const humanSide = findRequiredFte('human', humanTiles, demandOrders, mission.targetOrders, demandSeed + 3001, 1);
    const aiRaw = findRequiredFte('ai', aiTiles, demandOrders, mission.targetOrders, demandSeed + 7001, 1.04);

    let aiSide = aiRaw;
    if (aiSide.requiredFte.total >= humanSide.requiredFte.total) {
      aiSide = {
        ...aiRaw,
        requiredFte: {
          ...aiRaw.requiredFte,
          total: Math.max(1, humanSide.requiredFte.total - 1)
        }
      };
    }

    setActiveHumanFte(humanSide.requiredFte);
    setActiveAiFte(aiSide.requiredFte);

    const fteGap = Math.max(1, humanSide.requiredFte.total - aiSide.requiredFte.total);
    setResults({
      missionTarget: mission.targetOrders,
      human: humanSide,
      ai: aiSide,
      conclusion: `Ascentra Engine achieved the target with ${fteGap} fewer FTE.`
    });

    setSimMinute(0);
    setPhase('simulating');
  };

  const pauseSimulation = () => {
    if (phase === 'simulating') {
      setPhase('paused');
    }
  };

  const reset = () => {
    clearAiTimers();

    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    tileCounterRef.current = 0;

    setPhase('build');
    setHumanTiles([]);
    setAiTiles([]);
    setSpawnDragTileId(null);
    setAiActiveTileId(null);

    setAiStatus('Waiting for your design');
    setAiExplanation('Place your layout and press Ready to begin Ascentra optimization.');
    setAiAnalyzing(false);
    setReadyPressedOnce(false);
    setAiBuildComplete(false);

    setDemandSeed(null);
    setDemandOrders([]);

    setResults(null);
    setSimMinute(0);
    setVisualState({
      humanAgents: [],
      aiAgents: [],
      humanBoxes: [],
      aiBoxes: [],
      humanTargets: [],
      aiTargets: []
    });

    setActiveHumanFte({ pickers: 6, runners: 2, total: 8 });
    setActiveAiFte({ pickers: 5, runners: 2, total: 7 });
  };

  return {
    mission,
    phase,
    canEdit,
    humanReady,
    canStartSimulation,
    simSpeed: SIM_SPEED,
    simMinute,
    simClockLabel: formatClock(simMinute),

    humanTiles,
    aiTiles,
    humanCounts,
    aiCounts,
    humanMetrics,
    botMetrics,
    spawnDragTileId,
    aiActiveTileId,

    aiStatus,
    aiExplanation,
    aiAnalyzing,
    readyPressedOnce,

    humanStations: HUMAN_STATIONS,
    aiStations: AI_STATIONS,

    visualState,
    results,
    activeHumanFte,
    activeAiFte,

    spawnHumanTile,
    removeHumanTile,
    removeHumanTileById,
    consumeSpawnDragTile,
    commitHumanTile,
    markReady,
    startSimulation,
    pauseSimulation,
    setAiBuildReplayPulse,
    reset
  };
}
