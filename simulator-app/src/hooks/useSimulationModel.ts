import { useEffect, useMemo, useRef, useState } from 'react';

export const BOARD_COLS = 16;
export const BOARD_ROWS = 10;
export const CELL_SIZE = 1;
export const DEPOT_CELL: GridCell = { col: 1, row: 5 };

export type TileKind = 'F' | 'M' | 'S';

export type GridCell = {
  col: number;
  row: number;
};

export type CircuitTile = {
  id: string;
  kind: TileKind;
  cell: GridCell;
};

export type Metrics = {
  travelDistance: number;
  congestionPenalty: number;
  zoningScore: number;
  efficiencyScore: number;
  totalTiles: number;
};

type Counts = Record<TileKind, number>;

const AI_COUNTS_TARGET: Counts = { F: 6, M: 6, S: 6 };
const AI_TOTAL_TARGET = 18;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function cellKey(cell: GridCell): string {
  return `${cell.col}:${cell.row}`;
}

function manhattanDistance(a: GridCell, b: GridCell): number {
  return Math.abs(a.col - b.col) + Math.abs(a.row - b.row);
}

function countNeighbors(cells: GridCell[], target: GridCell, radius = 1): number {
  return cells.reduce((sum, cell) => {
    if (cell.col === target.col && cell.row === target.row) {
      return sum;
    }
    return sum + (Math.abs(cell.col - target.col) <= radius && Math.abs(cell.row - target.row) <= radius ? 1 : 0);
  }, 0);
}

function getCounts(tiles: CircuitTile[]): Counts {
  const counts: Counts = { F: 0, M: 0, S: 0 };
  tiles.forEach((tile) => {
    counts[tile.kind] += 1;
  });
  return counts;
}

function scoreDistance(tile: CircuitTile): number {
  const dist = manhattanDistance(tile.cell, DEPOT_CELL);
  if (tile.kind === 'F') return dist * 1.35;
  if (tile.kind === 'M') return dist * 1;
  return dist * 0.72;
}

function scoreZoning(tile: CircuitTile): number {
  const dist = manhattanDistance(tile.cell, DEPOT_CELL);
  if (tile.kind === 'F') {
    if (dist <= 4) return 2.3;
    if (dist <= 6) return 0.7;
    return -1.6;
  }
  if (tile.kind === 'M') {
    if (dist >= 4 && dist <= 8) return 1.7;
    if (dist >= 3 && dist <= 9) return 0.6;
    return -0.9;
  }
  if (dist >= 7) return 1.8;
  if (dist >= 5) return 0.5;
  return -1.4;
}

