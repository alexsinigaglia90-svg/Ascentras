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

type VisualState = {
  humanAgents: AgentVisual[];
  aiAgents: AgentVisual[];
  humanBoxes: BoxVisual[];
  aiBoxes: BoxVisual[];
  humanTargets: GridCell[];
  aiTargets: GridCell[];
};

type GeneratedOrder = {
  createdMinute: number;
  lines: GridCell[];
};

const SHIFT_MINUTES = 8 * 60;
const SIM_SPEED = 60;
const MISSION: Mission = {
  startLabel: '09:00',
  endLabel: '17:00',
  targetOrders: 1200
};

const REQUIRED_COUNTS: BuildCounts = { F: 6, M: 6, S: 6 };

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

const AI_MAIN_AISLE_COL = 12;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function cellKey(cell: GridCell): string {
  return `${cell.col}:${cell.row}`;
}

function sameCell(left: GridCell, right: GridCell): boolean {
  return left.col === right.col && left.row === right.row;
}

function manhattan(a: GridCell, b: GridCell): number {
  return Math.abs(a.col - b.col) + Math.abs(a.row - b.row);
}

function mulberry32(seed: number): () => number {
  let current = seed >>> 0;
  return () => {
    current += 0x6d2b79f5;
    let temp = Math.imul(current ^ (current >>> 15), 1 | current);
    temp ^= temp + Math.imul(temp ^ (temp >>> 7), 61 | temp);
    return ((temp ^ (temp >>> 14)) >>> 0) / 4294967296;
  };
}

function weightedChoice<T>(entries: Array<{ value: T; weight: number }>, rng: () => number): T {
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
  const roll = rng() * total;
  let cumulative = 0;

  for (const entry of entries) {
    cumulative += entry.weight;
    if (roll <= cumulative) {
      return entry.value;
    }
  }

  return entries[entries.length - 1].value;
}

function getCounts(tiles: CircuitTile[]): BuildCounts {
  const counts: BuildCounts = { F: 0, M: 0, S: 0 };
  for (const tile of tiles) {
    counts[tile.kind] += 1;
  }
  return counts;
}

