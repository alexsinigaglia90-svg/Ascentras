import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, ThreeEvent, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import {
  BOARD_COLS,
  BOARD_ROWS,
  CELL_SIZE,
  HUMAN_COL_RANGE,
  type AgentVisual,
  type BoxVisual,
  type CircuitTile,
  type GridCell,
  type Phase,
  type StationSet
} from '../hooks/useSimulationModel';
import { ErrorBoundary } from './ErrorBoundary';

type ThreeSceneProps = {
  phase: Phase;
  canEdit: boolean;
  humanTiles: CircuitTile[];
  aiTiles: CircuitTile[];
  humanStations: StationSet;
  aiStations: StationSet;
  spawnDragTileId: string | null;
  aiActiveTileId: string | null;
  visualState: {
    humanAgents: AgentVisual[];
    aiAgents: AgentVisual[];
    humanBoxes: BoxVisual[];
    aiBoxes: BoxVisual[];
    humanTargets: GridCell[];
    aiTargets: GridCell[];
  };
  onCommitHumanTile: (tileId: string, cell: GridCell) => void;
  onConsumeSpawnDragTile: () => void;
};

const ORIGIN_X = -((BOARD_COLS - 1) * CELL_SIZE) / 2;
const ORIGIN_Z = -((BOARD_ROWS - 1) * CELL_SIZE) / 2;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function cellToWorld(cell: GridCell, y = 0): [number, number, number] {
  return [ORIGIN_X + cell.col * CELL_SIZE, y, ORIGIN_Z + cell.row * CELL_SIZE];
}

function worldToCell(point: THREE.Vector3): GridCell {
  return {
    col: clamp(Math.round((point.x - ORIGIN_X) / CELL_SIZE), 0, BOARD_COLS - 1),
    row: clamp(Math.round((point.z - ORIGIN_Z) / CELL_SIZE), 0, BOARD_ROWS - 1)
  };
}

function cellKey(cell: GridCell): string {
  return `${cell.col}:${cell.row}`;
}

function sideClamp(cell: GridCell): GridCell {
  return {
    col: clamp(cell.col, HUMAN_COL_RANGE.min, HUMAN_COL_RANGE.max),
    row: clamp(cell.row, 0, BOARD_ROWS - 1)
  };
}

function labelTexture(label: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const context = canvas.getContext('2d');

  if (!context) {
    return new THREE.CanvasTexture(canvas);
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = 'rgba(5, 11, 20, 0.78)';
  context.beginPath();
  context.roundRect(10, 16, 236, 94, 24);
  context.fill();

  context.strokeStyle = 'rgba(145, 181, 231, 0.72)';
  context.lineWidth = 4;
  context.stroke();

  context.fillStyle = '#e7f0ff';
  context.font = '700 38px Inter, Segoe UI, Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(label, 128, 66);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function TileMaterial({ kind, hover, active }: { kind: CircuitTile['kind']; hover: boolean; active: boolean }) {
  const palette =
    kind === 'F'
      ? { color: '#6ca9ff', emissive: '#4c8ef5' }
      : kind === 'M'
        ? { color: '#8caed9', emissive: '#6f91bb' }
        : { color: '#a4b3c4', emissive: '#708196' };

  return (
    <meshStandardMaterial
      color={palette.color}
      emissive={palette.emissive}
      emissiveIntensity={0.18 + (hover ? 0.2 : 0) + (active ? 0.3 : 0)}
      roughness={0.38}
      metalness={0.32}
    />
  );
}

function GridLines() {
  const geometry = useMemo(() => {
    const points: number[] = [];

    for (let col = 0; col <= BOARD_COLS; col += 1) {
      const x = ORIGIN_X - 0.5 + col * CELL_SIZE;
      points.push(x, 0.01, ORIGIN_Z - 0.5, x, 0.01, ORIGIN_Z - 0.5 + BOARD_ROWS * CELL_SIZE);
    }

    for (let row = 0; row <= BOARD_ROWS; row += 1) {
      const z = ORIGIN_Z - 0.5 + row * CELL_SIZE;
      points.push(ORIGIN_X - 0.5, 0.01, z, ORIGIN_X - 0.5 + BOARD_COLS * CELL_SIZE, 0.01, z);
    }

    const buffer = new THREE.BufferGeometry();
    buffer.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    return buffer;
  }, []);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#94b0da" transparent opacity={0.24} />
    </lineSegments>
  );
}