function computeMetrics(tiles: CircuitTile[]): Metrics {
  if (tiles.length === 0) {
    return {
      travelDistance: 0,
      congestionPenalty: 0,
      zoningScore: 0,
      efficiencyScore: 0,
      totalTiles: 0
    };
  }

  const weightedTravel = tiles.reduce((sum, tile) => sum + scoreDistance(tile), 0);
  const travelDistance = weightedTravel / tiles.length;

  let congestionPairs = 0;
  let fastClusterPenalty = 0;

  for (let index = 0; index < tiles.length; index += 1) {
    for (let inner = index + 1; inner < tiles.length; inner += 1) {
      const left = tiles[index];
      const right = tiles[inner];
      const manhattan = manhattanDistance(left.cell, right.cell);

      if (manhattan <= 1) {
        congestionPairs += 1;
        if (left.kind === 'F' && right.kind === 'F') {
          fastClusterPenalty += 1.2;
        }
      }
    }
  }

  const congestionPenalty = congestionPairs + fastClusterPenalty;
  const zoningScore = tiles.reduce((sum, tile) => sum + scoreZoning(tile), 0) / tiles.length;

  const distanceComponent = clamp(100 - travelDistance * 8.2, 0, 100);
  const congestionComponent = clamp(100 - congestionPenalty * 7.6, 0, 100);
  const zoningComponent = clamp(50 + zoningScore * 22, 0, 100);
  const completionComponent = clamp((tiles.length / AI_TOTAL_TARGET) * 100, 0, 100);

  const efficiencyScore = clamp(
    distanceComponent * 0.35 + congestionComponent * 0.25 + zoningComponent * 0.3 + completionComponent * 0.1,
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

function worldCells(): GridCell[] {
  const cells: GridCell[] = [];
  for (let col = 0; col < BOARD_COLS; col += 1) {
    for (let row = 0; row < BOARD_ROWS; row += 1) {
      if (col === DEPOT_CELL.col && row === DEPOT_CELL.row) {
        continue;
      }
      cells.push({ col, row });
    }
  }
  return cells;
}

function chooseAiCells(kind: TileKind, count: number, occupied: Set<string>, chosenFast: GridCell[]): GridCell[] {
  const all = worldCells().filter((cell) => !occupied.has(cellKey(cell)));
  const sortedByDist = all
    .map((cell) => ({ cell, dist: manhattanDistance(cell, DEPOT_CELL) }))
    .sort((a, b) => a.dist - b.dist);

  const picked: GridCell[] = [];

  for (let idx = 0; idx < count; idx += 1) {
    const candidatePool = sortedByDist.filter(({ cell }) => !occupied.has(cellKey(cell)));

    let selected: GridCell | null = null;
    let bestScore = Number.POSITIVE_INFINITY;

    for (const entry of candidatePool) {
      const cell = entry.cell;
      const dist = entry.dist;

      let score = 0;

      if (kind === 'F') {
        const fastNeighbors = countNeighbors(chosenFast, cell, 1);
        score = dist * 2.1 + fastNeighbors * 6.5;
      } else if (kind === 'M') {
        score = Math.abs(dist - 6.5) * 2 + dist * 0.15;
      } else {
        score = (12 - dist) * 2.2;
      }

      if (score < bestScore) {
        bestScore = score;
        selected = cell;
      }
    }

    if (!selected) {
      break;
    }

    occupied.add(cellKey(selected));
    picked.push(selected);

    if (kind === 'F') {
      chosenFast.push(selected);
    }
  }

  return picked;
}

function buildAiPlan(): CircuitTile[] {
  const occupied = new Set<string>();
  const chosenFast: GridCell[] = [];

  const fastCells = chooseAiCells('F', AI_COUNTS_TARGET.F, occupied, chosenFast);
  const midCells = chooseAiCells('M', AI_COUNTS_TARGET.M, occupied, chosenFast);
  const slowCells = chooseAiCells('S', AI_COUNTS_TARGET.S, occupied, chosenFast);

  const plan: CircuitTile[] = [
    ...fastCells.map((cell, index) => ({ id: `ai-f-${index + 1}`, kind: 'F' as const, cell })),
    ...midCells.map((cell, index) => ({ id: `ai-m-${index + 1}`, kind: 'M' as const, cell })),
    ...slowCells.map((cell, index) => ({ id: `ai-s-${index + 1}`, kind: 'S' as const, cell }))
  ];

  return plan.sort((left, right) => {
    const order: Record<TileKind, number> = { F: 0, M: 1, S: 2 };
    const byKind = order[left.kind] - order[right.kind];
    if (byKind !== 0) return byKind;

    const leftDist = manhattanDistance(left.cell, DEPOT_CELL);
    const rightDist = manhattanDistance(right.cell, DEPOT_CELL);
    return leftDist - rightDist;
  });
}

function nextSpawnCell(kind: TileKind, occupied: Set<string>): GridCell {
  const preferredRows: Record<TileKind, number[]> = {
    F: [1, 2, 3],
    M: [4, 5, 6],
    S: [7, 8, 9]
  };

  for (const row of preferredRows[kind]) {
    for (let col = 0; col < BOARD_COLS; col += 1) {
      const cell = { col, row };
      if (!occupied.has(cellKey(cell)) && !(cell.col === DEPOT_CELL.col && cell.row === DEPOT_CELL.row)) {
        return cell;
      }
    }
  }

  for (let row = 0; row < BOARD_ROWS; row += 1) {
    for (let col = 0; col < BOARD_COLS; col += 1) {
      const cell = { col, row };
      if (!occupied.has(cellKey(cell)) && !(cell.col === DEPOT_CELL.col && cell.row === DEPOT_CELL.row)) {
        return cell;
      }
    }
  }

  return { col: 0, row: 0 };
}

export function useSimulationModel() {
  const [humanTiles, setHumanTiles] = useState<CircuitTile[]>([]);
  const [aiTiles, setAiTiles] = useState<CircuitTile[]>([]);
  const [humanMetrics, setHumanMetrics] = useState<Metrics>(() => computeMetrics([]));
  const [botMetrics, setBotMetrics] = useState<Metrics>(() => computeMetrics([]));
  const [botThinking, setBotThinking] = useState(false);
  const [botPulseKey, setBotPulseKey] = useState(0);
  const [spawnDragTileId, setSpawnDragTileId] = useState<string | null>(null);
  const [aiActiveTileId, setAiActiveTileId] = useState<string | null>(null);

  const intervalRef = useRef<number | null>(null);
  const tileCounterRef = useRef(0);

  const humanCounts = useMemo(() => getCounts(humanTiles), [humanTiles]);
  const aiCounts = useMemo(() => getCounts(aiTiles), [aiTiles]);

  const botStatus = useMemo(() => {
    if (botThinking) {
      return 'Ascentra AI building...';
    }
    return `Resolved · ${botMetrics.efficiencyScore.toFixed(1)} score`;
  }, [botThinking, botMetrics.efficiencyScore]);

  useEffect(() => {
    setHumanMetrics(computeMetrics(humanTiles));
  }, [humanTiles]);

  useEffect(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
    }

    const plan = buildAiPlan();
    setAiTiles([]);
    setAiActiveTileId(null);
    setBotThinking(true);

    let step = 0;
    intervalRef.current = window.setInterval(() => {
      const next = plan[step];

      if (!next) {
        if (intervalRef.current) {
          window.clearInterval(intervalRef.current);
        }
        setBotThinking(false);
        setAiActiveTileId(null);
        setBotMetrics(computeMetrics(plan));
        return;
      }

      setAiTiles((current) => [...current, next]);
      setAiActiveTileId(next.id);
      setBotPulseKey((value) => value + 1);
      step += 1;

      if (step >= plan.length && intervalRef.current) {
        window.clearInterval(intervalRef.current);
        setTimeout(() => {
          setBotThinking(false);
          setAiActiveTileId(null);
          setBotMetrics(computeMetrics(plan));
        }, 150);
      }
    }, 320);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [humanTiles]);

  const spawnHumanTile = (kind: TileKind) => {
    tileCounterRef.current += 1;
    const occupied = new Set(humanTiles.map((tile) => cellKey(tile.cell)));
    const cell = nextSpawnCell(kind, occupied);
    const id = `human-${tileCounterRef.current}`;

    setHumanTiles((current) => [...current, { id, kind, cell }]);
    setSpawnDragTileId(id);
  };

  const consumeSpawnDragTile = () => {
    setSpawnDragTileId(null);
  };

  const commitHumanTile = (tileId: string, cell: GridCell) => {
    setHumanTiles((current) =>
      current.map((tile) => (tile.id === tileId ? { ...tile, cell } : tile))
    );
  };

  const reset = () => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
    }

    tileCounterRef.current = 0;
    setHumanTiles([]);
    setAiTiles([]);
    setHumanMetrics(computeMetrics([]));
    setBotMetrics(computeMetrics([]));
    setBotThinking(false);
    setBotPulseKey((value) => value + 1);
    setSpawnDragTileId(null);
    setAiActiveTileId(null);
  };

  return {
    humanTiles,
    aiTiles,
    humanCounts,
    aiCounts,
    humanMetrics,
    botMetrics,
    botStatus,
    botThinking,
    botPulseKey,
    spawnDragTileId,
    aiActiveTileId,
    spawnHumanTile,
    consumeSpawnDragTile,
    commitHumanTile,
    reset
  };
}
