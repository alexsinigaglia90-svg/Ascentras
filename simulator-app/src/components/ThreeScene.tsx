import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import {
  BOARD_COLS,
  BOARD_ROWS,
  CELL_SIZE,
  DEPOT_CELL,
  type CircuitTile,
  type GridCell,
  type Metrics
} from '../hooks/useSimulationModel';
import { ErrorBoundary } from './ErrorBoundary';

type ThreeSceneProps = {
  humanTiles: CircuitTile[];
  aiTiles: CircuitTile[];
  metrics: Metrics;
  botPulseKey: number;
  spawnDragTileId: string | null;
  aiActiveTileId: string | null;
  onCommitHumanTile: (tileId: string, cell: GridCell) => void;
  onConsumeSpawnDragTile: () => void;
};

const ORIGIN_X = -((BOARD_COLS - 1) * CELL_SIZE) / 2;
const ORIGIN_Z = -((BOARD_ROWS - 1) * CELL_SIZE) / 2;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function cellToWorld(cell: GridCell, y = 0): [number, number, number] {
  return [ORIGIN_X + cell.col * CELL_SIZE, y, ORIGIN_Z + cell.row * CELL_SIZE];
}

function worldToCell(point: THREE.Vector3): GridCell {
  const col = clamp(Math.round((point.x - ORIGIN_X) / CELL_SIZE), 0, BOARD_COLS - 1);
  const row = clamp(Math.round((point.z - ORIGIN_Z) / CELL_SIZE), 0, BOARD_ROWS - 1);
  return { col, row };
}

function cellKey(cell: GridCell): string {
  return `${cell.col}:${cell.row}`;
}

function makeLabelTexture(label: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext('2d');

  if (!context) {
    return new THREE.CanvasTexture(canvas);
  }

  context.clearRect(0, 0, 128, 128);
  context.fillStyle = 'rgba(4, 8, 14, 0.78)';
  context.beginPath();
  context.roundRect(16, 18, 96, 92, 18);
  context.fill();
  context.strokeStyle = 'rgba(167, 198, 240, 0.75)';
  context.lineWidth = 3;
  context.stroke();

  context.fillStyle = '#e6f1ff';
  context.font = '700 56px Inter, Segoe UI, Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(label, 64, 66);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function kindColor(kind: CircuitTile['kind']): { base: string; emissive: string } {
  if (kind === 'F') return { base: '#67a3ff', emissive: '#4b89f4' };
  if (kind === 'M') return { base: '#7ea8d8', emissive: '#638bc0' };
  return { base: '#99a8bb', emissive: '#68778d' };
}

function GridLines() {
  const geometry = useMemo(() => {
    const points: number[] = [];

    for (let col = 0; col <= BOARD_COLS; col += 1) {
      const x = ORIGIN_X - 0.5 + col * CELL_SIZE;
      const zStart = ORIGIN_Z - 0.5;
      const zEnd = ORIGIN_Z - 0.5 + BOARD_ROWS * CELL_SIZE;
      points.push(x, 0.012, zStart, x, 0.012, zEnd);
    }

    for (let row = 0; row <= BOARD_ROWS; row += 1) {
      const z = ORIGIN_Z - 0.5 + row * CELL_SIZE;
      const xStart = ORIGIN_X - 0.5;
      const xEnd = ORIGIN_X - 0.5 + BOARD_COLS * CELL_SIZE;
      points.push(xStart, 0.012, z, xEnd, 0.012, z);
    }

    const buffer = new THREE.BufferGeometry();
    buffer.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    return buffer;
  }, []);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#95afd7" transparent opacity={0.25} />
    </lineSegments>
  );
}

function TileMesh({
  tile,
  y,
  pulse,
  shakeOffset,
  hovered,
  onPointerDown,
  onPointerOver,
  onPointerOut,
  dragPreviewCell,
  isDragging
}: {
  tile: CircuitTile;
  y: number;
  pulse: number;
  shakeOffset: number;
  hovered: boolean;
  onPointerDown?: (event: ThreeEvent<PointerEvent>) => void;
  onPointerOver?: (event: ThreeEvent<PointerEvent>) => void;
  onPointerOut?: (event: ThreeEvent<PointerEvent>) => void;
  dragPreviewCell?: GridCell | null;
  isDragging: boolean;
}) {
  const [labelTexture] = useState(() => makeLabelTexture(tile.kind));
  const palette = kindColor(tile.kind);
  const groupRef = useRef<THREE.Group | null>(null);
  const smooth = useRef(new THREE.Vector3());

  const targetPosition = useMemo(() => {
    const activeCell = isDragging && dragPreviewCell ? dragPreviewCell : tile.cell;
    const [x, baseY, z] = cellToWorld(activeCell, y);
    return new THREE.Vector3(x + shakeOffset, baseY, z);
  }, [dragPreviewCell, isDragging, shakeOffset, tile.cell, y]);

  useEffect(() => {
    if (!groupRef.current) return;
    if (smooth.current.lengthSq() === 0) {
      smooth.current.copy(targetPosition);
      groupRef.current.position.copy(targetPosition);
    }
  }, [targetPosition]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (isDragging) {
      smooth.current.copy(targetPosition);
      groupRef.current.position.copy(targetPosition);
      return;
    }

    const ease = 1 - Math.exp(-delta * 10.5);
    smooth.current.lerp(targetPosition, ease);
    groupRef.current.position.copy(smooth.current);
  });

  return (
    <group ref={groupRef} onPointerDown={onPointerDown} onPointerOver={onPointerOver} onPointerOut={onPointerOut}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.82, 0.34, 0.82]} />
        <meshStandardMaterial
          color={palette.base}
          emissive={palette.emissive}
          emissiveIntensity={0.2 + pulse + (hovered ? 0.34 : 0)}
          roughness={0.42}
          metalness={0.28}
        />
      </mesh>
      <sprite position={[0, 0.42, 0]} scale={hovered ? [0.48, 0.48, 0.48] : [0.44, 0.44, 0.44]}>
        <spriteMaterial map={labelTexture} transparent depthWrite={false} />
      </sprite>
    </group>
  );
}