function Conveyor({ from, to }: { from: GridCell; to: GridCell }) {
  const stripeRef = useRef<THREE.Group | null>(null);

  const center = useMemo(() => {
    const [fx, , fz] = cellToWorld(from);
    const [tx, , tz] = cellToWorld(to);
    return [(fx + tx) / 2, 0.12, (fz + tz) / 2] as [number, number, number];
  }, [from, to]);

  const length = useMemo(() => manhattan(from, to) + 0.9, [from, to]);
  const rotationY = Math.abs(from.col - to.col) > Math.abs(from.row - to.row) ? 0 : Math.PI / 2;

  useFrame(({ clock }) => {
    if (!stripeRef.current) return;
    const t = clock.elapsedTime * 0.7;

    stripeRef.current.children.forEach((child, index) => {
      const stripe = child as THREE.Mesh;
      const offset = ((t + index * 0.22) % 1) * (length - 0.5) - (length - 0.5) / 2;
      stripe.position.set(offset, 0.02, 0);
    });
  });

  return (
    <group position={center} rotation={[0, rotationY, 0]}>
      <mesh>
        <boxGeometry args={[length, 0.06, 0.38]} />
        <meshStandardMaterial color="#293a52" emissive="#3d587d" emissiveIntensity={0.2} roughness={0.46} metalness={0.3} />
      </mesh>
      <group ref={stripeRef}>
        {new Array(6).fill(0).map((_, index) => (
          <mesh key={index}>
            <boxGeometry args={[0.28, 0.012, 0.18]} />
            <meshStandardMaterial color="#9fc0ec" emissive="#7ea9e2" emissiveIntensity={0.4} roughness={0.34} metalness={0.24} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function StationObject({ cell, title, accent, scale = [0.88, 0.42, 0.88] as [number, number, number] }: {
  cell: GridCell;
  title: string;
  accent: string;
  scale?: [number, number, number];
}) {
  const [texture] = useState(() => labelTexture(title));
  const [x, y, z] = cellToWorld(cell, 0.24);

  return (
    <group position={[x, y, z]}>
      <mesh>
        <boxGeometry args={scale} />
        <meshStandardMaterial color="#263548" emissive={accent} emissiveIntensity={0.26} roughness={0.4} metalness={0.36} />
      </mesh>
      <mesh position={[0, 0.24, 0]}>
        <boxGeometry args={[scale[0] * 0.88, 0.04, scale[2] * 0.88]} />
        <meshStandardMaterial color="#8ab0e2" emissive="#7da6dd" emissiveIntensity={0.2} roughness={0.28} metalness={0.3} />
      </mesh>
      <sprite position={[0, 0.52, 0]} scale={[1.16, 0.5, 1]}>
        <spriteMaterial map={texture} transparent depthWrite={false} />
      </sprite>
    </group>
  );
}

function DockGroup({ docks }: { docks: GridCell[] }) {
  return (
    <>
      {docks.map((dock, index) => (
        <group key={`dock-${dock.col}-${dock.row}`} position={cellToWorld(dock, 0.21)}>
          <mesh>
            <boxGeometry args={[0.94, 0.34, 0.58]} />
            <meshStandardMaterial color="#1f2e42" emissive="#5b82bc" emissiveIntensity={0.2} roughness={0.45} metalness={0.32} />
          </mesh>
          <mesh position={[0, 0.2, 0.22]}>
            <planeGeometry args={[0.34, 0.18]} />
            <meshBasicMaterial color="#dce9ff" />
          </mesh>
          <sprite position={[0, 0.36, 0]} scale={[0.5, 0.22, 1]}>
            <spriteMaterial map={labelTexture(`${index + 1}`)} transparent depthWrite={false} />
          </sprite>
        </group>
      ))}
    </>
  );
}

function Tile({
  tile,
  y,
  hover,
  active,
  previewCell,
  isDragging,
  onPointerDown,
  onPointerOver,
  onPointerOut
}: {
  tile: CircuitTile;
  y: number;
  hover: boolean;
  active: boolean;
  previewCell?: GridCell | null;
  isDragging: boolean;
  onPointerDown?: (event: ThreeEvent<PointerEvent>) => void;
  onPointerOver?: (event: ThreeEvent<PointerEvent>) => void;
  onPointerOut?: (event: ThreeEvent<PointerEvent>) => void;
}) {
  const [tex] = useState(() => labelTexture(tile.kind));
  const groupRef = useRef<THREE.Group | null>(null);
  const smooth = useRef(new THREE.Vector3());

  const target = useMemo(() => {
    const cell = isDragging && previewCell ? previewCell : tile.cell;
    const [x, yy, z] = cellToWorld(cell, y);
    return new THREE.Vector3(x, yy, z);
  }, [isDragging, previewCell, tile.cell, y]);

  useEffect(() => {
    if (!groupRef.current) return;
    if (smooth.current.lengthSq() === 0) {
      smooth.current.copy(target);
      groupRef.current.position.copy(target);
    }
  }, [target]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (isDragging) {
      smooth.current.copy(target);
      groupRef.current.position.copy(target);
      return;
    }

    const ease = 1 - Math.exp(-delta * 10);
    smooth.current.lerp(target, ease);
    groupRef.current.position.copy(smooth.current);
  });

  return (
    <group ref={groupRef} onPointerDown={onPointerDown} onPointerOver={onPointerOver} onPointerOut={onPointerOut}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.82, 0.34, 0.82]} />
        <TileMaterial kind={tile.kind} hover={hover} active={active} />
      </mesh>
      <sprite position={[0, 0.42, 0]} scale={hover ? [0.5, 0.5, 0.5] : [0.44, 0.44, 0.44]}>
        <spriteMaterial map={tex} transparent depthWrite={false} />
      </sprite>
    </group>
  );
}

function manhattan(a: GridCell, b: GridCell) {
  return Math.abs(a.col - b.col) + Math.abs(a.row - b.row);
}

function SceneRig({
  phase,
  canEdit,
  humanTiles,
  aiTiles,
  humanStations,
  aiStations,
  spawnDragTileId,
  aiActiveTileId,
  visualState,
  onCommitHumanTile,
  onConsumeSpawnDragTile
}: ThreeSceneProps) {
  const [draggingTileId, setDraggingTileId] = useState<string | null>(null);
  const [previewCell, setPreviewCell] = useState<GridCell | null>(null);
  const [hoverTileId, setHoverTileId] = useState<string | null>(null);
  const [focusCell, setFocusCell] = useState<GridCell | null>(null);
  const [effectsEnabled, setEffectsEnabled] = useState(true);

  const blockedHuman = useMemo(() => {
    const blocked = new Set<string>([
      cellKey(humanStations.depot),
      cellKey(humanStations.dropoff),
      cellKey(humanStations.packingTable),
      cellKey(humanStations.machine),
      cellKey(humanStations.outbound),
      ...humanStations.docks.map((dock) => cellKey(dock))
    ]);
    return blocked;
  }, [humanStations]);

  useEffect(() => {
    if (!spawnDragTileId || !canEdit) return;
    const tile = humanTiles.find((item) => item.id === spawnDragTileId);
    if (tile) {
      setDraggingTileId(tile.id);
      setPreviewCell(tile.cell);
    }
    onConsumeSpawnDragTile();
  }, [spawnDragTileId, canEdit, humanTiles, onConsumeSpawnDragTile]);

  const occupancy = useMemo(() => {
    const occupied = new Set<string>();
    humanTiles.forEach((tile) => {
      if (tile.id !== draggingTileId) {
        occupied.add(cellKey(tile.cell));
      }
    });
    return occupied;
  }, [humanTiles, draggingTileId]);

  const floorWidth = BOARD_COLS * CELL_SIZE + 4;
  const floorDepth = BOARD_ROWS * CELL_SIZE + 4;

  const handleBoardMove = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    const worldCell = worldToCell(event.point);

    if (draggingTileId && canEdit) {
      const clamped = sideClamp(worldCell);
      setPreviewCell(clamped);
      setFocusCell(clamped);
      return;
    }

    setFocusCell(worldCell);
  };

  const commitDrag = () => {
    if (!draggingTileId || !previewCell || !canEdit) {
      setDraggingTileId(null);
      setPreviewCell(null);
      return;
    }

    const cell = sideClamp(previewCell);
    if (blockedHuman.has(cellKey(cell)) || occupancy.has(cellKey(cell))) {
      setDraggingTileId(null);
      setPreviewCell(null);
      return;
    }

    onCommitHumanTile(draggingTileId, cell);
    setDraggingTileId(null);
    setPreviewCell(null);
  };

  const aiPulse = aiActiveTileId ? 0.35 : 0;

  return (
    <>
      <fog attach="fog" args={['#060b12', 23, 58]} />
      <ambientLight intensity={0.4} color="#a8c2e4" />
      <hemisphereLight intensity={0.74} color="#dce9ff" groundColor="#111b2a" position={[0, 16, 0]} />
      <directionalLight position={[11, 17, 9]} intensity={0.95} color="#dbe8ff" />
      <directionalLight position={[-12, 9, -11]} intensity={0.55} color="#5f89c4" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]} receiveShadow>
        <planeGeometry args={[floorWidth, floorDepth]} />
        <meshStandardMaterial color="#0b121d" roughness={0.94} metalness={0.06} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-4, 0.005, 0]}>
        <planeGeometry args={[8, BOARD_ROWS]} />
        <meshBasicMaterial color="#6f9ad4" transparent opacity={0.08} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4, 0.005, 0]}>
        <planeGeometry args={[8, BOARD_ROWS]} />
        <meshBasicMaterial color="#8ea8cc" transparent opacity={0.07} />
      </mesh>

      <mesh position={cellToWorld({ col: 7, row: 4.5 }, 0.04)}>
        <boxGeometry args={[0.06, 0.08, BOARD_ROWS + 0.8]} />
        <meshStandardMaterial color="#9fb7db" emissive="#7b9ccf" emissiveIntensity={0.26} roughness={0.3} metalness={0.22} />
      </mesh>

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        onPointerMove={handleBoardMove}
        onPointerOut={() => setFocusCell(null)}
        onPointerUp={(event) => {
          event.stopPropagation();
          commitDrag();
        }}
      >
        <planeGeometry args={[BOARD_COLS * CELL_SIZE, BOARD_ROWS * CELL_SIZE]} />
        <meshBasicMaterial visible={false} transparent opacity={0} depthWrite={false} />
      </mesh>

      <GridLines />

      {focusCell ? (
        <mesh position={cellToWorld(draggingTileId ? sideClamp(focusCell) : focusCell, 0.01)}>
          <boxGeometry args={[0.98, 0.01, 0.98]} />
          <meshStandardMaterial color="#9bb8e2" emissive="#7fa4da" emissiveIntensity={0.2} transparent opacity={0.16} />
        </mesh>
      ) : null}

      {draggingTileId && previewCell ? (
        <mesh position={cellToWorld(sideClamp(previewCell), 0.02)}>
          <boxGeometry args={[0.92, 0.02, 0.92]} />
          <meshStandardMaterial
            color={occupancy.has(cellKey(sideClamp(previewCell))) || blockedHuman.has(cellKey(sideClamp(previewCell))) ? '#c56f6f' : '#7da7df'}
            emissive={occupancy.has(cellKey(sideClamp(previewCell))) || blockedHuman.has(cellKey(sideClamp(previewCell))) ? '#aa5d5d' : '#6f9bd8'}
            emissiveIntensity={0.42}
            transparent
            opacity={0.56}
          />
        </mesh>
      ) : null}

      <StationObject cell={humanStations.depot} title="Depot" accent="#6f9ed8" />
      <StationObject cell={humanStations.dropoff} title="Drop" accent="#79a5dd" />
      <StationObject cell={humanStations.packingTable} title="Packing" accent="#87abd8" />
      <StationObject cell={humanStations.machine} title="Machine" accent="#6d9add" />
      <StationObject cell={humanStations.outbound} title="Outbound" accent="#6f94c9" />
      <DockGroup docks={humanStations.docks} />
      <Conveyor from={humanStations.dropoff} to={humanStations.machine} />

      <StationObject cell={aiStations.depot} title="Depot" accent="#6f9ed8" />
      <StationObject cell={aiStations.dropoff} title="Drop" accent="#79a5dd" />
      <StationObject cell={aiStations.packingTable} title="Packing" accent="#87abd8" />
      <StationObject cell={aiStations.machine} title="Machine" accent="#6d9add" />
      <StationObject cell={aiStations.outbound} title="Outbound" accent="#6f94c9" />
      <DockGroup docks={aiStations.docks} />
      <Conveyor from={aiStations.dropoff} to={aiStations.machine} />

      {humanTiles.map((tile) => (
        <Tile
          key={tile.id}
          tile={tile}
          y={0.18}
          hover={hoverTileId === tile.id}
          active={phase === 'simulating'}
          previewCell={previewCell}
          isDragging={draggingTileId === tile.id}
          onPointerDown={(event) => {
            if (!canEdit) return;
            event.stopPropagation();
            setDraggingTileId(tile.id);
            setPreviewCell(tile.cell);
          }}
          onPointerOver={(event) => {
            event.stopPropagation();
            setHoverTileId(tile.id);
            setFocusCell(tile.cell);
          }}
          onPointerOut={() => {
            if (hoverTileId === tile.id) {
              setHoverTileId(null);
            }
          }}
        />
      ))}

      {aiTiles.map((tile) => (
        <Tile
          key={tile.id}
          tile={tile}
          y={0.18}
          hover={hoverTileId === tile.id}
          active={tile.id === aiActiveTileId}
          isDragging={false}
          onPointerOver={(event) => {
            event.stopPropagation();
            setHoverTileId(tile.id);
            setFocusCell(tile.cell);
          }}
          onPointerOut={() => {
            if (hoverTileId === tile.id) {
              setHoverTileId(null);
            }
          }}
        />
      ))}

      {[...visualState.humanTargets, ...visualState.aiTargets].map((target, index) => (
        <mesh key={`target-${index}-${target.col}-${target.row}`} position={cellToWorld(target, 0.06)}>
          <torusGeometry args={[0.22, 0.028, 10, 20]} />
          <meshStandardMaterial color="#b7cdf2" emissive="#95b7e6" emissiveIntensity={0.28} transparent opacity={0.5} />
        </mesh>
      ))}

      {[...visualState.humanBoxes, ...visualState.aiBoxes].map((box) => (
        <mesh key={box.id} position={cellToWorld(box.cell, 0.16)}>
          <boxGeometry args={[0.22, 0.22, 0.22]} />
          <meshStandardMaterial color="#d8e9ff" emissive="#89b0e8" emissiveIntensity={0.35} roughness={0.34} metalness={0.22} />
        </mesh>
      ))}

      {[...visualState.humanAgents, ...visualState.aiAgents].map((agent) => (
        <mesh key={agent.id} position={cellToWorld(agent.cell, 0.22)}>
          <sphereGeometry args={[agent.role === 'picker' ? 0.16 : 0.14, 16, 16]} />
          <meshStandardMaterial
            color={agent.role === 'picker' ? '#7cb3ff' : '#b8d3ff'}
            emissive={agent.role === 'picker' ? '#5e95e7' : '#8db0e2'}
            emissiveIntensity={agent.role === 'picker' ? 0.46 : 0.32}
            roughness={0.3}
            metalness={0.2}
          />
        </mesh>
      ))}

      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={16}
        maxDistance={26}
        minPolarAngle={0.82}
        maxPolarAngle={1.2}
        minAzimuthAngle={-0.42}
        maxAzimuthAngle={0.42}
        target={[0, 0, 0]}
      />

      {effectsEnabled ? (
        <ErrorBoundary
          onError={(error) => {
            console.error('[ThreeScene] Postprocessing failed, disabling effects.', error);
            setEffectsEnabled(false);
          }}
          fallbackRender={() => null}
        >
          <EffectComposer>
            <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.6} intensity={0.28 + aiPulse} />
            <Vignette eskil offset={0.14} darkness={0.72} />
          </EffectComposer>
        </ErrorBoundary>
      ) : null}
    </>
  );
}

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch (error) {
    console.error('[ThreeScene] WebGL detection failed.', error);
    return false;
  }
}

