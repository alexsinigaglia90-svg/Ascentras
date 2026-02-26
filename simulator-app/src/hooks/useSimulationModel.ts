import { useEffect, useMemo, useRef, useState } from 'react';

export const BOARD_COLS = 16;
export const BOARD_ROWS = 10;
export const CELL_SIZE = 1;
export const PICK_ZONE_ROW_RANGE = { min: 0, max: 5 };
export const SAFETY_AISLE_ROW = 6;
export const MACHINE_ZONE_ROW_RANGE = { min: 7, max: BOARD_ROWS - 1 };

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

export type PalletVisual = {
  id: string;
  side: Side;
  kind: TileKind;
  cell: GridCell;
  fillLevel: number;
  isEmpty: boolean;
  replenishmentRequested: boolean;
  replenishing: boolean;
};

export type ReachTruckVisual = {
  id: string;
  side: Side;
  cell: GridCell;
  target: GridCell;
  carrying: boolean;
  mode: 'idle' | 'roam' | 'to-pallet' | 'refill' | 'to-storage';
};

type PickerEvent = {
  pickerId: string;
  kind: TileKind;
  cell: GridCell;
  eventStamp: number;
};

type PalletRuntime = {
  id: string;
  kind: TileKind;
  cell: GridCell;
  fillLevel: number;
  replenishmentRequested: boolean;
  replenishing: boolean;
};

type ReachTruckRuntime = {
  id: string;
  side: Side;
  homeCell: GridCell;
  cell: GridCell;
  target: GridCell;
  carrying: boolean;
  mode: 'idle' | 'roam' | 'to-pallet' | 'refill' | 'to-storage';
  taskPalletId: string | null;
  modeStartMinute: number;
  modeDurationMinutes: number;
  fromCell: GridCell;
  roamDecisionMinute: number;
};

type SideRuntime = {
  pallets: Record<string, PalletRuntime>;
  replenishQueue: string[];
  pickerEventStamps: Record<string, number>;
  reachTrucks: ReachTruckRuntime[];
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
  humanPallets: PalletVisual[];
  aiPallets: PalletVisual[];
  humanReachTrucks: ReachTruckVisual[];
  aiReachTrucks: ReachTruckVisual[];
  humanTargets: GridCell[];
  aiTargets: GridCell[];
  humanRuntime: SideRuntime;
  aiRuntime: SideRuntime;
};

type ObjectiveResult = {
  score: number;
  fairScore: number;
  structurePenalty: number;
  metrics: BuildMetrics;
  kpis: SimKpis;
};

type AiStrategyKey = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

const SHIFT_MINUTES = 8 * 60;
const SHIFT_SECONDS = SHIFT_MINUTES * 60;
const SIM_SPEED = 60;
const REQUIRED_COUNTS: BuildCounts = { F: 6, M: 6, S: 6 };
const AI_MAIN_AISLE_COL = 12;
const AI_SECONDARY_AISLE_COL = 10;
const AI_CORRIDOR_ROWS = [2, 5, 8] as const;
const AI_KPI_NORMALIZATION = 1.34;
const PALLET_MAX_FILL = 100;
const REPLENISH_MOVE_CELLS_PER_MIN = 2.6;
const REPLENISH_ROAM_CELLS_PER_MIN = 1.15;
const REPLENISH_REFILL_MINUTES = 1.2;
const REPLENISH_ROAM_PAUSE_MINUTES = 0.55;
const TRUCKS_PER_SIDE = 2;

const DEPLETION_PER_PICK: Record<TileKind, number> = {
  F: 4.6,
  M: 3.6,
  S: 2.8
};

const MISSION: Mission = {
  startLabel: '09:00',
  endLabel: '17:00',
  targetOrders: 1200
};

const HUMAN_STATIONS: StationSet = {
  depot: { col: 1, row: 7 },
  dropoff: { col: 3, row: 7 },
  packingTable: { col: 4, row: 8 },
  machine: { col: 6, row: 8 },
  outbound: { col: 2, row: 9 },
  docks: [
    { col: 1, row: 9 },
    { col: 4, row: 9 },
    { col: 7, row: 9 }
  ]
};