function SceneRig({
  humanTiles,
  aiTiles,
  metrics,
  botPulseKey,
  spawnDragTileId,
  aiActiveTileId,
  onCommitHumanTile,
  onConsumeSpawnDragTile
}: ThreeSceneProps) {
  const { camera } = useThree();
  const [draggingTileId, setDraggingTileId] = useState<string | null>(null);
  const [hoveredTileId, setHoveredTileId] = useState<string | null>(null);
  const [hoverCell, setHoverCell] = useState<GridCell | null>(null);
  const [dragPreviewCell, setDragPreviewCell] = useState<GridCell | null>(null);
  const [shakeState, setShakeState] = useState<{ tileId: string; until: number } | null>(null);
  const [effectsEnabled, setEffectsEnabled] = useState(true);
  const aiPulse = useRef(0);
  const dollyProgress = useRef(1);
  const dollyLastOffset = useRef(0);

  useEffect(() => {
    if (spawnDragTileId) {
      const target = humanTiles.find((tile) => tile.id === spawnDragTileId);
      if (target) {
        setDraggingTileId(target.id);
        setDragPreviewCell(target.cell);
      }
      onConsumeSpawnDragTile();
    }
  }, [humanTiles, onConsumeSpawnDragTile, spawnDragTileId]);

  useEffect(() => {
    aiPulse.current = 1;
  }, [botPulseKey]);

  useFrame((_, delta) => {
    if (aiPulse.current > 0) {
      aiPulse.current = Math.max(0, aiPulse.current - delta * 1.85);
    }

    if (dollyProgress.current < 1) {
      dollyProgress.current = Math.min(1, dollyProgress.current + delta * 3.2);
      const wave = Math.sin(dollyProgress.current * Math.PI);
      const currentOffset = wave * 0.22;
      const deltaOffset = currentOffset - dollyLastOffset.current;
      dollyLastOffset.current = currentOffset;

      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      camera.position.addScaledVector(direction, deltaOffset);

      if (dollyProgress.current >= 1) {
        if (Math.abs(dollyLastOffset.current) > 0.0001) {
          camera.position.addScaledVector(direction, -dollyLastOffset.current);
        }
        dollyLastOffset.current = 0;
      }
    }
  });

  const occupancy = useMemo(() => {
    const map = new Set<string>();
    humanTiles.forEach((tile) => {
      if (tile.id !== draggingTileId) {
        map.add(cellKey(tile.cell));
      }
    });
    return map;
  }, [humanTiles, draggingTileId]);

  const onBoardPointerMove = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    const snapped = worldToCell(event.point);
    setHoverCell(snapped);
    if (draggingTileId) {
      setDragPreviewCell(snapped);
    }
  };

  const onBoardPointerOut = () => {
    if (!draggingTileId) {
      setHoverCell(null);
    }
  };

  const commitDrag = () => {
    if (!draggingTileId || !dragPreviewCell) {
      setDraggingTileId(null);
      setDragPreviewCell(null);
      return;
    }

    if (dragPreviewCell.col === DEPOT_CELL.col && dragPreviewCell.row === DEPOT_CELL.row) {
      setShakeState({ tileId: draggingTileId, until: performance.now() + 360 });
      setDraggingTileId(null);
      setDragPreviewCell(null);
      return;
    }

    if (occupancy.has(cellKey(dragPreviewCell))) {
      setShakeState({ tileId: draggingTileId, until: performance.now() + 360 });
      setDraggingTileId(null);
      setDragPreviewCell(null);
      return;
    }

    onCommitHumanTile(draggingTileId, dragPreviewCell);
    dollyProgress.current = 0;
    dollyLastOffset.current = 0;
    setDraggingTileId(null);
    setDragPreviewCell(null);
  };

  const floorWidth = BOARD_COLS * CELL_SIZE + 4;
  const floorDepth = BOARD_ROWS * CELL_SIZE + 4;

  const congestionGlow = THREE.MathUtils.lerp(0.15, 0.52, Math.min(1, metrics.congestionPenalty / 16));
  const focusCell = dragPreviewCell ?? hoverCell;

  return (
    <>
      <fog attach="fog" args={['#060b12', 20, 52]} />
      <ambientLight intensity={0.4} color="#a8c2e4" />
      <hemisphereLight intensity={0.7} color="#dce9ff" groundColor="#101a27" position={[0, 16, 0]} />
      <directionalLight position={[10, 16, 8]} intensity={0.95} color="#dbe8ff" />
      <directionalLight position={[-14, 9, -10]} intensity={0.55} color="#5f89c4" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]} receiveShadow>
        <planeGeometry args={[floorWidth, floorDepth]} />
        <meshStandardMaterial color="#0b121d" roughness={0.94} metalness={0.06} />
      </mesh>

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        onPointerMove={onBoardPointerMove}
        onPointerUp={(event) => {
          event.stopPropagation();
          commitDrag();
        }}
        onPointerOut={onBoardPointerOut}
      >
        <planeGeometry args={[BOARD_COLS * CELL_SIZE, BOARD_ROWS * CELL_SIZE]} />
        <meshBasicMaterial visible={false} transparent opacity={0} depthWrite={false} />
      </mesh>

      <GridLines />

      {focusCell ? (
        <mesh position={cellToWorld(focusCell, 0.006)}>
          <boxGeometry args={[0.98, 0.008, 0.98]} />
          <meshStandardMaterial color="#9bb8e2" emissive="#7fa4da" emissiveIntensity={0.22} transparent opacity={0.18} />
        </mesh>
      ) : null}

      {draggingTileId && dragPreviewCell ? (
        <mesh position={cellToWorld(dragPreviewCell, 0.02)}>
          <boxGeometry args={[0.92, 0.02, 0.92]} />
          <meshStandardMaterial
            color={occupancy.has(cellKey(dragPreviewCell)) ? '#cc6b6b' : '#7da7df'}
            emissive={occupancy.has(cellKey(dragPreviewCell)) ? '#b85b5b' : '#6f9bd8'}
            emissiveIntensity={0.42}
            transparent
            opacity={0.56}
          />
        </mesh>
      ) : null}

      <mesh position={cellToWorld(DEPOT_CELL, 0.22)}>
        <cylinderGeometry args={[0.36, 0.46, 0.44, 24]} />
        <meshStandardMaterial color="#dbecff" emissive="#7fafe8" emissiveIntensity={0.35} roughness={0.32} metalness={0.42} />
      </mesh>

      {humanTiles.map((tile) => {
        const isDragging = draggingTileId === tile.id;
        const shouldShake = shakeState?.tileId === tile.id && performance.now() < shakeState.until;
        const shakeOffset = shouldShake ? Math.sin(performance.now() * 0.09) * 0.07 : 0;

        return (
          <TileMesh
            key={tile.id}
            tile={tile}
            y={0.2}
            pulse={congestionGlow}
            shakeOffset={shakeOffset}
            hovered={hoveredTileId === tile.id}
            isDragging={isDragging}
            dragPreviewCell={dragPreviewCell}
            onPointerDown={(event) => {
              event.stopPropagation();
              setDraggingTileId(tile.id);
              setDragPreviewCell(tile.cell);
            }}
            onPointerOver={(event) => {
              event.stopPropagation();
              setHoveredTileId(tile.id);
              setHoverCell(tile.cell);
            }}
            onPointerOut={() => {
              if (hoveredTileId === tile.id) {
                setHoveredTileId(null);
              }
            }}
          />
        );
      })}

      {aiTiles.map((tile) => {
        const active = tile.id === aiActiveTileId;
        const pulse = active ? 0.65 * aiPulse.current + 0.12 : 0.08;

        return (
          <TileMesh
            key={tile.id}
            tile={tile}
            y={0.34}
            pulse={pulse}
            shakeOffset={0}
            hovered={hoveredTileId === tile.id}
            isDragging={false}
            onPointerOver={(event) => {
              event.stopPropagation();
              setHoveredTileId(tile.id);
              setHoverCell(tile.cell);
            }}
            onPointerOut={() => {
              if (hoveredTileId === tile.id) {
                setHoveredTileId(null);
              }
            }}
          />
        );
      })}

      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={15}
        maxDistance={26}
        minPolarAngle={0.82}
        maxPolarAngle={1.18}
        minAzimuthAngle={-0.5}
        maxAzimuthAngle={0.5}
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
            <Bloom luminanceThreshold={0.18} luminanceSmoothing={0.65} intensity={0.32} />
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
    const webgl2 = canvas.getContext('webgl2');
    const webgl = canvas.getContext('webgl');
    return Boolean(webgl2 || webgl);
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
          camera={{ position: [13.5, 14, 12.5], fov: 43 }}
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