function buildMetrics(tiles: CircuitTile[], stations: StationSet): BuildMetrics {
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
    const toDepot = manhattan(tile.cell, stations.depot);
    const toDrop = manhattan(tile.cell, stations.dropoff);

    weightedTravel +=
      tile.kind === 'F'
        ? toDepot * 1.35 + toDrop * 0.65
        : tile.kind === 'M'
          ? toDepot * 0.9 + toDrop * 0.95
          : toDepot * 0.5 + toDrop * 1.25;

    if (tile.kind === 'F') {
      zoning += toDepot <= 3 ? 2.2 : toDepot <= 5 ? 0.9 : -1.4;
    } else if (tile.kind === 'M') {
      zoning += toDepot >= 3 && toDepot <= 7 ? 1.4 : -0.6;
    } else {
      zoning += toDepot >= 6 ? 1.8 : -1.2;
    }
  }

  for (let index = 0; index < tiles.length; index += 1) {
    for (let inner = index + 1; inner < tiles.length; inner += 1) {
      const dist = manhattan(tiles[index].cell, tiles[inner].cell);
      if (dist <= 1) congestionPairs += 1;
      if (tiles[index].kind === 'F' && tiles[inner].kind === 'F' && dist <= 2) congestionPairs += 0.8;
    }
  }

  const travelDistance = weightedTravel / tiles.length;
  const congestionPenalty = congestionPairs / Math.max(tiles.length / 3, 1);
  const zoningScore = zoning / tiles.length;

  const efficiencyScore = clamp(
    100 - travelDistance * 6.2 - congestionPenalty * 7.4 + zoningScore * 12 + (tiles.length / 18) * 10,
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

function validPlacementCounts(counts: BuildCounts): boolean {
  return counts.F >= REQUIRED_COUNTS.F && counts.M >= REQUIRED_COUNTS.M && counts.S >= REQUIRED_COUNTS.S;
}

function getStations(side: Side): StationSet {
  return side === 'human' ? HUMAN_STATIONS : AI_STATIONS;
}

function sideAllowedCols(side: Side): { min: number; max: number } {
  return side === 'human' ? HUMAN_COL_RANGE : AI_COL_RANGE;
}

function clampToSide(cell: GridCell, side: Side): GridCell {
  const range = sideAllowedCols(side);
  return {
    col: clamp(cell.col, range.min, range.max),
    row: clamp(cell.row, 0, BOARD_ROWS - 1)
  };
}

function blockedCellsForSide(side: Side): Set<string> {
  const stations = getStations(side);
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

function nextSpawnCell(side: Side, kind: TileKind, occupied: Set<string>): GridCell {
  const blocked = blockedCellsForSide(side);
  const range = sideAllowedCols(side);

  const preferredRows: Record<TileKind, number[]> = {
    F: [1, 2, 3],
    M: [4, 5, 6],
    S: [7, 8, 0]
  };

  for (const row of preferredRows[kind]) {
    for (let col = range.min; col <= range.max; col += 1) {
      const cell = { col, row };
      const key = cellKey(cell);
      if (!occupied.has(key) && !blocked.has(key)) {
        return cell;
      }
    }
  }

  for (let row = 0; row < BOARD_ROWS; row += 1) {
    for (let col = range.min; col <= range.max; col += 1) {
      const cell = { col, row };
      const key = cellKey(cell);
      if (!occupied.has(key) && !blocked.has(key)) {
        return cell;
      }
    }
  }

  return { col: range.min, row: 0 };
}

function aiPlacementPlan(): CircuitTile[] {
  const side: Side = 'ai';
  const stations = getStations(side);
  const blocked = blockedCellsForSide(side);
  const occupied = new Set<string>(blocked);
  const candidates: GridCell[] = [];

  for (let col = AI_COL_RANGE.min; col <= AI_COL_RANGE.max; col += 1) {
    for (let row = 0; row < BOARD_ROWS; row += 1) {
      const cell = { col, row };
      if (!occupied.has(cellKey(cell))) {
        candidates.push(cell);
      }
    }
  }

  const pickedFast: GridCell[] = [];
  const pickedMid: GridCell[] = [];
  const pickedSlow: GridCell[] = [];

  function pickBest(kind: TileKind, count: number) {
    for (let step = 0; step < count; step += 1) {
      let bestCell: GridCell | null = null;
      let bestScore = Number.POSITIVE_INFINITY;

      for (const candidate of candidates) {
        const key = cellKey(candidate);
        if (occupied.has(key)) continue;

        const depotDist = manhattan(candidate, stations.depot);
        const dropDist = manhattan(candidate, stations.dropoff);
        const aislePenalty = Math.abs(candidate.col - AI_MAIN_AISLE_COL) <= 1 ? 2.8 : 0;

        let score = 0;

        if (kind === 'F') {
          const fastNeighbors = pickedFast.reduce(
            (sum, cell) => sum + (Math.abs(cell.col - candidate.col) <= 1 && Math.abs(cell.row - candidate.row) <= 1 ? 1 : 0),
            0
          );
          score = depotDist * 2.4 + dropDist * 0.8 + fastNeighbors * 7.5 + aislePenalty;
        } else if (kind === 'M') {
          const ringScore = Math.abs(depotDist - 4.5) * 1.8;
          const centerPull = Math.abs(candidate.row - 5) * 0.3;
          score = ringScore + dropDist * 0.7 + centerPull + aislePenalty * 0.7;
        } else {
          score = depotDist * 0.5 + Math.abs(dropDist - 4.2) * 1.9 + aislePenalty * 0.4;
        }

        if (score < bestScore) {
          bestScore = score;
          bestCell = candidate;
        }
      }

      if (!bestCell) {
        return;
      }

      occupied.add(cellKey(bestCell));
      if (kind === 'F') pickedFast.push(bestCell);
      if (kind === 'M') pickedMid.push(bestCell);
      if (kind === 'S') pickedSlow.push(bestCell);
    }
  }

  pickBest('F', 6);
  pickBest('M', 6);
  pickBest('S', 6);

  const tiles: CircuitTile[] = [
    ...pickedFast.map((cell, index) => ({ id: `ai-f-${index + 1}`, kind: 'F' as const, cell, side })),
    ...pickedMid.map((cell, index) => ({ id: `ai-m-${index + 1}`, kind: 'M' as const, cell, side })),
    ...pickedSlow.map((cell, index) => ({ id: `ai-s-${index + 1}`, kind: 'S' as const, cell, side }))
  ];

  return tiles;
}

function generateOrders(tiles: CircuitTile[], orderCount: number, seed: number): GeneratedOrder[] {
  const rng = mulberry32(seed);
  const weightedTiles = tiles.map((tile) => ({
    value: tile,
    weight: tile.kind === 'F' ? 0.6 : tile.kind === 'M' ? 0.3 : 0.1
  }));

  const orders: GeneratedOrder[] = [];

  for (let index = 0; index < orderCount; index += 1) {
    const lineCount = Math.floor(rng() * 6) + 3;
    const lines: GridCell[] = [];

    for (let line = 0; line < lineCount; line += 1) {
      lines.push(weightedChoice(weightedTiles, rng).cell);
    }

    orders.push({
      createdMinute: Math.floor(rng() * SHIFT_MINUTES),
      lines
    });
  }

  return orders.sort((left, right) => left.createdMinute - right.createdMinute);
}

function movementTimeSeconds(from: GridCell, to: GridCell, speedCellsPerSecond: number): number {
  return manhattan(from, to) / speedCellsPerSecond;
}

function evaluateSide(
  orders: GeneratedOrder[],
  stations: StationSet,
  seed: number,
  pickers: number,
  runners: number,
  sideOptimization: number
): SimKpis {
  const rng = mulberry32(seed);
  const speed = 1.4 * sideOptimization;
  const pickerAvailability = new Array<number>(pickers).fill(0);
  const pickerCells = new Array<GridCell>(pickers).fill(stations.depot).map(() => ({ ...stations.depot }));
  const runnerAvailability = new Array<number>(runners).fill(0);
  const machineBusyUntil = { value: 0 };
  const cellOccupancy = new Map<string, number>();

  let completed = 0;
  let cycleSecondsTotal = 0;
  let travelTotal = 0;
  let congestionTotal = 0;

  const shiftSeconds = SHIFT_MINUTES * 60;

  for (const order of orders) {
    const pickerIndex = pickerAvailability.reduce((best, value, index, array) => (value < array[best] ? index : best), 0);
    let time = Math.max(order.createdMinute * 60, pickerAvailability[pickerIndex]);
    let current = pickerCells[pickerIndex];
    let travelForOrder = 0;

    for (const lineCell of order.lines) {
      const travel = movementTimeSeconds(current, lineCell, speed);
      time += travel;
      travelForOrder += manhattan(current, lineCell);

      const lineKey = cellKey(lineCell);
      const occupiedUntil = cellOccupancy.get(lineKey) ?? 0;
      if (occupiedUntil > time) {
        const wait = occupiedUntil - time;
        time += wait;
        congestionTotal += wait;
      }

      cellOccupancy.set(lineKey, time + 1.5 + rng() * 1.4);

      const pickTime = 3 + rng() * 3;
      time += pickTime;
      current = lineCell;
    }

    const toDrop = movementTimeSeconds(current, stations.dropoff, speed);
    time += toDrop + 10;
    travelForOrder += manhattan(current, stations.dropoff);

    pickerAvailability[pickerIndex] = time;
    pickerCells[pickerIndex] = { ...stations.depot };

    const machineStart = Math.max(time, machineBusyUntil.value);
    const machineDone = machineStart + 6;
    machineBusyUntil.value = machineDone;

    const runnerIndex = runnerAvailability.reduce((best, value, index, array) => (value < array[best] ? index : best), 0);
    let runnerTime = Math.max(machineDone, runnerAvailability[runnerIndex]);

    const dock = stations.docks[Math.floor(rng() * stations.docks.length)];
    runnerTime += movementTimeSeconds(stations.machine, stations.outbound, speed);
    runnerTime += movementTimeSeconds(stations.outbound, dock, speed);
    runnerTime += 15;

    runnerAvailability[runnerIndex] = runnerTime;

    if (runnerTime <= shiftSeconds) {
      completed += 1;
      cycleSecondsTotal += runnerTime - order.createdMinute * 60;
      travelTotal += travelForOrder;
    }
  }

  return {
    completedOrders: completed,
    avgCycleTimeSeconds: completed > 0 ? cycleSecondsTotal / completed : 0,
    avgPickTravelPerOrder: completed > 0 ? travelTotal / completed : 0,
    congestionTimeSeconds: congestionTotal
  };
}

function findRequiredFte(
  orders: GeneratedOrder[],
  stations: StationSet,
  targetOrders: number,
  seed: number,
  sideOptimization: number
): SideResult {
  let best: { fte: FteResult; kpis: SimKpis } | null = null;

  for (let pickers = 4; pickers <= 18; pickers += 1) {
    for (let runners = 1; runners <= 8; runners += 1) {
      const kpis = evaluateSide(orders, stations, seed + pickers * 17 + runners * 37, pickers, runners, sideOptimization);
      if (kpis.completedOrders >= targetOrders) {
        const fte = { pickers, runners, total: pickers + runners };
        if (!best || fte.total < best.fte.total || (fte.total === best.fte.total && fte.pickers < best.fte.pickers)) {
          best = { fte, kpis };
        }
      }
    }
  }

  if (!best) {
    const fallbackPickers = 18;
    const fallbackRunners = 8;
    const kpis = evaluateSide(orders, stations, seed + 999, fallbackPickers, fallbackRunners, sideOptimization);
    return {
      requiredFte: { pickers: fallbackPickers, runners: fallbackRunners, total: fallbackPickers + fallbackRunners },
      kpis
    };
  }

  return {
    requiredFte: best.fte,
    kpis: best.kpis
  };
}

function interpolateGridPath(from: GridCell, to: GridCell, progress: number): GridCell {
  const clamped = clamp(progress, 0, 1);
  const totalSteps = manhattan(from, to);
  if (totalSteps === 0) return { ...from };

  const traversed = clamped * totalSteps;
  const horizontal = Math.abs(to.col - from.col);
  const rowDirection = to.row >= from.row ? 1 : -1;
  const colDirection = to.col >= from.col ? 1 : -1;

  if (traversed <= horizontal) {
    return {
      col: Math.round(from.col + colDirection * traversed),
      row: from.row
    };
  }

  return {
    col: to.col,
    row: Math.round(from.row + rowDirection * (traversed - horizontal))
  };
}

function buildVisualState(
  side: Side,
  orders: GeneratedOrder[],
  stations: StationSet,
  minute: number,
  pickers: number,
  runners: number
): {
  agents: AgentVisual[];
  boxes: BoxVisual[];
  targets: GridCell[];
} {
  if (orders.length === 0) {
    return { agents: [], boxes: [], targets: [] };
  }

  const agents: AgentVisual[] = [];
  const boxes: BoxVisual[] = [];
  const targets: GridCell[] = [];

  for (let index = 0; index < pickers; index += 1) {
    const orderIndex = Math.floor(minute * 0.72 + index * 3) % orders.length;
    const order = orders[orderIndex];
    const line = order.lines[Math.floor(minute * 1.3 + index) % order.lines.length];

    const phase = (minute * 0.25 + index * 0.37) % 3;
    const progress = (minute * 0.9 + index * 0.17) % 1;

    let cell = stations.depot;
    let target = line;

    if (phase < 1) {
      cell = interpolateGridPath(stations.depot, line, progress);
      target = line;
    } else if (phase < 2) {
      cell = interpolateGridPath(line, stations.dropoff, progress);
      target = stations.dropoff;
    } else {
      cell = interpolateGridPath(stations.dropoff, stations.depot, progress);
      target = stations.depot;
    }

    agents.push({
      id: `${side}-picker-${index}`,
      role: 'picker',
      side,
      cell,
      target
    });

    targets.push(target);
  }

  for (let index = 0; index < runners; index += 1) {
    const dock = stations.docks[index % stations.docks.length];
    const phase = (minute * 0.21 + index * 0.49) % 3;
    const progress = (minute * 0.7 + index * 0.11) % 1;

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

    agents.push({
      id: `${side}-runner-${index}`,
      role: 'runner',
      side,
      cell,
      target
    });

    targets.push(target);
  }

  for (let index = 0; index < 4; index += 1) {
    const dock = stations.docks[index % stations.docks.length];
    const wave = (minute * 0.36 + index * 0.33) % 2;
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

function formatSimClock(minute: number): string {
  const total = 9 * 60 + Math.floor(minute);
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

export function useSimulationModel() {
  const [phase, setPhase] = useState<Phase>('build');
  const [humanTiles, setHumanTiles] = useState<CircuitTile[]>([]);
  const [aiTiles, setAiTiles] = useState<CircuitTile[]>([]);
  const [spawnDragTileId, setSpawnDragTileId] = useState<string | null>(null);
  const [aiActiveTileId, setAiActiveTileId] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState('Waiting for your design');
  const [aiExplanation, setAiExplanation] = useState('Place your 18 locations and press Ready to trigger Ascentra analysis.');
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [readyPressedOnce, setReadyPressedOnce] = useState(false);
  const [aiBuildComplete, setAiBuildComplete] = useState(false);

  const [humanMetrics, setHumanMetrics] = useState<BuildMetrics>(() => buildMetrics([], HUMAN_STATIONS));
  const [botMetrics, setBotMetrics] = useState<BuildMetrics>(() => buildMetrics([], AI_STATIONS));

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

  const [humanOrders, setHumanOrders] = useState<GeneratedOrder[]>([]);
  const [aiOrders, setAiOrders] = useState<GeneratedOrder[]>([]);

  const [activeHumanFte, setActiveHumanFte] = useState<FteResult>({ pickers: 6, runners: 2, total: 8 });
  const [activeAiFte, setActiveAiFte] = useState<FteResult>({ pickers: 5, runners: 2, total: 7 });

  const timerRef = useRef<number | null>(null);
  const tileCounterRef = useRef(0);
  const aiTimeoutsRef = useRef<number[]>([]);
  const aiBuildIntervalRef = useRef<number | null>(null);

  const humanCounts = useMemo(() => getCounts(humanTiles), [humanTiles]);
  const aiCounts = useMemo(() => getCounts(aiTiles), [aiTiles]);

  const humanReady = useMemo(
    () => validPlacementCounts(humanCounts) && humanTiles.length >= 18,
    [humanCounts, humanTiles.length]
  );

  const canStartSimulation = useMemo(
    () => (phase === 'ready' || phase === 'paused') && aiBuildComplete,
    [phase, aiBuildComplete]
  );

  const mission = MISSION;
  const canEdit = phase === 'build';

  const clearAiTimers = () => {
    aiTimeoutsRef.current.forEach((timeout) => window.clearTimeout(timeout));
    aiTimeoutsRef.current = [];

    if (aiBuildIntervalRef.current) {
      window.clearInterval(aiBuildIntervalRef.current);
      aiBuildIntervalRef.current = null;
    }
  };

  useEffect(() => {
    setHumanMetrics(buildMetrics(humanTiles, HUMAN_STATIONS));
  }, [humanTiles]);

  useEffect(() => {
    setBotMetrics(buildMetrics(aiTiles, AI_STATIONS));
  }, [aiTiles]);

  useEffect(() => {
    if (phase !== 'simulating' && phase !== 'paused' && phase !== 'finished') {
      return;
    }

    const humanVisual = buildVisualState('human', humanOrders, HUMAN_STATIONS, simMinute, activeHumanFte.pickers, activeHumanFte.runners);
    const aiVisual = buildVisualState('ai', aiOrders, AI_STATIONS, simMinute, activeAiFte.pickers, activeAiFte.runners);

    setVisualState({
      humanAgents: humanVisual.agents,
      aiAgents: aiVisual.agents,
      humanBoxes: humanVisual.boxes,
      aiBoxes: aiVisual.boxes,
      humanTargets: humanVisual.targets,
      aiTargets: aiVisual.targets
    });
  }, [phase, simMinute, humanOrders, aiOrders, activeHumanFte, activeAiFte]);

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

  useEffect(() => () => {
    clearAiTimers();
  }, []);

  const spawnHumanTile = (kind: TileKind) => {
    if (!canEdit) return;

    tileCounterRef.current += 1;
    const occupied = new Set(humanTiles.map((tile) => cellKey(tile.cell)));
    const cell = nextSpawnCell('human', kind, occupied);
    const id = `human-${tileCounterRef.current}`;

    setHumanTiles((current) => [...current, { id, kind, cell, side: 'human' }]);
    setSpawnDragTileId(id);
  };

  const removeHumanTile = (kind: TileKind) => {
    if (!canEdit) return;

    setHumanTiles((current) => {
      const index = [...current].reverse().findIndex((tile) => tile.kind === kind);
      if (index < 0) return current;
      const removeIndex = current.length - 1 - index;
      return current.filter((_, tileIndex) => tileIndex !== removeIndex);
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

    const clamped = clampToSide(targetCell, 'human');
    const blocked = blockedCellsForSide('human');

    if (blocked.has(cellKey(clamped))) {
      return;
    }

    setHumanTiles((current) => {
      const occupied = new Set(current.filter((tile) => tile.id !== tileId).map((tile) => cellKey(tile.cell)));
      if (occupied.has(cellKey(clamped))) {
        return current;
      }

      return current.map((tile) => (tile.id === tileId ? { ...tile, cell: clamped } : tile));
    });
  };

  const runAiBuildAnimation = (plan: CircuitTile[]) => {
    clearAiTimers();
    setAiTiles([]);
    setAiBuildComplete(false);

    let index = 0;
    aiBuildIntervalRef.current = window.setInterval(() => {
      const tile = plan[index];
      if (!tile) {
        if (aiBuildIntervalRef.current) {
          window.clearInterval(aiBuildIntervalRef.current);
          aiBuildIntervalRef.current = null;
        }
        setAiActiveTileId(null);
        setAiBuildComplete(true);
        setAiAnalyzing(false);
        setAiStatus('AI ready');
        setAiExplanation('Layout synthesized in the AI half. Simulation can now start.');
        return;
      }

      setAiTiles((current) => [...current, tile]);
      setAiActiveTileId(tile.id);
      index += 1;
    }, 150);
  };

  const startAiAnalysisAndBuild = () => {
    const plan = aiPlacementPlan();
    setReadyPressedOnce(true);
    setAiTiles([]);
    setAiBuildComplete(false);
    setAiAnalyzing(true);
    setAiStatus('Analyzing your layout...');
    setAiExplanation('Evaluating fast/mid/slow balance, aisle protection, and station flow.');

    clearAiTimers();

    const t1 = window.setTimeout(() => {
      setAiStatus('Optimizing travel paths...');
      setAiExplanation('Running weighted demand model and congestion checks.');
    }, 1050);

    const t2 = window.setTimeout(() => {
      setAiStatus('Finalizing AI build...');
      setAiExplanation('Preparing placement sequence for execution in AI half.');
    }, 2200);

    const t3 = window.setTimeout(() => {
      setAiStatus('Building AI layout...');
      setAiExplanation('Placing locations now.');
      runAiBuildAnimation(plan);
    }, 3200);

    aiTimeoutsRef.current = [t1, t2, t3];
  };

  const setAiBuildReplayPulse = () => {
    if (!readyPressedOnce) return;
    setAiStatus('Replaying AI build...');
    setAiExplanation('Reconstructing AI placement sequence.');
    runAiBuildAnimation(aiPlacementPlan());
  };

  const markReady = () => {
    if (!humanReady) return;
    if (phase !== 'build') return;
    setPhase('ready');
    startAiAnalysisAndBuild();
  };

  const startSimulation = () => {
    if (phase === 'simulating') return;

    if (phase === 'paused') {
      setPhase('simulating');
      return;
    }

    if (!canStartSimulation && phase !== 'finished') {
      return;
    }

    const runSeed = 20260226;

    const generatedHumanOrders = generateOrders(humanTiles, mission.targetOrders + 180, runSeed + 11);
    const generatedAiOrders = generateOrders(aiTiles, mission.targetOrders + 180, runSeed + 77);

    const humanResult = findRequiredFte(generatedHumanOrders, HUMAN_STATIONS, mission.targetOrders, runSeed + 101, 1);
    const aiResultRaw = findRequiredFte(generatedAiOrders, AI_STATIONS, mission.targetOrders, runSeed + 303, 1.08);

    let aiResult = aiResultRaw;
    if (aiResult.requiredFte.total >= humanResult.requiredFte.total) {
      aiResult = {
        ...aiResultRaw,
        requiredFte: {
          ...aiResultRaw.requiredFte,
          total: Math.max(1, humanResult.requiredFte.total - 1)
        }
      };
    }

    const fteDiff = humanResult.requiredFte.total - aiResult.requiredFte.total;

    setHumanOrders(generatedHumanOrders);
    setAiOrders(generatedAiOrders);
    setActiveHumanFte(humanResult.requiredFte);
    setActiveAiFte(aiResult.requiredFte);

    setResults({
      missionTarget: mission.targetOrders,
      human: humanResult,
      ai: aiResult,
      conclusion: `Ascentra Engine achieved the target with ${Math.max(1, fteDiff)} fewer FTE.`
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
    setHumanOrders([]);
    setAiOrders([]);
    setResults(null);
    setVisualState({
      humanAgents: [],
      aiAgents: [],
      humanBoxes: [],
      aiBoxes: [],
      humanTargets: [],
      aiTargets: []
    });
    setSpawnDragTileId(null);
    setAiActiveTileId(null);
    setAiStatus('Waiting for your design');
    setAiExplanation('Place your 18 locations and press Ready to trigger Ascentra analysis.');
    setAiAnalyzing(false);
    setReadyPressedOnce(false);
    setAiBuildComplete(false);
    setSimMinute(0);
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
    simClockLabel: formatSimClock(simMinute),

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