const AI_STATIONS: StationSet = {
  depot: { col: 9, row: 7 },
  dropoff: { col: 11, row: 7 },
  packingTable: { col: 12, row: 8 },
  machine: { col: 14, row: 8 },
  outbound: { col: 11, row: 9 },
  docks: [
    { col: 9, row: 9 },
    { col: 12, row: 9 },
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

function sideStorageCell(side: Side): GridCell {
  return side === 'human' ? { col: 0, row: 0 } : { col: BOARD_COLS - 1, row: 0 };
}

function sideTruckHomes(side: Side): GridCell[] {
  if (side === 'human') {
    return [
      { col: 0, row: 1 },
      { col: 1, row: 0 }
    ];
  }

  return [
    { col: BOARD_COLS - 1, row: 1 },
    { col: BOARD_COLS - 2, row: 0 }
  ];
}

function sideStorageRoamCells(side: Side): GridCell[] {
  const blocked = blockedCells(side);
  const cells: GridCell[] = [];
  const colRange = side === 'human' ? { min: 0, max: 2 } : { min: BOARD_COLS - 3, max: BOARD_COLS - 1 };

  for (let col = colRange.min; col <= colRange.max; col += 1) {
    for (let row = 0; row <= BOARD_ROWS - 2; row += 1) {
      const cell = sideClamp({ col, row }, side);
      if (!blocked.has(cellKey(cell))) {
        cells.push(cell);
      }
    }
  }

  if (cells.length === 0) {
    cells.push(sideStorageCell(side));
  }

  return cells;
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

function sidePickClamp(cell: GridCell, side: Side): GridCell {
  const cols = sideCols(side);
  return {
    col: clamp(cell.col, cols.min, cols.max),
    row: clamp(cell.row, PICK_ZONE_ROW_RANGE.min, PICK_ZONE_ROW_RANGE.max)
  };
}

function isPickZoneCell(cell: GridCell): boolean {
  return cell.row >= PICK_ZONE_ROW_RANGE.min && cell.row <= PICK_ZONE_ROW_RANGE.max;
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
  const baseFte: FteResult = { pickers: 6, runners: 2 };
  const kpis = evaluateLayoutRun(side, tiles, demandOrders, objectiveSeed, baseFte, side === 'ai' ? 1.22 : 1);
  const normalizedCompletedOrders = side === 'ai' ? kpis.completedOrders * AI_KPI_NORMALIZATION : kpis.completedOrders;

  const throughputScore = clamp((normalizedCompletedOrders / targetOrders) * 100, 0, 140);
  const cycleScore = clamp(100 - kpis.avgCycleTimeSeconds / 2.15, 0, 100);
  const travelScore = clamp(100 - kpis.avgPickTravelPerOrder * 2.25, 0, 100);
  const congestionScore = clamp(100 - kpis.congestionTimeSeconds / Math.max(1, demandOrders.length * 0.34), 0, 100);
  const zoningScore = clamp(50 + metrics.zoningScore * 17, 0, 100);
  const efficiencyScore = metrics.efficiencyScore;

  const fairScore =
    throughputScore * 0.5 +
    cycleScore * 0.16 +
    travelScore * 0.12 +
    congestionScore * 0.14 +
    efficiencyScore * 0.06 +
    zoningScore * 0.02;

  const structurePenalty =
    side === 'ai'
      ? aiSpatialRulesPenalty(tiles) * 0.32 + aiStationBalancePenalty(tiles) * 0.28 + aiCongestionRiskPenalty(tiles) * 0.35
      : 0;

  const score = fairScore - structurePenalty;

  return {
    score,
    fairScore,
    structurePenalty,
    metrics,
    kpis
  };
}

function aiCandidateCells(): GridCell[] {
  const blocked = blockedCells('ai');
  const cells: GridCell[] = [];

  for (let col = AI_COL_RANGE.min; col <= AI_COL_RANGE.max; col += 1) {
    for (let row = PICK_ZONE_ROW_RANGE.min; row <= PICK_ZONE_ROW_RANGE.max; row += 1) {
      const cell = { col, row };
      if (!blocked.has(cellKey(cell))) {
        cells.push(cell);
      }
    }
  }

  return cells;
}

function aiCorridorCells(): Set<string> {
  const corridor = new Set<string>();

  for (let col = AI_STATIONS.depot.col; col <= AI_STATIONS.dropoff.col; col += 1) {
    corridor.add(cellKey({ col, row: AI_STATIONS.depot.row }));
  }

  for (let row = AI_STATIONS.depot.row; row <= AI_STATIONS.dropoff.row; row += 1) {
    corridor.add(cellKey({ col: AI_STATIONS.dropoff.col, row }));
  }

  for (let row = AI_STATIONS.dropoff.row; row <= AI_STATIONS.machine.row; row += 1) {
    corridor.add(cellKey({ col: AI_STATIONS.dropoff.col, row }));
  }

  for (let col = AI_STATIONS.dropoff.col; col <= AI_STATIONS.machine.col; col += 1) {
    corridor.add(cellKey({ col, row: AI_STATIONS.machine.row }));
  }

  return corridor;
}

function aiDropMachineBufferCells(): Set<string> {
  const buffered = new Set<string>();
  const points = [AI_STATIONS.dropoff, AI_STATIONS.machine];

  for (const point of points) {
    for (let dc = -1; dc <= 1; dc += 1) {
      for (let dr = -1; dr <= 1; dr += 1) {
        if (dc === 0 && dr === 0) continue;
        const cell = sideClamp({ col: point.col + dc, row: point.row + dr }, 'ai');
        buffered.add(cellKey(cell));
      }
    }
  }

  return buffered;
}

function aiSerpentineRouteCells(): Set<string> {
  const route = new Set<string>();
  const minCol = AI_COL_RANGE.min;
  const maxCol = AI_COL_RANGE.max - 1;

  for (let row = 1; row < BOARD_ROWS; row += 2) {
    for (let col = minCol; col <= maxCol; col += 1) {
      route.add(cellKey({ col, row }));
    }
  }

  for (let row = 2; row < BOARD_ROWS - 1; row += 2) {
    const col = row % 4 === 0 ? minCol : maxCol;
    route.add(cellKey({ col, row }));
  }

  return route;
}

function hasFast3x3Cluster(tiles: CircuitTile[]): boolean {
  const fastSet = new Set(tiles.filter((tile) => tile.kind === 'F').map((tile) => cellKey(tile.cell)));
  if (fastSet.size < 4) return false;

  for (let col = AI_COL_RANGE.min; col <= AI_COL_RANGE.max - 2; col += 1) {
    for (let row = 0; row <= BOARD_ROWS - 3; row += 1) {
      let count = 0;
      for (let dc = 0; dc < 3; dc += 1) {
        for (let dr = 0; dr < 3; dr += 1) {
          if (fastSet.has(cellKey({ col: col + dc, row: row + dr }))) {
            count += 1;
          }
        }
      }
      if (count >= 4) {
        return true;
      }
    }
  }

  return false;
}

function isAiLayoutValid(tiles: CircuitTile[]): boolean {
  const occupied = new Set<string>();
  const blocked = blockedCells('ai');
  const corridor = aiCorridorCells();
  const buffer = aiDropMachineBufferCells();

  for (const tile of tiles) {
    const key = cellKey(tile.cell);
    if (occupied.has(key)) return false;
    if (!isPickZoneCell(tile.cell)) return false;
    if (blocked.has(key)) return false;
    if (corridor.has(key)) return false;
    if (buffer.has(key)) return false;
    occupied.add(key);
  }

  if (hasFast3x3Cluster(tiles)) return false;
  return true;
}

function buildAiTiles(fast: GridCell[], mid: GridCell[], slow: GridCell[]): CircuitTile[] {
  return [
    ...fast.map((cell, index) => ({ id: `ai-f-${index + 1}`, kind: 'F' as const, cell, side: 'ai' as const })),
    ...mid.map((cell, index) => ({ id: `ai-m-${index + 1}`, kind: 'M' as const, cell, side: 'ai' as const })),
    ...slow.map((cell, index) => ({ id: `ai-s-${index + 1}`, kind: 'S' as const, cell, side: 'ai' as const }))
  ];
}

function pickCellsByScore(
  count: number,
  allCells: GridCell[],
  occupied: Set<string>,
  scorer: (cell: GridCell, selected: GridCell[]) => number,
  rng: () => number,
  topK = 8
): GridCell[] {
  const selected: GridCell[] = [];

  for (let pick = 0; pick < count; pick += 1) {
    const scored = allCells
      .filter((cell) => !occupied.has(cellKey(cell)))
      .map((cell) => ({ cell, score: scorer(cell, selected) }))
      .sort((left, right) => left.score - right.score);

    if (scored.length === 0) {
      break;
    }

    const window = Math.min(topK, scored.length);
    const chosen = scored[Math.floor(rng() * window)].cell;
    occupied.add(cellKey(chosen));
    selected.push(chosen);
  }

  return selected;
}

function aiStrategyA(seed: number): CircuitTile[] {
  const rng = mulberry32(seed);
  const stations = AI_STATIONS;
  const forbidden = new Set<string>([...aiCorridorCells(), ...aiDropMachineBufferCells()]);
  const cells = aiCandidateCells().filter((cell) => !forbidden.has(cellKey(cell)));
  const occupied = new Set<string>();

  const fast = pickCellsByScore(
    6,
    cells,
    occupied,
    (cell, selected) => {
      const packDist = manhattan(cell, stations.packingTable);
      const dropDist = manhattan(cell, stations.dropoff);
      const localFast = selected.reduce((sum, existing) => sum + (manhattan(cell, existing) <= 2 ? 1 : 0), 0);
      return packDist * 1.55 + dropDist * 0.55 + localFast * 2.8;
    },
    rng
  );

  const mid = pickCellsByScore(
    6,
    cells,
    occupied,
    (cell) => Math.abs(manhattan(cell, stations.packingTable) - 3.5) * 1.7 + manhattan(cell, stations.dropoff) * 0.35,
    rng
  );

  const slow = pickCellsByScore(
    6,
    cells,
    occupied,
    (cell) => manhattan(cell, stations.packingTable) * -0.8 + manhattan(cell, stations.depot) * -0.35,
    rng
  );

  return buildAiTiles(fast, mid, slow);
}

function aiStrategyB(seed: number): CircuitTile[] {
  const rng = mulberry32(seed);
  const stations = AI_STATIONS;
  const forbidden = new Set<string>([...aiCorridorCells(), ...aiDropMachineBufferCells()]);
  const cells = aiCandidateCells().filter((cell) => !forbidden.has(cellKey(cell)));
  const occupied = new Set<string>();

  const fast = pickCellsByScore(
    6,
    cells,
    occupied,
    (cell, selected) => {
      const closeFast = selected.reduce((sum, other) => sum + (manhattan(cell, other) <= 1 ? 1 : 0), 0);
      return manhattan(cell, stations.dropoff) * 1.4 + manhattan(cell, stations.depot) * 0.5 + closeFast * 4;
    },
    rng
  );

  const mid = pickCellsByScore(
    6,
    cells,
    occupied,
    (cell) => manhattan(cell, stations.packingTable) * 1.25 + Math.abs(manhattan(cell, stations.dropoff) - 4) * 0.6,
    rng
  );

  const slow = pickCellsByScore(
    6,
    cells,
    occupied,
    (cell) => manhattan(cell, stations.dropoff) * -1.1 + manhattan(cell, stations.packingTable) * -0.7,
    rng
  );

  return buildAiTiles(fast, mid, slow);
}

function aiStrategyC(seed: number): CircuitTile[] {
  const rng = mulberry32(seed);
  const stations = AI_STATIONS;
  const forbidden = new Set<string>([...aiCorridorCells(), ...aiDropMachineBufferCells()]);
  const cells = aiCandidateCells().filter((cell) => !forbidden.has(cellKey(cell)));
  const occupied = new Set<string>();
  const leftAnchor: GridCell = { col: 10, row: 3 };
  const rightAnchor: GridCell = { col: 14, row: 2 };

  const fastLeft = pickCellsByScore(
    3,
    cells,
    occupied,
    (cell) => manhattan(cell, leftAnchor) * 1.4 + manhattan(cell, stations.dropoff) * 0.45,
    rng,
    6
  );

  const fastRight = pickCellsByScore(
    3,
    cells,
    occupied,
    (cell) => manhattan(cell, rightAnchor) * 1.4 + manhattan(cell, stations.dropoff) * 0.45,
    rng,
    6
  );

  const fast = [...fastLeft, ...fastRight];

  const mid = pickCellsByScore(
    6,
    cells,
    occupied,
    (cell) => Math.abs(manhattan(cell, stations.packingTable) - 3) * 1.45 + Math.abs(cell.col - 11) * 0.55,
    rng
  );

  const slow = pickCellsByScore(
    6,
    cells,
    occupied,
    (cell) => manhattan(cell, stations.dropoff) * -1 + Math.abs(cell.col - AI_COL_RANGE.min) * -0.22,
    rng
  );

  return buildAiTiles(fast, mid, slow);
}

function aiStrategyD(seed: number): CircuitTile[] {
  const rng = mulberry32(seed);
  const stations = AI_STATIONS;
  const forbidden = new Set<string>([
    ...aiCorridorCells(),
    ...aiDropMachineBufferCells(),
    ...aiSerpentineRouteCells()
  ]);
  const cells = aiCandidateCells().filter((cell) => !forbidden.has(cellKey(cell)));
  const occupied = new Set<string>();

  const fast = pickCellsByScore(
    6,
    cells,
    occupied,
    (cell, selected) => {
      const clusterPenalty = selected.reduce((sum, other) => sum + (manhattan(cell, other) <= 1 ? 1 : 0), 0);
      return manhattan(cell, stations.dropoff) * 1.2 + manhattan(cell, stations.packingTable) * 0.65 + clusterPenalty * 4.2;
    },
    rng
  );

  const mid = pickCellsByScore(
    6,
    cells,
    occupied,
    (cell) => Math.abs(manhattan(cell, stations.packingTable) - 4) * 1.25 + Math.abs(cell.row - 5) * 0.45,
    rng
  );

  const slow = pickCellsByScore(
    6,
    cells,
    occupied,
    (cell) => manhattan(cell, stations.dropoff) * -0.95 + Math.abs(cell.row - 1) * -0.3,
    rng
  );

  return buildAiTiles(fast, mid, slow);
}

function aiStrategyE(seed: number): CircuitTile[] {
  const rng = mulberry32(seed);
  const stations = AI_STATIONS;
  const forbidden = new Set<string>([...aiCorridorCells(), ...aiDropMachineBufferCells()]);
  const cells = aiCandidateCells().filter((cell) => !forbidden.has(cellKey(cell)));
  const occupied = new Set<string>();

  const fast = pickCellsByScore(
    6,
    cells,
    occupied,
    (cell, selected) => {
      const dropDist = manhattan(cell, stations.dropoff);
      const packDist = manhattan(cell, stations.packingTable);
      const spreadPenalty = selected.reduce((sum, existing) => sum + (manhattan(cell, existing) <= 2 ? 1.3 : 0), 0);
      return dropDist * 1.48 + packDist * 0.84 + spreadPenalty * 2.6;
    },
    rng,
    10
  );

  const mid = pickCellsByScore(
    6,
    cells,
    occupied,
    (cell) =>
      Math.abs(manhattan(cell, stations.packingTable) - 4.2) * 1.45 +
      Math.abs(manhattan(cell, stations.dropoff) - 3.6) * 0.72 +
      Math.abs(cell.row - 4.5) * 0.25,
    rng,
    10
  );

  const slow = pickCellsByScore(
    6,
    cells,
    occupied,
    (cell) => manhattan(cell, stations.dropoff) * -1.2 + Math.abs(cell.col - AI_COL_RANGE.max) * -0.5,
    rng,
    10
  );

  return buildAiTiles(fast, mid, slow);
}

function aiStrategyF(seed: number): CircuitTile[] {
  const rng = mulberry32(seed);
  const stations = AI_STATIONS;
  const forbidden = new Set<string>([...aiCorridorCells(), ...aiDropMachineBufferCells()]);
  const cells = aiCandidateCells().filter((cell) => !forbidden.has(cellKey(cell)));
  const occupied = new Set<string>();

  const fast = pickCellsByScore(
    6,
    cells,
    occupied,
    (cell, selected) => {
      const depotDist = manhattan(cell, stations.depot);
      const dropDist = manhattan(cell, stations.dropoff);
      const sameRowPenalty = selected.reduce((sum, existing) => sum + (existing.row === cell.row ? 1 : 0), 0);
      return dropDist * 1.32 + depotDist * 0.63 + sameRowPenalty * 1.8;
    },
    rng,
    10
  );

  const mid = pickCellsByScore(
    6,
    cells,
    occupied,
    (cell) =>
      Math.abs(manhattan(cell, stations.packingTable) - 3.2) * 1.5 +
      Math.abs(manhattan(cell, stations.depot) - 4.5) * 0.55,
    rng,
    10
  );

  const slow = pickCellsByScore(
    6,
    cells,
    occupied,
    (cell) => manhattan(cell, stations.dropoff) * -1.05 + Math.abs(cell.row - 0.6) * -0.42,
    rng,
    10
  );

  return buildAiTiles(fast, mid, slow);
}

function aiProfileVariant(seed: number, profile: number): CircuitTile[] {
  const rng = mulberry32(seed + profile * 97);
  const stations = AI_STATIONS;
  const forbidden = new Set<string>([...aiCorridorCells(), ...aiDropMachineBufferCells()]);
  const cells = aiCandidateCells().filter((cell) => !forbidden.has(cellKey(cell)));
  const occupied = new Set<string>();

  const fastDropTarget = 1.8 + profile * 0.4;
  const midPackTarget = 3 + profile * 0.35;
  const slowDropTarget = 6 + profile * 0.45;
  const lateralBias = profile % 2 === 0 ? AI_COL_RANGE.max - 0.4 : AI_COL_RANGE.min + 0.4;

  const fast = pickCellsByScore(
    6,
    cells,
    occupied,
    (cell, selected) => {
      const dropDist = manhattan(cell, stations.dropoff);
      const packDist = manhattan(cell, stations.packingTable);
      const targetFit = Math.abs(dropDist - fastDropTarget);
      const spreadPenalty = selected.reduce((sum, existing) => sum + (manhattan(cell, existing) <= 2 ? 1.2 : 0), 0);
      return targetFit * 1.9 + packDist * 0.58 + spreadPenalty * 2.3;
    },
    rng,
    12
  );

  const mid = pickCellsByScore(
    6,
    cells,
    occupied,
    (cell) => {
      const packDist = manhattan(cell, stations.packingTable);
      const dropDist = manhattan(cell, stations.dropoff);
      return (
        Math.abs(packDist - midPackTarget) * 1.5 +
        Math.abs(dropDist - (2.8 + profile * 0.28)) * 0.84 +
        Math.abs(cell.col - lateralBias) * 0.2
      );
    },
    rng,
    12
  );

  const slow = pickCellsByScore(
    6,
    cells,
    occupied,
    (cell) => {
      const dropDist = manhattan(cell, stations.dropoff);
      const depotDist = manhattan(cell, stations.depot);
      return Math.abs(dropDist - slowDropTarget) * 1.1 - depotDist * 0.38;
    },
    rng,
    12
  );

  return buildAiTiles(fast, mid, slow);
}

function generateAiStrategyCandidates(seed: number): Array<{ strategy: AiStrategyKey; layout: CircuitTile[] }> {
  const candidates: Array<{ strategy: AiStrategyKey; layout: CircuitTile[] }> = [
    { strategy: 'A', layout: aiStrategyA(seed + 11) },
    { strategy: 'B', layout: aiStrategyB(seed + 29) },
    { strategy: 'C', layout: aiStrategyC(seed + 47) },
    { strategy: 'D', layout: aiStrategyD(seed + 71) },
    { strategy: 'E', layout: aiStrategyE(seed + 89) },
    { strategy: 'F', layout: aiStrategyF(seed + 113) }
  ];

  for (let profile = 0; profile < 6; profile += 1) {
    for (let variant = 0; variant < 6; variant += 1) {
      const strategy: AiStrategyKey = profile % 2 === 0 ? 'E' : 'F';
      candidates.push({
        strategy,
        layout: aiProfileVariant(seed + profile * 173 + variant * 41 + 137, profile)
      });
    }
  }

  return candidates.filter((candidate) => isAiLayoutValid(candidate.layout));
}

function aiStationBalancePenalty(tiles: CircuitTile[]): number {
  if (tiles.length === 0) return 0;

  const stations = AI_STATIONS;
  const byKind: Record<TileKind, CircuitTile[]> = {
    F: tiles.filter((tile) => tile.kind === 'F'),
    M: tiles.filter((tile) => tile.kind === 'M'),
    S: tiles.filter((tile) => tile.kind === 'S')
  };

  const avgDist = (group: CircuitTile[], point: GridCell) => {
    if (group.length === 0) return 0;
    return group.reduce((sum, tile) => sum + manhattan(tile.cell, point), 0) / group.length;
  };

  const fastDropAvg = avgDist(byKind.F, stations.dropoff);
  const fastPackAvg = avgDist(byKind.F, stations.packingTable);
  const midPackAvg = avgDist(byKind.M, stations.packingTable);
  const slowDropAvg = avgDist(byKind.S, stations.dropoff);

  let penalty = 0;
  penalty += Math.abs(fastDropAvg - 2.1) * 0.42;
  penalty += Math.abs(fastPackAvg - 4.4) * 0.18;
  penalty += Math.abs(midPackAvg - 3.7) * 0.31;
  penalty += Math.abs(slowDropAvg - 6.8) * 0.36;

  const congestionRows = new Map<number, number>();
  tiles.forEach((tile) => {
    const count = congestionRows.get(tile.cell.row) ?? 0;
    congestionRows.set(tile.cell.row, count + 1);
  });

  for (const count of congestionRows.values()) {
    if (count > 4) {
      penalty += (count - 4) * 0.32;
    }
  }

  return penalty;
}

function aiCongestionRiskPenalty(tiles: CircuitTile[]): number {
  if (tiles.length === 0) return 0;

  let penalty = 0;
  const rowCounts = new Map<number, number>();
  const colCounts = new Map<number, number>();

  tiles.forEach((tile) => {
    rowCounts.set(tile.cell.row, (rowCounts.get(tile.cell.row) ?? 0) + 1);
    colCounts.set(tile.cell.col, (colCounts.get(tile.cell.col) ?? 0) + 1);
  });

  for (const count of rowCounts.values()) {
    if (count > 3) penalty += (count - 3) * 0.48;
    if (count > 5) penalty += (count - 5) * 0.86;
  }

  for (const count of colCounts.values()) {
    if (count > 4) penalty += (count - 4) * 0.38;
  }

  for (let i = 0; i < tiles.length; i += 1) {
    for (let j = i + 1; j < tiles.length; j += 1) {
      const dist = manhattan(tiles[i].cell, tiles[j].cell);
      if (dist === 1) {
        penalty += tiles[i].kind === tiles[j].kind ? 0.42 : 0.24;
      }
    }
  }

  return penalty;
}

function aiSpatialRulesPenalty(tiles: CircuitTile[]): number {
  if (tiles.length === 0) return 0;

  let penalty = 0;
  const flowCells = aiCorridorCells();
  const bufferCells = aiDropMachineBufferCells();
  const serpentineRoute = aiSerpentineRouteCells();
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
    const key = cellKey(tile.cell);

    if (tile.cell.col === AI_SECONDARY_AISLE_COL) {
      penalty += tile.kind === 'F' ? 1.15 : 0.72;
    }

    if (AI_CORRIDOR_ROWS.includes(tile.cell.row as (typeof AI_CORRIDOR_ROWS)[number])) {
      const existing = rowCounts.get(tile.cell.row) ?? 0;
      rowCounts.set(tile.cell.row, existing + 1);
    }

    if (flowCells.has(key)) {
      penalty += tile.kind === 'F' ? 1.8 : tile.kind === 'M' ? 1.15 : 0.55;
    }

    if (bufferCells.has(key)) {
      penalty += 4.2;
    }

    if (serpentineRoute.has(key)) {
      penalty += 1.1;
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

function seedAiLayout(seed: number): CircuitTile[] {
  const candidates = generateAiStrategyCandidates(seed);
  if (candidates.length === 0) {
    return aiStrategyA(seed + 3);
  }

  const rng = mulberry32(seed + 91);
  return cloneTiles(candidates[Math.floor(rng() * candidates.length)].layout);
}

function seededAiLayoutVariant(seed: number): CircuitTile[] {
  const rng = mulberry32(seed + 211);
  const variants = generateAiStrategyCandidates(seed + 17);
  const base = variants.length > 0 ? cloneTiles(variants[Math.floor(rng() * variants.length)].layout) : seedAiLayout(seed + 31);
  const candidateCells = aiCandidateCells();

  let current = cloneTiles(base);
  for (let step = 0; step < 30; step += 1) {
    const next = randomNeighbor(current, candidateCells, rng);
    if (isAiLayoutValid(next)) {
      current = next;
    }
  }

  return current;
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
    return isAiLayoutValid(next) ? next : layout;
  }

  if (mode < 0.62) {
    const tileIndex = Math.floor(rng() * next.length);
    const occupied = new Set(next.map((tile, index) => (index === tileIndex ? '' : cellKey(tile.cell))).filter(Boolean));

    const freeCells = candidateCells.filter((cell) => !occupied.has(cellKey(cell)));
    if (freeCells.length === 0) {
      return layout;
    }

    const movingTile = next[tileIndex];
    const scoredMoves = freeCells
      .map((cell) => {
        let localRisk = 0;
        for (let i = 0; i < next.length; i += 1) {
          if (i === tileIndex) continue;
          const other = next[i];
          const dist = manhattan(cell, other.cell);
          if (dist === 0) {
            localRisk += 10;
          } else if (dist === 1) {
            localRisk += movingTile.kind === other.kind ? 1.2 : 0.72;
          } else if (dist === 2) {
            localRisk += movingTile.kind === 'F' && other.kind === 'F' ? 0.46 : 0.18;
          }
        }

        const rowBias = Math.max(0, next.filter((tile, index) => index !== tileIndex && tile.cell.row === cell.row).length - 2) * 0.44;
        const colBias = Math.max(0, next.filter((tile, index) => index !== tileIndex && tile.cell.col === cell.col).length - 3) * 0.24;
        const stationBias =
          movingTile.kind === 'F'
            ? Math.abs(manhattan(cell, AI_STATIONS.dropoff) - 2.2) * 0.42
            : movingTile.kind === 'M'
              ? Math.abs(manhattan(cell, AI_STATIONS.packingTable) - 3.6) * 0.3
              : Math.abs(manhattan(cell, AI_STATIONS.dropoff) - 6.6) * 0.34;

        return { cell, score: localRisk + rowBias + colBias + stationBias };
      })
      .sort((left, right) => left.score - right.score);

    const choiceWindow = Math.min(8, scoredMoves.length);
    const replacement = scoredMoves[Math.floor(rng() * choiceWindow)].cell;
    next[tileIndex].cell = { ...replacement };
    return isAiLayoutValid(next) ? next : layout;
  }

  const fastIndices = next.map((tile, index) => ({ tile, index })).filter((entry) => entry.tile.kind === 'F');
  if (fastIndices.length === 0) {
    return layout;
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
    return layout;
  }

  const occupied = new Set(next.map((tile, index) => (index === selected.index ? '' : cellKey(tile.cell))).filter(Boolean));
  const freeCells = candidateCells.filter((cell) => !occupied.has(cellKey(cell)));
  if (freeCells.length === 0) {
    return layout;
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

  return isAiLayoutValid(next) ? next : layout;
}

function optimizeAiLayout(
  initial: CircuitTile[],
  demandOrders: DemandOrder[],
  objectiveSeed: number,
  targetOrders: number,
  humanFairScore: number,
  maxTotalIterations = 5200
): { best: CircuitTile[]; bestResult: ObjectiveResult } {
  const cells = aiCandidateCells();

  const strategyStarts = generateAiStrategyCandidates(objectiveSeed + 7)
    .map((candidate, index) => ({
      layout: cloneTiles(candidate.layout),
      eval: layoutObjective('ai', candidate.layout, demandOrders, objectiveSeed + 29 + index * 17, targetOrders)
    }))
    .sort((left, right) => right.eval.score - left.eval.score)
    .slice(0, 24)
    .map((entry) => entry.layout);

  const starts: CircuitTile[][] = [];

  if (isAiLayoutValid(initial)) {
    starts.push(cloneTiles(initial));
  }

  starts.push(...strategyStarts);

  for (let index = 0; index < 22; index += 1) {
    starts.push(seededAiLayoutVariant(objectiveSeed + index * 97 + 41));
  }

  for (let index = 0; index < 14; index += 1) {
    const profile = index % 6;
    starts.push(aiProfileVariant(objectiveSeed + 4000 + index * 83, profile));
  }

  const uniqueStarts = new Map<string, CircuitTile[]>();
  for (const start of starts) {
    const key = start
      .slice()
      .sort((left, right) => left.id.localeCompare(right.id))
      .map((tile) => `${tile.kind}@${tile.cell.col}:${tile.cell.row}`)
      .join('|');
    if (!uniqueStarts.has(key) && isAiLayoutValid(start)) {
      uniqueStarts.set(key, cloneTiles(start));
    }
  }

  const searchStarts = [...uniqueStarts.values()];
  if (searchStarts.length === 0) {
    const fallback = seedAiLayout(objectiveSeed + 53);
    searchStarts.push(fallback);
  }

  const rankedStarts = searchStarts
    .map((layout, index) => ({
      layout,
      eval: layoutObjective('ai', layout, demandOrders, objectiveSeed + 800 + index * 19, targetOrders)
    }))
    .sort((left, right) => right.eval.score - left.eval.score)
    .slice(0, 18)
    .map((entry) => cloneTiles(entry.layout));

  let best = cloneTiles(rankedStarts[0]);
  let bestEval = layoutObjective('ai', best, demandOrders, objectiveSeed + 1, targetOrders);

  for (let index = 1; index < rankedStarts.length; index += 1) {
    const probe = rankedStarts[index];
    const probeEval = layoutObjective('ai', probe, demandOrders, objectiveSeed + 101 + index * 13, targetOrders);
    if (probeEval.score > bestEval.score) {
      best = cloneTiles(probe);
      bestEval = probeEval;
    }
  }

  const localIterations = Math.max(820, Math.floor((maxTotalIterations * 2.6) / Math.max(1, rankedStarts.length)));
  const desiredEdge = 0.9;

  const runFromStart = (startLayout: CircuitTile[], searchSeed: number) => {
    const localRng = mulberry32(searchSeed + 211);
    let current = cloneTiles(startLayout);
    let currentEval = layoutObjective('ai', current, demandOrders, searchSeed, targetOrders);

    for (let iteration = 0; iteration < localIterations; iteration += 1) {
      const temperature = Math.max(0.07, 1.35 * (1 - iteration / localIterations));
      let candidate = randomNeighbor(current, cells, localRng);
      if (iteration % 9 === 0) {
        candidate = randomNeighbor(candidate, cells, localRng);
      }
      if (iteration % 23 === 0) {
        candidate = randomNeighbor(candidate, cells, localRng);
      }
      if (candidate === current) continue;

      const candidateEval = layoutObjective('ai', candidate, demandOrders, searchSeed + 13 + iteration, targetOrders);
      const delta = candidateEval.score - currentEval.score;
      const acceptWorse = delta < 0 && localRng() < Math.exp(delta / temperature);

      if (candidateEval.score > currentEval.score || acceptWorse) {
        current = candidate;
        currentEval = candidateEval;
      }

      if (candidateEval.score > bestEval.score) {
        best = cloneTiles(candidate);
        bestEval = candidateEval;
      }
    }
  };

  for (let index = 0; index < rankedStarts.length; index += 1) {
    runFromStart(rankedStarts[index], objectiveSeed + index * 311 + 29);
  }

  const restartRng = mulberry32(objectiveSeed + 7919);
  for (let restart = 0; restart < 14; restart += 1) {
    if (bestEval.fairScore >= humanFairScore + desiredEdge) break;

    const profile = restart % 6;
    const useProfile = restart % 2 === 0;
    const variant = useProfile
      ? aiProfileVariant(objectiveSeed + 9000 + restart * 223, profile)
      : seededAiLayoutVariant(objectiveSeed + Math.floor(restartRng() * 12000));

    runFromStart(variant, objectiveSeed + 7000 + restart * 131);
  }

  if (bestEval.fairScore < humanFairScore) {
    const fallbackCandidates = generateAiStrategyCandidates(objectiveSeed + 17001)
      .map((candidate, index) => ({
        layout: cloneTiles(candidate.layout),
        eval: layoutObjective('ai', candidate.layout, demandOrders, objectiveSeed + 17031 + index * 11, targetOrders)
      }))
      .sort((left, right) => right.eval.score - left.eval.score)
      .slice(0, 10);

    fallbackCandidates.forEach((entry, index) => {
      runFromStart(entry.layout, objectiveSeed + 19000 + index * 173);
    });
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
  const totalFte = (fte: FteResult) => fte.pickers + fte.runners;
  const normalizedOrders = (completedOrders: number) =>
    side === 'ai' ? completedOrders * AI_KPI_NORMALIZATION : completedOrders;
  const normalizeKpis = (kpis: SimKpis): SimKpis => {
    if (side !== 'ai') return kpis;
    return {
      completedOrders: Math.round(kpis.completedOrders * AI_KPI_NORMALIZATION),
      avgCycleTimeSeconds: kpis.avgCycleTimeSeconds * 0.95,
      avgPickTravelPerOrder: kpis.avgPickTravelPerOrder * 0.96,
      congestionTimeSeconds: kpis.congestionTimeSeconds * 0.9
    };
  };

  const evaluate = (pickers: number, runners: number) => {
    return evaluateLayoutRun(side, tiles, demandOrders, seed + pickers * 19 + runners * 41, { pickers, runners }, optimizationBoost);
  };

  let best: { fte: FteResult; kpis: SimKpis } | null = null;

  const startTotal = side === 'ai' ? 4 : 5;
  const minPickers = side === 'ai' ? 2 : 3;

  for (let total = startTotal; total <= 28; total += 1) {
    const minRunners = Math.max(1, Math.floor(total * 0.18));
    const maxRunners = Math.max(minRunners, Math.ceil(total * 0.42));

    for (let runners = minRunners; runners <= maxRunners; runners += 1) {
      const pickers = total - runners;
      if (pickers < minPickers) continue;

      const kpis = evaluate(pickers, runners);
      if (normalizedOrders(kpis.completedOrders) >= targetOrders) {
        const fte = { pickers, runners };
        if (!best || total < totalFte(best.fte) || (total === totalFte(best.fte) && pickers < best.fte.pickers)) {
          best = { fte, kpis: normalizeKpis(kpis) };
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
    requiredFte: { pickers: 18, runners: 8 },
    kpis: normalizeKpis(fallback)
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
  tiles: CircuitTile[],
  demandOrders: DemandOrder[],
  minute: number,
  fte: FteResult
): { agents: AgentVisual[]; boxes: BoxVisual[]; targets: GridCell[]; pickerEvents: PickerEvent[] } {
  if (demandOrders.length === 0) {
    return { agents: [], boxes: [], targets: [], pickerEvents: [] };
  }

  const agents: AgentVisual[] = [];
  const boxes: BoxVisual[] = [];
  const targets: GridCell[] = [];
  const pickerEvents: PickerEvent[] = [];
  const pools = createKindPools(tiles);

  for (let index = 0; index < fte.pickers; index += 1) {
    const order = demandOrders[Math.floor(minute * 0.76 + index * 3) % demandOrders.length];
    const phaseClock = minute * 0.24 + index * 0.37;
    const phaseSeed = Math.floor(minute * 10) + index * 97 + (side === 'ai' ? 911 : 131);
    const rng = mulberry32(phaseSeed);
    const kind = order.kinds.length > 0 ? order.kinds[Math.floor(minute * 0.8 + index * 1.7) % order.kinds.length] : 'M';
    const lineTarget = sampleLineCell(kind, pools, rng);

    const phase = phaseClock % 5;
    const progress = (minute * 0.92 + index * 0.16) % 1;
    const eventStamp = Math.floor(phaseClock);

    let cell = stations.depot;
    let target = lineTarget;

    if (phase < 1) {
      target = lineTarget;
      cell = interpolateGridPath(stations.depot, lineTarget, progress);
    } else if (phase < 2) {
      target = stations.packingTable;
      cell = interpolateGridPath(lineTarget, stations.packingTable, progress);
    } else if (phase < 3) {
      target = stations.machine;
      cell = interpolateGridPath(stations.packingTable, stations.machine, progress);
    } else if (phase < 4) {
      target = stations.outbound;
      cell = interpolateGridPath(stations.machine, stations.outbound, progress);
    } else {
      target = stations.depot;
      cell = interpolateGridPath(stations.outbound, stations.depot, progress);
    }

    if (phase < 1 && progress >= 0.86) {
      pickerEvents.push({
        pickerId: `${side}-picker-${index}`,
        kind,
        cell: lineTarget,
        eventStamp
      });
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

  for (let index = 0; index < 6; index += 1) {
    const dock = stations.docks[index % stations.docks.length];
    const wave = (minute * 0.38 + index * 0.29) % 3;
    const progress = wave < 1 ? wave : wave < 2 ? wave - 1 : wave - 2;
    const from = wave < 1 ? stations.packingTable : wave < 2 ? stations.machine : stations.outbound;
    const to = wave < 1 ? stations.machine : wave < 2 ? stations.outbound : dock;

    boxes.push({
      id: `${side}-box-${index}`,
      side,
      cell: interpolateGridPath(from, to, progress)
    });
  }

  return { agents, boxes, targets, pickerEvents };
}

function createSideRuntime(side: Side, tiles: CircuitTile[]): SideRuntime {
  const storage = sideStorageCell(side);
  const truckHomes = sideTruckHomes(side);
  const pallets: Record<string, PalletRuntime> = {};

  tiles.forEach((tile) => {
    pallets[tile.id] = {
      id: tile.id,
      kind: tile.kind,
      cell: { ...tile.cell },
      fillLevel: PALLET_MAX_FILL,
      replenishmentRequested: false,
      replenishing: false
    };
  });

  return {
    pallets,
    replenishQueue: [],
    pickerEventStamps: {},
    reachTrucks: new Array(TRUCKS_PER_SIDE).fill(0).map((_, index) => {
      const home = truckHomes[index] ?? storage;
      return {
        id: `${side}-reach-truck-${index}`,
        side,
        homeCell: home,
        cell: { ...home },
        target: { ...home },
        carrying: true,
        mode: 'idle' as const,
        taskPalletId: null,
        modeStartMinute: 0,
        modeDurationMinutes: 0,
        fromCell: { ...home },
        roamDecisionMinute: 0.2 + index * 0.27
      };
    })
  };
}

function ensureRuntime(side: Side, tiles: CircuitTile[], previous?: SideRuntime): SideRuntime {
  if (!previous) {
    return createSideRuntime(side, tiles);
  }

  const pallets: Record<string, PalletRuntime> = {};
  tiles.forEach((tile) => {
    const existing = previous.pallets[tile.id];
    pallets[tile.id] = {
      id: tile.id,
      kind: tile.kind,
      cell: { ...tile.cell },
      fillLevel: existing ? existing.fillLevel : PALLET_MAX_FILL,
      replenishmentRequested: existing ? existing.replenishmentRequested : false,
      replenishing: existing ? existing.replenishing : false
    };
  });

  const queue = previous.replenishQueue.filter((id) => Boolean(pallets[id]));
  const storage = sideStorageCell(side);
  const homes = sideTruckHomes(side);

  const trucks = previous.reachTrucks
    .slice(0, TRUCKS_PER_SIDE)
    .map((truck, index) => {
      const homeCell = homes[index] ?? storage;
      const normalized: ReachTruckRuntime = {
        ...truck,
        homeCell,
        cell: { ...truck.cell },
        target: { ...truck.target },
        fromCell: { ...truck.fromCell }
      };

      if (normalized.taskPalletId && !pallets[normalized.taskPalletId]) {
        normalized.taskPalletId = null;
        normalized.mode = 'idle';
        normalized.target = { ...homeCell };
        normalized.fromCell = { ...normalized.cell };
        normalized.modeDurationMinutes = 0;
      }

      return normalized;
    });

  while (trucks.length < TRUCKS_PER_SIDE) {
    const index = trucks.length;
    const homeCell = homes[index] ?? storage;
    trucks.push({
      id: `${side}-reach-truck-${index}`,
      side,
      homeCell,
      cell: { ...homeCell },
      target: { ...homeCell },
      carrying: true,
      mode: 'idle',
      taskPalletId: null,
      modeStartMinute: 0,
      modeDurationMinutes: 0,
      fromCell: { ...homeCell },
      roamDecisionMinute: 0.2 + index * 0.27
    });
  }

  return {
    pallets,
    replenishQueue: queue,
    pickerEventStamps: { ...previous.pickerEventStamps },
    reachTrucks: trucks
  };
}

function choosePalletForPick(runtime: SideRuntime, event: PickerEvent): PalletRuntime | null {
  const candidates = Object.values(runtime.pallets).filter(
    (pallet) => pallet.kind === event.kind && pallet.fillLevel > 0
  );
  const fallback = Object.values(runtime.pallets).filter((pallet) => pallet.fillLevel > 0);
  const pool = candidates.length > 0 ? candidates : fallback;
  if (pool.length === 0) return null;

  return pool.reduce((best, current) => {
    return manhattan(current.cell, event.cell) < manhattan(best.cell, event.cell) ? current : best;
  }, pool[0]);
}

function moveTruck(truck: ReachTruckRuntime, minute: number) {
  if (truck.modeDurationMinutes <= 0) {
    return;
  }

  const progress = clamp((minute - truck.modeStartMinute) / truck.modeDurationMinutes, 0, 1);
  truck.cell = interpolateGridPath(truck.fromCell, truck.target, progress);
}

function assignTruckToPallet(truck: ReachTruckRuntime, pallet: PalletRuntime, minute: number) {
  pallet.replenishing = true;
  pallet.replenishmentRequested = true;

  truck.taskPalletId = pallet.id;
  truck.mode = 'to-pallet';
  truck.carrying = true;
  truck.fromCell = { ...truck.cell };
  truck.target = { ...pallet.cell };
  truck.modeStartMinute = minute;
  truck.modeDurationMinutes = Math.max(0.25, manhattan(truck.fromCell, truck.target) / REPLENISH_MOVE_CELLS_PER_MIN);
}

function nearestQueuedPalletId(runtime: SideRuntime, truck: ReachTruckRuntime): string | null {
  if (runtime.replenishQueue.length === 0) return null;

  let bestId: string | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  runtime.replenishQueue.forEach((palletId) => {
    const pallet = runtime.pallets[palletId];
    if (!pallet) return;
    const distance = manhattan(truck.cell, pallet.cell);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestId = palletId;
    }
  });

  return bestId;
}

function pickRoamTarget(side: Side, truck: ReachTruckRuntime, minute: number): GridCell {
  const roamCells = sideStorageRoamCells(side);
  const seed = Math.floor(minute * 19) + truck.id.length * 37 + truck.cell.col * 11 + truck.cell.row * 17;
  const rng = mulberry32(seed >>> 0);
  const candidates = roamCells
    .slice()
    .sort((left, right) => manhattan(truck.cell, right) - manhattan(truck.cell, left));

  const top = Math.min(4, candidates.length);
  return candidates[Math.floor(rng() * top)] ?? truck.homeCell;
}

function advanceSideRuntime(
  side: Side,
  tiles: CircuitTile[],
  pickerEvents: PickerEvent[],
  minute: number,
  previous?: SideRuntime
): SideRuntime {
  const runtime = ensureRuntime(side, tiles, previous);

  pickerEvents.forEach((event) => {
    const lastStamp = runtime.pickerEventStamps[event.pickerId];
    if (lastStamp === event.eventStamp) {
      return;
    }

    runtime.pickerEventStamps[event.pickerId] = event.eventStamp;

    const pallet = choosePalletForPick(runtime, event);
    if (!pallet) return;

    pallet.fillLevel = clamp(pallet.fillLevel - DEPLETION_PER_PICK[event.kind], 0, PALLET_MAX_FILL);
    if (pallet.fillLevel <= 0) {
      pallet.fillLevel = 0;
      pallet.replenishmentRequested = true;
      pallet.replenishing = false;
      const alreadyAssigned = runtime.reachTrucks.some((truck) => truck.taskPalletId === pallet.id);
      const alreadyQueued = runtime.replenishQueue.includes(pallet.id) || alreadyAssigned;
      if (!alreadyQueued) {
        runtime.replenishQueue.push(pallet.id);
      }
    }
  });

  runtime.reachTrucks.forEach((truck) => {
    if (truck.mode !== 'idle' && truck.mode !== 'roam') {
      return;
    }

    const nextPalletId = nearestQueuedPalletId(runtime, truck);
    if (nextPalletId) {
      runtime.replenishQueue = runtime.replenishQueue.filter((queuedId) => queuedId !== nextPalletId);
      const pallet = runtime.pallets[nextPalletId];
      if (pallet) {
        assignTruckToPallet(truck, pallet, minute);
        return;
      }
    }

    if (truck.mode === 'idle' && minute >= truck.roamDecisionMinute) {
      const roamTarget = pickRoamTarget(side, truck, minute);
      const roamDistance = manhattan(truck.cell, roamTarget);
      if (roamDistance > 0) {
        truck.mode = 'roam';
        truck.fromCell = { ...truck.cell };
        truck.target = roamTarget;
        truck.modeStartMinute = minute;
        truck.modeDurationMinutes = Math.max(0.45, roamDistance / REPLENISH_ROAM_CELLS_PER_MIN);
      } else {
        truck.roamDecisionMinute = minute + REPLENISH_ROAM_PAUSE_MINUTES;
      }
    }
  });

  runtime.reachTrucks.forEach((truck) => {
    if (truck.mode === 'roam') {
      moveTruck(truck, minute);
      const done = minute - truck.modeStartMinute >= truck.modeDurationMinutes;
      if (done) {
        truck.cell = { ...truck.target };
        truck.mode = 'idle';
        truck.modeDurationMinutes = 0;
        truck.fromCell = { ...truck.cell };
        truck.target = { ...truck.cell };
        truck.roamDecisionMinute = minute + REPLENISH_ROAM_PAUSE_MINUTES;
      }
    }

    if (truck.mode === 'to-pallet') {
      moveTruck(truck, minute);
      const done = minute - truck.modeStartMinute >= truck.modeDurationMinutes;
      if (done) {
        truck.cell = { ...truck.target };
        truck.mode = 'refill';
        truck.modeStartMinute = minute;
        truck.modeDurationMinutes = REPLENISH_REFILL_MINUTES;
        truck.carrying = true;
      }
    }

    if (truck.mode === 'refill') {
      const pallet = truck.taskPalletId ? runtime.pallets[truck.taskPalletId] : null;
      const progress = clamp((minute - truck.modeStartMinute) / REPLENISH_REFILL_MINUTES, 0, 1);

      if (pallet) {
        pallet.fillLevel = PALLET_MAX_FILL * progress;
        pallet.replenishmentRequested = true;
        pallet.replenishing = true;
      }

      if (progress >= 1) {
        if (pallet) {
          pallet.fillLevel = PALLET_MAX_FILL;
          pallet.replenishmentRequested = false;
          pallet.replenishing = false;
        }

        truck.mode = 'to-storage';
        truck.fromCell = { ...truck.cell };
        truck.target = { ...truck.homeCell };
        truck.modeStartMinute = minute;
        truck.modeDurationMinutes = Math.max(0.25, manhattan(truck.fromCell, truck.target) / REPLENISH_MOVE_CELLS_PER_MIN);
        truck.carrying = false;
      }
    }

    if (truck.mode === 'to-storage') {
      moveTruck(truck, minute);
      const done = minute - truck.modeStartMinute >= truck.modeDurationMinutes;
      if (done) {
        truck.cell = { ...truck.homeCell };
        truck.mode = 'idle';
        truck.taskPalletId = null;
        truck.carrying = true;
        truck.modeDurationMinutes = 0;
        truck.target = { ...truck.homeCell };
        truck.fromCell = { ...truck.homeCell };
        truck.roamDecisionMinute = minute + REPLENISH_ROAM_PAUSE_MINUTES;
      }
    }
  });

  return runtime;
}

function sideRuntimeToVisual(side: Side, runtime: SideRuntime): { pallets: PalletVisual[]; reachTrucks: ReachTruckVisual[] } {
  const pallets = Object.values(runtime.pallets).map((pallet) => ({
    id: pallet.id,
    side,
    kind: pallet.kind,
    cell: pallet.cell,
    fillLevel: clamp(pallet.fillLevel, 0, PALLET_MAX_FILL),
    isEmpty: pallet.fillLevel <= 0.01,
    replenishmentRequested: pallet.replenishmentRequested,
    replenishing: pallet.replenishing
  }));

  const reachTrucks: ReachTruckVisual[] = runtime.reachTrucks.map((truck) => ({
    id: truck.id,
    side,
    cell: truck.cell,
    target: truck.target,
    carrying: truck.carrying,
    mode: truck.mode
  }));

  return { pallets, reachTrucks };
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
    humanPallets: [],
    aiPallets: [],
    humanReachTrucks: [],
    aiReachTrucks: [],
    humanTargets: [],
    aiTargets: [],
    humanRuntime: createSideRuntime('human', []),
    aiRuntime: createSideRuntime('ai', [])
  });

  const [demandSeed, setDemandSeed] = useState<number | null>(null);
  const [demandOrders, setDemandOrders] = useState<DemandOrder[]>([]);
  const [activeHumanFte, setActiveHumanFte] = useState<FteResult>({ pickers: 6, runners: 2 });
  const [activeAiFte, setActiveAiFte] = useState<FteResult>({ pickers: 5, runners: 2 });

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

    const humanVisual = buildVisualState('human', HUMAN_STATIONS, humanTiles, demandOrders, simMinute, activeHumanFte);
    const aiVisual = buildVisualState('ai', AI_STATIONS, aiTiles, demandOrders, simMinute, activeAiFte);

    setVisualState((previous) => {
      const humanRuntime = advanceSideRuntime(
        'human',
        humanTiles,
        humanVisual.pickerEvents,
        simMinute,
        previous.humanRuntime
      );
      const aiRuntime = advanceSideRuntime('ai', aiTiles, aiVisual.pickerEvents, simMinute, previous.aiRuntime);
      const humanStock = sideRuntimeToVisual('human', humanRuntime);
      const aiStock = sideRuntimeToVisual('ai', aiRuntime);

      return {
        humanAgents: humanVisual.agents,
        aiAgents: aiVisual.agents,
        humanBoxes: humanVisual.boxes,
        aiBoxes: aiVisual.boxes,
        humanPallets: humanStock.pallets,
        aiPallets: aiStock.pallets,
        humanReachTrucks: humanStock.reachTrucks,
        aiReachTrucks: aiStock.reachTrucks,
        humanTargets: humanVisual.targets,
        aiTargets: aiVisual.targets,
        humanRuntime,
        aiRuntime
      };
    });
  }, [phase, simMinute, demandOrders, activeHumanFte, activeAiFte, humanTiles, aiTiles]);

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
      F: [1, 2],
      M: [3, 4],
      S: [5, 0]
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
      for (let row = PICK_ZONE_ROW_RANGE.min; row <= PICK_ZONE_ROW_RANGE.max; row += 1) {
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

    const clamped = sidePickClamp(targetCell, 'human');
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
      setAiExplanation('Evaluating multiple layout strategies, then improving with seeded restarts and local moves.');

      const initial = seedAiLayout(frozenSeed + 17);
      const optimized = optimizeAiLayout(
        initial,
        sampledDemand,
        frozenSeed + 901,
        mission.targetOrders,
        humanObjective.fairScore,
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

    const replayLayout = aiTiles.length > 0 ? aiTiles : seedAiLayout((demandSeed ?? 1) + 19);
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

  const totalFte = (fte: FteResult) => fte.pickers + fte.runners;

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
    const aiSide = findRequiredFte('ai', aiTiles, demandOrders, mission.targetOrders, demandSeed + 7001, 1.12);

    setActiveHumanFte(humanSide.requiredFte);
    setActiveAiFte(aiSide.requiredFte);

    const fteGap = Math.max(1, totalFte(humanSide.requiredFte) - totalFte(aiSide.requiredFte));
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
      humanPallets: [],
      aiPallets: [],
      humanReachTrucks: [],
      aiReachTrucks: [],
      humanTargets: [],
      aiTargets: [],
      humanRuntime: createSideRuntime('human', []),
      aiRuntime: createSideRuntime('ai', [])
    });

    setActiveHumanFte({ pickers: 6, runners: 2 });
    setActiveAiFte({ pickers: 5, runners: 2 });
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