function BackgroundFallback({ reason }: { reason: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 rounded-2xl bg-[radial-gradient(circle_at_16%_20%,rgba(107,145,206,0.16),transparent_44%),radial-gradient(circle_at_86%_82%,rgba(117,146,199,0.12),transparent_46%),linear-gradient(180deg,rgba(6,10,18,0.42),rgba(6,10,18,0.86))]">
      <div className="absolute bottom-3 right-3 rounded-md border border-borderline bg-panel/70 px-3 py-1 text-xs text-slate-300 backdrop-blur-sm">
        3D fallback active: {reason}
      </div>
    </div>
  );
}

export function ThreeScene(props: ThreeSceneProps) {
  const [webglAvailable, setWebglAvailable] = useState(true);
  const [canvasFailed, setCanvasFailed] = useState(false);

  useEffect(() => {
    const supported = supportsWebGL();
    setWebglAvailable(supported);
    if (!supported) {
      console.error('[ThreeScene] WebGL is unavailable. Rendering fallback background.');
    }
  }, []);

  if (!webglAvailable) {
    return <BackgroundFallback reason="WebGL unavailable" />;
  }

  if (canvasFailed) {
    return <BackgroundFallback reason="Canvas initialization failed" />;
  }

  return (
    <ErrorBoundary
      onError={(error) => {
        console.error('[ThreeScene] Canvas runtime failed. Using fallback background.', error);
        setCanvasFailed(true);
      }}
      fallbackRender={() => <BackgroundFallback reason="Canvas runtime error" />}
    >
      <div className="absolute inset-0 z-0 overflow-hidden rounded-2xl border border-borderline/70 bg-slate-950/35">
        <Canvas
          camera={{ position: [13.5, 13.8, 12.5], fov: 43 }}
          gl={{ antialias: true }}
          onCreated={({ gl }) => {
            try {
              if (!gl || typeof gl.getContextAttributes !== 'function') {
                throw new Error('WebGL renderer context unavailable');
              }
            } catch (error) {
              console.error('[ThreeScene] Canvas creation check failed.', error);
              setCanvasFailed(true);
            }
          }}
        >
          <color attach="background" args={['#060b12']} />
          <SceneRig {...props} />
        </Canvas>
      </div>
    </ErrorBoundary>
  );
}
