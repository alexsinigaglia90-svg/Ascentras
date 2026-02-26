import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Canvas, ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
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
  type PalletVisual,
  type Phase,
  type ReachTruckVisual,
  type StationSet
} from '../hooks/useSimulationModel';
import { ErrorBoundary } from './ErrorBoundary';
import { ASCENTRA_THEME, MOVER_THEME, STATION_THEME } from '../theme/ascentraTheme';

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
    humanPallets: PalletVisual[];
    aiPallets: PalletVisual[];
    humanReachTrucks: ReachTruckVisual[];
    aiReachTrucks: ReachTruckVisual[];
    humanTargets: GridCell[];
    aiTargets: GridCell[];
  };
  onCommitHumanTile: (tileId: string, cell: GridCell) => void;
  onRemoveHumanTileById: (tileId: string) => void;
  onConsumeSpawnDragTile: () => void;
};

const ORIGIN_X = -((BOARD_COLS - 1) * CELL_SIZE) / 2;
const ORIGIN_Z = -((BOARD_ROWS - 1) * CELL_SIZE) / 2;
const GRID_MIN_X = ORIGIN_X - CELL_SIZE / 2;
const GRID_MIN_Z = ORIGIN_Z - CELL_SIZE / 2;
const GRID_MAX_X = GRID_MIN_X + BOARD_COLS * CELL_SIZE;
const GRID_MAX_Z = GRID_MIN_Z + BOARD_ROWS * CELL_SIZE;
const AI_COL_MIN = HUMAN_COL_RANGE.max + 1;
const PICK_ZONE_WIDTH = BOARD_COLS * CELL_SIZE;
const PICK_ZONE_DEPTH = BOARD_ROWS * CELL_SIZE;
const FACILITY_WIDTH = PICK_ZONE_WIDTH * 2.5;
const FACILITY_DEPTH = PICK_ZONE_DEPTH * 2.55;
const STAGING_SLOT_HALF_WIDTH = 0.26;
const STAGING_SLOT_HALF_DEPTH = 0.23;

type BoundsRect = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function cellToWorld(cell: GridCell, y = 0): [number, number, number] {
  return [ORIGIN_X + cell.col * CELL_SIZE, y, ORIGIN_Z + cell.row * CELL_SIZE];
}

function worldToCell(point: THREE.Vector3): GridCell {
  const clampedX = clamp(point.x, GRID_MIN_X, GRID_MAX_X - 0.000001);
  const clampedZ = clamp(point.z, GRID_MIN_Z, GRID_MAX_Z - 0.000001);

  return {
    col: clamp(Math.floor((clampedX - GRID_MIN_X) / CELL_SIZE), 0, BOARD_COLS - 1),
    row: clamp(Math.floor((clampedZ - GRID_MIN_Z) / CELL_SIZE), 0, BOARD_ROWS - 1)
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

function cellRect(colStart: number, colEnd: number, rowStart: number, rowEnd: number): BoundsRect {
  const [ax, , az] = cellToWorld({ col: colStart, row: rowStart });
  const [bx, , bz] = cellToWorld({ col: colEnd, row: rowEnd });
  return {
    minX: Math.min(ax, bx) - CELL_SIZE / 2,
    maxX: Math.max(ax, bx) + CELL_SIZE / 2,
    minZ: Math.min(az, bz) - CELL_SIZE / 2,
    maxZ: Math.max(az, bz) + CELL_SIZE / 2
  };
}

function pointInsideBounds(point: THREE.Vector3, bounds: BoundsRect): boolean {
  return point.x >= bounds.minX && point.x <= bounds.maxX && point.z >= bounds.minZ && point.z <= bounds.maxZ;
}

function slotIntersectsBounds(slot: THREE.Vector3, bounds: BoundsRect): boolean {
  const slotMinX = slot.x - STAGING_SLOT_HALF_WIDTH;
  const slotMaxX = slot.x + STAGING_SLOT_HALF_WIDTH;
  const slotMinZ = slot.z - STAGING_SLOT_HALF_DEPTH;
  const slotMaxZ = slot.z + STAGING_SLOT_HALF_DEPTH;

  return slotMinX <= bounds.maxX && slotMaxX >= bounds.minX && slotMinZ <= bounds.maxZ && slotMaxZ >= bounds.minZ;
}

function isValidStagingSlot(slot: THREE.Vector3, stagingZone: BoundsRect, forbiddenBounds: BoundsRect[]): boolean {
  if (!pointInsideBounds(slot, stagingZone)) {
    return false;
  }

  return !forbiddenBounds.some((bounds) => slotIntersectsBounds(slot, bounds));
}

function hashFromId(id: string): number {
  let value = 0;
  for (let index = 0; index < id.length; index += 1) {
    value = (value * 31 + id.charCodeAt(index)) % 100000;
  }
  return value / 100000;
}

function labelTexture(label: string, accent = '#93bfe9', warm = false): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 128;
  const context = canvas.getContext('2d');

  if (!context) {
    return new THREE.CanvasTexture(canvas);
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.shadowColor = warm ? 'rgba(231, 158, 97, 0.35)' : 'rgba(132, 176, 238, 0.3)';
  context.shadowBlur = 16;
  context.shadowOffsetY = 6;
  context.fillStyle = 'rgba(8, 13, 21, 0.84)';
  context.beginPath();
  context.roundRect(10, 16, 300, 94, 46);
  context.fill();

  context.shadowColor = 'transparent';
  context.strokeStyle = warm ? 'rgba(240, 177, 126, 0.76)' : 'rgba(151, 191, 238, 0.76)';
  context.lineWidth = 3;
  context.stroke();

  context.fillStyle = accent;
  context.beginPath();
  context.roundRect(16, 22, 288, 12, 7);
  context.fill();

  context.fillStyle = '#e8f1ff';
  context.font = '700 34px Inter, Segoe UI, Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(label, 160, 72);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function BeveledBlock({
  size,
  radius = 0.08,
  color,
  emissive,
  emissiveIntensity = 0.12,
  roughness = 0.52,
  metalness = 0.18,
  stripColor,
  stripOpacity = 0.85
}: {
  size: [number, number, number];
  radius?: number;
  color: string;
  emissive: string;
  emissiveIntensity?: number;
  roughness?: number;
  metalness?: number;
  stripColor?: string;
  stripOpacity?: number;
}) {
  const [width, height, depth] = size;
  const coreW = Math.max(0.05, width - radius * 2);
  const coreD = Math.max(0.05, depth - radius * 2);
  const cx = width / 2 - radius;
  const cz = depth / 2 - radius;

  return (
    <group>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[coreW, height, depth]} />
        <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={emissiveIntensity} roughness={roughness} metalness={metalness} />
      </mesh>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, height, coreD]} />
        <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={emissiveIntensity} roughness={roughness} metalness={metalness} />
      </mesh>

      {[
        [cx, 0, cz],
        [-cx, 0, cz],
        [cx, 0, -cz],
        [-cx, 0, -cz]
      ].map((pos, index) => (
        <mesh key={index} position={pos as [number, number, number]} castShadow receiveShadow>
          <cylinderGeometry args={[radius, radius, height, 18]} />
          <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={emissiveIntensity} roughness={roughness} metalness={metalness} />
        </mesh>
      ))}

      {stripColor ? (
        <>
          <mesh position={[0, height * 0.28, depth * 0.42]}>
            <boxGeometry args={[coreW * 0.82, Math.max(0.012, height * 0.08), 0.04]} />
            <meshStandardMaterial color={stripColor} emissive={stripColor} emissiveIntensity={0.24} transparent opacity={stripOpacity} roughness={0.3} metalness={0.16} />
          </mesh>
          <mesh position={[0, height * 0.28, -depth * 0.42]}>
            <boxGeometry args={[coreW * 0.82, Math.max(0.012, height * 0.08), 0.04]} />
            <meshStandardMaterial color={stripColor} emissive={stripColor} emissiveIntensity={0.22} transparent opacity={stripOpacity * 0.9} roughness={0.3} metalness={0.16} />
          </mesh>
        </>
      ) : null}
    </group>
  );
}

function GridLines() {
  const geometry = useMemo(() => {
    const points: number[] = [];

    for (let col = 0; col <= BOARD_COLS; col += 1) {
      const x = GRID_MIN_X + col * CELL_SIZE;
      points.push(x, 0.01, GRID_MIN_Z, x, 0.01, GRID_MIN_Z + BOARD_ROWS * CELL_SIZE);
    }

    for (let row = 0; row <= BOARD_ROWS; row += 1) {
      const z = GRID_MIN_Z + row * CELL_SIZE;
      points.push(GRID_MIN_X, 0.01, z, GRID_MIN_X + BOARD_COLS * CELL_SIZE, 0.01, z);
    }

    const buffer = new THREE.BufferGeometry();
    buffer.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    return buffer;
  }, []);

  return (
    <group>
      <lineSegments geometry={geometry} position={[0, 0, 0]}>
        <lineBasicMaterial color="#7ca3d4" transparent opacity={0.041} />
      </lineSegments>
      <lineSegments geometry={geometry} position={[0, 0.002, 0]}>
        <lineBasicMaterial color="#9fc0e3" transparent opacity={0.012} />
      </lineSegments>
    </group>
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
    const t = clock.elapsedTime * 0.74;

    stripeRef.current.children.forEach((child, index) => {
      const stripe = child as THREE.Mesh;
      const offset = ((t + index * 0.22) % 1) * (length - 0.5) - (length - 0.5) / 2;
      stripe.position.set(offset, 0.02, 0);
    });
  });

  return (
    <group position={center} rotation={[0, rotationY, 0]}>
      <BeveledBlock
        size={[length, 0.1, 0.52]}
        radius={0.08}
        color="#4b433a"
        emissive="#6a5b4a"
        emissiveIntensity={0.16}
        stripColor={STATION_THEME.strip}
        stripOpacity={0.52}
      />
      <mesh position={[0, 0.09, 0]}>
        <boxGeometry args={[length * 0.92, 0.02, 0.28]} />
        <meshStandardMaterial color="#5a4d40" emissive="#735f4a" emissiveIntensity={0.16} roughness={0.58} metalness={0.12} />
      </mesh>
      <mesh position={[0, 0.1, 0.23]}>
        <boxGeometry args={[length * 0.9, 0.03, 0.04]} />
        <meshStandardMaterial color="#d3ae7b" emissive="#b98f5a" emissiveIntensity={0.2} roughness={0.32} metalness={0.12} />
      </mesh>
      <mesh position={[0, 0.1, -0.23]}>
        <boxGeometry args={[length * 0.9, 0.03, 0.04]} />
        <meshStandardMaterial color="#d3ae7b" emissive="#b98f5a" emissiveIntensity={0.2} roughness={0.32} metalness={0.12} />
      </mesh>
      <group ref={stripeRef}>
        {new Array(8).fill(0).map((_, index) => (
          <mesh key={index} castShadow>
            <boxGeometry args={[0.22, 0.016, 0.18]} />
            <meshStandardMaterial color="#cda779" emissive="#b48756" emissiveIntensity={0.24} roughness={0.36} metalness={0.12} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function DioramaStation({ cell, title, accent, scale = [0.9, 0.46, 0.9] as [number, number, number] }: {
  cell: GridCell;
  title: string;
  accent: string;
  scale?: [number, number, number];
}) {
  const labelWarm = title === 'Packing';
  const [texture] = useState(() => labelTexture(title, labelWarm ? '#efc08f' : '#d0ae83', true));
  const [x, y, z] = cellToWorld(cell, 0.26);
  const ledRef = useRef<THREE.MeshStandardMaterial | null>(null);

  useFrame(({ clock }) => {
    if (!ledRef.current) return;
    const pulse = 0.28 + (Math.sin(clock.elapsedTime * 2.6 + x * 0.13 + z * 0.1) + 1) * 0.22;
    ledRef.current.emissiveIntensity = pulse;
  });

  return (
    <group position={[x, y, z]}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[scale[0] * 0.56, scale[0] * 0.6, scale[1] * 0.44, 22]} />
        <meshStandardMaterial color="#645042" emissive="#7b604e" emissiveIntensity={0.05} roughness={0.64} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.13, 0]} castShadow receiveShadow>
        <boxGeometry args={[scale[0] * 0.94, scale[1] * 0.52, scale[2] * 0.94]} />
        <meshStandardMaterial color="#8f745c" emissive="#a58466" emissiveIntensity={0.06} roughness={0.58} metalness={0.08} />
      </mesh>
      <mesh position={[0, 0.25, 0]} castShadow>
        <boxGeometry args={[scale[0] * 0.62, scale[1] * 0.62, scale[2] * 0.62]} />
        <meshStandardMaterial color="#c19a6e" emissive="#cda777" emissiveIntensity={0.08} roughness={0.5} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.33, scale[2] * 0.2]} castShadow>
        <boxGeometry args={[scale[0] * 0.4, 0.09, 0.03]} />
        <meshStandardMaterial color="#f0ddc5" emissive="#d4af7f" emissiveIntensity={0.12} roughness={0.32} metalness={0.08} />
      </mesh>
      <mesh position={[0, 0.33, -scale[2] * 0.2]} castShadow>
        <boxGeometry args={[scale[0] * 0.4, 0.09, 0.03]} />
        <meshStandardMaterial color="#f0ddc5" emissive="#d4af7f" emissiveIntensity={0.12} roughness={0.32} metalness={0.08} />
      </mesh>
      <mesh position={[scale[0] * 0.3, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.22, 12]} />
        <meshStandardMaterial color="#4f3f34" emissive="#634e3f" emissiveIntensity={0.08} roughness={0.46} metalness={0.12} />
      </mesh>
      <mesh position={[-scale[0] * 0.3, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.22, 12]} />
        <meshStandardMaterial color="#4f3f34" emissive="#634e3f" emissiveIntensity={0.08} roughness={0.46} metalness={0.12} />
      </mesh>
      <mesh position={[0, 0.42, 0]} castShadow>
        <boxGeometry args={[scale[0] * 0.52, 0.06, scale[2] * 0.52]} />
        <meshStandardMaterial color="#dbc19e" emissive="#e1c39f" emissiveIntensity={0.1} roughness={0.4} metalness={0.08} />
      </mesh>
      <mesh position={[0, 0.43, 0]}>
        <boxGeometry args={[scale[0] * 0.54, 0.01, scale[2] * 0.54]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.22} roughness={0.26} metalness={0.12} transparent opacity={0.66} />
      </mesh>
      <mesh position={[scale[0] * 0.25, 0.45, scale[2] * 0.25]} castShadow>
        <sphereGeometry args={[0.035, 12, 12]} />
        <meshStandardMaterial ref={ledRef} color="#f3e0c3" emissive="#e3ba84" emissiveIntensity={0.2} roughness={0.22} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.24, -scale[2] * 0.3]}>
        <boxGeometry args={[scale[0] * 0.32, 0.07, 0.03]} />
        <meshStandardMaterial color={labelWarm ? '#e5b485' : '#d2b086'} emissive={labelWarm ? '#c88b58' : '#b58f63'} emissiveIntensity={0.14} roughness={0.3} metalness={0.08} />
      </mesh>
      <sprite position={[0, 0.55, 0]} scale={[1.2, 0.48, 1]}>
        <spriteMaterial map={texture} transparent depthWrite={false} />
      </sprite>
    </group>
  );
}

function DockGroup({ docks, loadCounts }: { docks: GridCell[]; loadCounts?: number[] }) {
  const textures = useMemo(() => docks.map((_, index) => labelTexture(`${index + 1}`)), [docks]);

  useEffect(() => {
    return () => {
      textures.forEach((texture) => texture.dispose());
    };
  }, [textures]);

  return (
    <>
      {docks.map((dock, index) => (
        <group key={`dock-${dock.col}-${dock.row}`} position={cellToWorld(dock, 0.21)}>
          <BeveledBlock
            size={[0.96, 0.36, 0.6]}
            radius={0.08}
            color="#1f2e42"
            emissive="#5b82bc"
            emissiveIntensity={0.2}
            stripColor="#9cc0ee"
            stripOpacity={0.78}
          />
          <mesh position={[0, 0.2, -0.23]}>
            <boxGeometry args={[0.62, 0.04, 0.05]} />
            <meshStandardMaterial color="#bcd4f4" emissive="#95bbe8" emissiveIntensity={0.34} roughness={0.2} metalness={0.16} />
          </mesh>
          <mesh position={[0, 0.2, 0.22]} castShadow>
            <planeGeometry args={[0.34, 0.18]} />
            <meshBasicMaterial color="#dce9ff" />
          </mesh>
          {new Array(Math.min(8, loadCounts?.[index] ?? 0)).fill(0).map((_, stackIndex) => (
            <mesh
              key={`dock-load-${index}-${stackIndex}`}
              position={[
                stackIndex % 2 === 0 ? -0.13 : 0.13,
                0.23 + Math.floor(stackIndex / 2) * 0.08,
                stackIndex % 4 < 2 ? -0.08 : 0.08
              ]}
              castShadow
            >
              <boxGeometry args={[0.12, 0.07, 0.1]} />
              <meshStandardMaterial color="#d9e9ff" emissive="#86b4ea" emissiveIntensity={0.16} roughness={0.28} metalness={0.14} />
            </mesh>
          ))}
          <sprite position={[0, 0.36, 0]} scale={[0.5, 0.22, 1]}>
            <spriteMaterial map={textures[index]} transparent depthWrite={false} />
          </sprite>
        </group>
      ))}
    </>
  );
}

function StorageRackUnit({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <BeveledBlock
        size={[0.98, 0.7, 0.4]}
        radius={0.06}
        color="#5a4a3e"
        emissive="#6c5a48"
        emissiveIntensity={0.08}
      />
      <mesh position={[0, 0.22, 0]} castShadow>
        <boxGeometry args={[0.92, 0.03, 0.4]} />
        <meshStandardMaterial color="#b69266" emissive="#c39a66" emissiveIntensity={0.1} roughness={0.3} metalness={0.14} />
      </mesh>
      <mesh position={[0, -0.02, 0]} castShadow>
        <boxGeometry args={[0.92, 0.03, 0.4]} />
        <meshStandardMaterial color="#8f7960" emissive="#9a7f63" emissiveIntensity={0.08} roughness={0.32} metalness={0.14} />
      </mesh>
      <mesh position={[0, 0.08, 0.16]}>
        <boxGeometry args={[0.34, 0.12, 0.08]} />
        <meshStandardMaterial color="#eddfce" emissive="#c79e6f" emissiveIntensity={0.1} roughness={0.4} metalness={0.08} />
      </mesh>
    </group>
  );
}

function StorageRackField() {
  const leftRightColumns = [-15.8, -13.4, -11.1, 11.1, 13.4, 15.8];
  const sideRows = [-9.4, -6.5, -3.6, -0.7, 2.2, 5.1, 8];
  const backRows = [-11.6, -9.2, -6.8];
  const backColumns = [-8.8, -6.2, -3.6, -1, 1.6, 4.2, 6.8];

  return (
    <group>
      {[-14.6, -12.2, 12.2, 14.6].map((x, index) => (
        <mesh key={`rack-lane-${index}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.054, -1.2]}>
          <planeGeometry args={[1.2, 16.8]} />
          <meshBasicMaterial color="#86addd" transparent opacity={0.055} depthWrite={false} />
        </mesh>
      ))}
      {leftRightColumns.map((x) =>
        sideRows.map((z) => (
          <StorageRackUnit key={`side-rack-${x}-${z}`} position={[x, 0.29, z]} />
        ))
      )}
      {backRows.map((z) =>
        backColumns.map((x) => (
          <StorageRackUnit key={`back-rack-${x}-${z}`} position={[x, 0.29, z]} />
        ))
      )}
    </group>
  );
}

function StoragePallets() {
  const points: Array<[number, number, number]> = [
    [-16.2, 0.08, -7.9], [-14.6, 0.08, -1.8], [-12.3, 0.08, 4.8], [-11.8, 0.08, 9],
    [16.2, 0.08, -7.8], [14.7, 0.08, -1.8], [12.4, 0.08, 4.7], [11.6, 0.08, 9],
    [-8.7, 0.08, -12], [-4.7, 0.08, -11.8], [-0.4, 0.08, -11.5], [3.9, 0.08, -11.7], [8, 0.08, -11.6]
  ];

  return (
    <group>
      {points.map((position, index) => (
        <group key={`storage-pallet-${index}`} position={position}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.56, 0.06, 0.56]} />
            <meshStandardMaterial color="#7a6044" emissive="#8f6f50" emissiveIntensity={0.06} roughness={0.62} metalness={0.03} />
          </mesh>
          <mesh position={[0, 0.09, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.36, 0.1, 0.36]} />
            <meshStandardMaterial color="#e8d9c7" emissive="#b68f62" emissiveIntensity={0.08} roughness={0.5} metalness={0.06} />
          </mesh>
          <mesh position={[0.11, 0.16, -0.11]} castShadow receiveShadow>
            <boxGeometry args={[0.1, 0.06, 0.1]} />
            <meshStandardMaterial color="#f0e4d5" emissive="#c29a6d" emissiveIntensity={0.07} roughness={0.52} metalness={0.05} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Forklift({ cell, heading }: { cell: GridCell; heading: number }) {
  return (
    <group position={cellToWorld(cell, 0.13)} rotation={[0, heading, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.64, 0.16, 0.42]} />
        <meshStandardMaterial color="#f2b24a" emissive="#cf9342" emissiveIntensity={0.18} roughness={0.36} metalness={0.2} />
      </mesh>
      <mesh position={[0.12, 0.18, 0]} castShadow>
        <boxGeometry args={[0.24, 0.22, 0.34]} />
        <meshStandardMaterial color="#314a67" emissive="#4d6d96" emissiveIntensity={0.14} roughness={0.3} metalness={0.24} />
      </mesh>
      <mesh position={[-0.26, 0.22, -0.11]} castShadow>
        <boxGeometry args={[0.05, 0.38, 0.05]} />
        <meshStandardMaterial color="#8cadde" emissive="#6f95ce" emissiveIntensity={0.16} roughness={0.26} metalness={0.22} />
      </mesh>
      <mesh position={[-0.26, 0.22, 0.11]} castShadow>
        <boxGeometry args={[0.05, 0.38, 0.05]} />
        <meshStandardMaterial color="#8cadde" emissive="#6f95ce" emissiveIntensity={0.16} roughness={0.26} metalness={0.22} />
      </mesh>
      <mesh position={[-0.34, 0.08, -0.09]} castShadow>
        <boxGeometry args={[0.24, 0.03, 0.05]} />
        <meshStandardMaterial color="#9fc0ed" emissive="#8db3e6" emissiveIntensity={0.16} roughness={0.26} metalness={0.24} />
      </mesh>
      <mesh position={[-0.34, 0.08, 0.09]} castShadow>
        <boxGeometry args={[0.24, 0.03, 0.05]} />
        <meshStandardMaterial color="#9fc0ed" emissive="#8db3e6" emissiveIntensity={0.16} roughness={0.26} metalness={0.24} />
      </mesh>
      {[
        [0.2, -0.08, -0.18],
        [0.2, -0.08, 0.18],
        [-0.2, -0.08, -0.18],
        [-0.2, -0.08, 0.18]
      ].map((pos, index) => (
        <mesh key={index} position={pos as [number, number, number]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 0.06, 16]} />
          <meshStandardMaterial color="#1f2b3d" emissive="#2b3b53" emissiveIntensity={0.06} roughness={0.72} metalness={0.08} />
        </mesh>
      ))}
    </group>
  );
}

type LogisticsSide = 'human' | 'ai';

type LogisticsForkliftRuntime = {
  id: string;
  side: LogisticsSide;
  from: THREE.Vector3;
  to: THREE.Vector3;
  progress: number;
  state: 'idle' | 'to-corridor' | 'to-stage' | 'to-return-corridor' | 'to-pack-return';
  carrying: boolean;
  targetSlot: THREE.Vector3 | null;
  trailPhase: number;
};

function FinishedPalletUnit({
  position,
  rotationY = 0,
  wrappedColor = '#dcecff',
  strapColor = '#7da8de'
}: {
  position: [number, number, number];
  rotationY?: number;
  wrappedColor?: string;
  strapColor?: string;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh castShadow>
        <boxGeometry args={[0.52, 0.06, 0.46]} />
        <meshStandardMaterial color="#7f6044" emissive="#8d6c4c" emissiveIntensity={0.05} roughness={0.68} metalness={0.04} />
      </mesh>
      <mesh position={[0, 0.08, 0]} castShadow>
        <boxGeometry args={[0.46, 0.12, 0.4]} />
        <meshStandardMaterial color={wrappedColor} emissive="#96b9e6" emissiveIntensity={0.12} roughness={0.34} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.082, 0]}>
        <boxGeometry args={[0.42, 0.125, 0.032]} />
        <meshStandardMaterial color={strapColor} emissive={strapColor} emissiveIntensity={0.16} roughness={0.24} metalness={0.12} />
      </mesh>
    </group>
  );
}

function StagedPalletInstancedField({
  slots,
  count,
  wrappedColor,
  strapColor
}: {
  slots: THREE.Vector3[];
  count: number;
  wrappedColor: string;
  strapColor: string;
}) {
  const baseRef = useRef<THREE.InstancedMesh | null>(null);
  const wrapRef = useRef<THREE.InstancedMesh | null>(null);
  const strapRef = useRef<THREE.InstancedMesh | null>(null);

  useLayoutEffect(() => {
    const maxCount = Math.min(count, slots.length);
    const transform = new THREE.Object3D();

    for (let index = 0; index < maxCount; index += 1) {
      const slot = slots[index];
      const yaw = ((index % 5) - 2) * 0.015;

      transform.position.set(slot.x, slot.y, slot.z);
      transform.rotation.set(0, yaw, 0);
      transform.updateMatrix();
      baseRef.current?.setMatrixAt(index, transform.matrix);

      transform.position.set(slot.x, slot.y + 0.08, slot.z);
      transform.updateMatrix();
      wrapRef.current?.setMatrixAt(index, transform.matrix);

      transform.position.set(slot.x, slot.y + 0.082, slot.z);
      transform.updateMatrix();
      strapRef.current?.setMatrixAt(index, transform.matrix);
    }

    if (baseRef.current) baseRef.current.instanceMatrix.needsUpdate = true;
    if (wrapRef.current) wrapRef.current.instanceMatrix.needsUpdate = true;
    if (strapRef.current) strapRef.current.instanceMatrix.needsUpdate = true;
  }, [count, slots]);

  const visibleCount = Math.min(count, slots.length);
  if (visibleCount <= 0) return null;

  return (
    <>
      <instancedMesh ref={baseRef} args={[undefined, undefined, visibleCount]} castShadow>
        <boxGeometry args={[0.52, 0.06, 0.46]} />
        <meshStandardMaterial color="#7f6044" emissive="#8d6c4c" emissiveIntensity={0.05} roughness={0.68} metalness={0.04} />
      </instancedMesh>
      <instancedMesh ref={wrapRef} args={[undefined, undefined, visibleCount]} castShadow>
        <boxGeometry args={[0.46, 0.12, 0.4]} />
        <meshStandardMaterial color={wrappedColor} emissive="#96b9e6" emissiveIntensity={0.12} roughness={0.34} metalness={0.1} />
      </instancedMesh>
      <instancedMesh ref={strapRef} args={[undefined, undefined, visibleCount]}>
        <boxGeometry args={[0.42, 0.125, 0.032]} />
        <meshStandardMaterial color={strapColor} emissive={strapColor} emissiveIntensity={0.16} roughness={0.24} metalness={0.12} />
      </instancedMesh>
    </>
  );
}

function StagingLaneMarkings({
  laneSlots,
  overflowSlots,
  zoneBounds,
  laneColor,
  slotColor,
  overflowColor
}: {
  laneSlots: THREE.Vector3[][];
  overflowSlots: THREE.Vector3[];
  zoneBounds: BoundsRect;
  laneColor: string;
  slotColor: string;
  overflowColor: string;
}) {
  const laneRects = useMemo(
    () =>
      laneSlots
        .map((lane) => {
          if (lane.length <= 0) return null;
          const first = lane[0];
          const last = lane[lane.length - 1];
          const centerZ = (first.z + last.z) / 2;
          const laneDepth = Math.abs(first.z - last.z) + 0.52;
          return {
            x: first.x,
            z: centerZ,
            depth: laneDepth
          };
        })
        .filter((lane): lane is { x: number; z: number; depth: number } => lane !== null),
    [laneSlots]
  );

  const overflowRect = useMemo(() => {
    if (overflowSlots.length <= 0) return null;
    const xs = overflowSlots.map((slot) => slot.x);
    const zs = overflowSlots.map((slot) => slot.z);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minZ = Math.min(...zs);
    const maxZ = Math.max(...zs);
    return {
      x: (minX + maxX) / 2,
      z: (minZ + maxZ) / 2,
      width: maxX - minX + 0.64,
      depth: maxZ - minZ + 0.58
    };
  }, [overflowSlots]);

  return (
    <>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[(zoneBounds.minX + zoneBounds.maxX) / 2, 0.0565, (zoneBounds.minZ + zoneBounds.maxZ) / 2]}
      >
        <planeGeometry args={[zoneBounds.maxX - zoneBounds.minX, zoneBounds.maxZ - zoneBounds.minZ]} />
        <meshBasicMaterial color={laneColor} transparent opacity={0.06} depthWrite={false} />
      </mesh>

      {laneRects.map((lane, index) => (
        <mesh key={`staging-lane-strip-${index}`} rotation={[-Math.PI / 2, 0, 0]} position={[lane.x, 0.057, lane.z]}>
          <planeGeometry args={[0.58, lane.depth]} />
          <meshBasicMaterial color={laneColor} transparent opacity={0.14} depthWrite={false} />
        </mesh>
      ))}

      {laneSlots.map((lane, laneIndex) =>
        lane.map((slot, slotIndex) => (
          <mesh key={`staging-slot-${laneIndex}-${slotIndex}`} rotation={[-Math.PI / 2, 0, 0]} position={[slot.x, 0.058, slot.z]}>
            <planeGeometry args={[0.5, 0.42]} />
            <meshBasicMaterial color={slotColor} transparent opacity={0.26} depthWrite={false} />
          </mesh>
        ))
      )}

      {overflowRect ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[overflowRect.x, 0.057, overflowRect.z]}>
          <planeGeometry args={[overflowRect.width, overflowRect.depth]} />
          <meshBasicMaterial color={overflowColor} transparent opacity={0.11} depthWrite={false} />
        </mesh>
      ) : null}

      {overflowSlots.map((slot, index) => (
        <mesh key={`staging-overflow-slot-${index}`} rotation={[-Math.PI / 2, 0, 0]} position={[slot.x, 0.058, slot.z]}>
          <planeGeometry args={[0.5, 0.42]} />
          <meshBasicMaterial color={overflowColor} transparent opacity={0.24} depthWrite={false} />
        </mesh>
      ))}
    </>
  );
}

function LogisticsForklift({
  runtime,
  color,
  glow
}: {
  runtime: LogisticsForkliftRuntime;
  color: string;
  glow: string;
}) {
  const ref = useRef<THREE.Group | null>(null);
  const beaconRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const glowRef = useRef<THREE.PointLight | null>(null);
  const headingRef = useRef(0);
  const trailRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const tempPosition = useRef(new THREE.Vector3());

  useFrame(({ clock }) => {
    if (!ref.current) return;

    tempPosition.current.lerpVectors(runtime.from, runtime.to, clamp(runtime.progress, 0, 1));
    const bob = 0.006 * Math.sin(clock.elapsedTime * 4.8 + runtime.trailPhase);
    ref.current.position.set(tempPosition.current.x, tempPosition.current.y + bob, tempPosition.current.z);

    const direction = runtime.to.clone().sub(runtime.from);
    if (direction.lengthSq() > 0.0001) {
      const targetHeading = Math.atan2(direction.x, direction.z);
      let deltaHeading = targetHeading - headingRef.current;
      while (deltaHeading > Math.PI) deltaHeading -= Math.PI * 2;
      while (deltaHeading < -Math.PI) deltaHeading += Math.PI * 2;
      headingRef.current += deltaHeading * 0.16;
      ref.current.rotation.y = headingRef.current;
    }

    const pulse = 0.5 + 0.5 * Math.sin(clock.elapsedTime * 5.6 + runtime.trailPhase * 2);
    if (beaconRef.current) {
      beaconRef.current.emissiveIntensity = 0.24 + pulse * 0.42;
    }
    if (glowRef.current) {
      glowRef.current.intensity = 0.22 + pulse * 0.3;
      glowRef.current.distance = 1.25 + pulse * 0.4;
    }
    if (trailRef.current) {
      trailRef.current.opacity = runtime.carrying ? 0.08 + pulse * 0.06 : 0;
    }
  });

  return (
    <group ref={ref}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.48, 0.13, 0.31]} />
        <meshStandardMaterial color={color} emissive={glow} emissiveIntensity={0.12} roughness={0.36} metalness={0.18} />
      </mesh>
      <mesh position={[0.09, 0.14, 0]} castShadow>
        <boxGeometry args={[0.18, 0.18, 0.22]} />
        <meshStandardMaterial color="#314b6b" emissive="#4f719f" emissiveIntensity={0.12} roughness={0.34} metalness={0.22} />
      </mesh>
      <mesh position={[-0.24, 0.08, 0]} castShadow>
        <boxGeometry args={[0.16, 0.03, 0.2]} />
        <meshStandardMaterial color="#8fb7ea" emissive="#7ca4da" emissiveIntensity={0.16} roughness={0.28} metalness={0.16} />
      </mesh>
      {runtime.carrying ? (
        <group position={[-0.26, 0.12, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.16, 0.04, 0.14]} />
            <meshStandardMaterial color="#7f6044" roughness={0.68} metalness={0.04} />
          </mesh>
          <mesh position={[0, 0.05, 0]} castShadow>
            <boxGeometry args={[0.14, 0.08, 0.12]} />
            <meshStandardMaterial color="#dcecff" emissive="#96b9e6" emissiveIntensity={0.14} roughness={0.34} metalness={0.1} />
          </mesh>
        </group>
      ) : null}
      <mesh position={[0.22, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.028, 0.028, 0.03, 14]} />
        <meshStandardMaterial ref={beaconRef} color="#9fc4f2" emissive="#86b4ea" emissiveIntensity={0.28} roughness={0.2} metalness={0.16} />
      </mesh>
      <pointLight ref={glowRef} position={[0.22, 0.2, 0]} color="#9ec3f0" intensity={0.3} distance={1.5} decay={1.9} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.08, 0.01, 0]}>
        <planeGeometry args={[0.52, 0.22]} />
        <meshBasicMaterial ref={trailRef} color="#9ec3ef" transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

function DioramaPallet({
  tile,
  pallet,
  y,
  hover,
  active,
  previewCell,
  isDragging,
  placementPulseAt,
  onPointerDown,
  onPointerOver,
  onPointerOut
}: {
  tile: CircuitTile;
  pallet?: PalletVisual;
  y: number;
  hover: boolean;
  active: boolean;
  previewCell?: GridCell | null;
  isDragging: boolean;
  placementPulseAt?: number;
  onPointerDown?: (event: ThreeEvent<PointerEvent>) => void;
  onPointerOver?: (event: ThreeEvent<PointerEvent>) => void;
  onPointerOut?: (event: ThreeEvent<PointerEvent>) => void;
}) {
  const moverTone = MOVER_THEME[tile.kind];
  const [tex] = useState(() => labelTexture(moverTone.label, moverTone.tileStrip));
  const groupRef = useRef<THREE.Group | null>(null);
  const smooth = useRef(new THREE.Vector3());
  const fillRatio = clamp((pallet?.fillLevel ?? 100) / 100, 0, 1);
  const stackHeight = 0.05 + fillRatio * 0.24;
  const isEmpty = pallet?.isEmpty ?? false;
  const isReplenishing = pallet?.replenishing ?? false;
  const requested = pallet?.replenishmentRequested ?? false;
  const seed = useMemo(() => hashFromId(tile.id), [tile.id]);

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
    const pulseTime = placementPulseAt ? (performance.now() - placementPulseAt) / 1000 : 999;
    const snapPulse = pulseTime < 0.22 ? Math.sin((pulseTime / 0.22) * Math.PI) * 0.16 : 0;

    if (isDragging) {
      smooth.current.copy(target);
      groupRef.current.position.copy(target);
      groupRef.current.scale.setScalar(1.02);
      return;
    }

    const ease = 1 - Math.exp(-delta * 10);
    smooth.current.lerp(target, ease);
    const bobAmplitude = active ? 0.022 : hover ? 0.016 : 0.008;
    const bob = bobAmplitude * Math.sin(performance.now() * 0.003 + tile.cell.col * 0.5 + tile.cell.row * 0.34);
    groupRef.current.position.set(smooth.current.x, smooth.current.y + bob + snapPulse * 0.08, smooth.current.z);
    groupRef.current.rotation.y = (active ? 0.03 : hover ? 0.018 : 0) * Math.sin(performance.now() * 0.0018 + tile.cell.col * 0.2);
    groupRef.current.scale.setScalar(1 + snapPulse * 0.06 + (hover ? 0.01 : 0));
  });

  return (
    <group ref={groupRef} onPointerDown={onPointerDown} onPointerOver={onPointerOver} onPointerOut={onPointerOut}>
      <group>
        {[[-0.26, -0.2], [0, -0.2], [0.26, -0.2], [-0.26, 0], [0, 0], [0.26, 0], [-0.26, 0.2], [0, 0.2], [0.26, 0.2]].map((slot, index) => (
          <mesh key={`pallet-slat-${index}`} position={[slot[0], 0.03, slot[1]]} castShadow>
            <boxGeometry args={[0.2, 0.024, 0.11]} />
            <meshStandardMaterial color="#806145" emissive="#8f6d4e" emissiveIntensity={0.04} roughness={0.72} metalness={0.03} />
          </mesh>
        ))}
        <mesh position={[0, 0.056, 0]} castShadow>
          <boxGeometry args={[0.82, 0.018, 0.78]} />
          <meshStandardMaterial color={moverTone.tileColor} emissive={moverTone.tileEmissive} emissiveIntensity={0.08 + (active ? 0.05 : 0)} roughness={0.56} metalness={0.08} />
        </mesh>
        <mesh position={[0, 0.068, 0.33]}>
          <boxGeometry args={[0.54, 0.01, 0.03]} />
          <meshStandardMaterial color={moverTone.tileStrip} emissive={moverTone.tileStrip} emissiveIntensity={0.12} roughness={0.26} metalness={0.08} transparent opacity={0.8} />
        </mesh>
        <mesh position={[0, 0.068, -0.33]}>
          <boxGeometry args={[0.54, 0.01, 0.03]} />
          <meshStandardMaterial color={moverTone.tileStrip} emissive={moverTone.tileStrip} emissiveIntensity={0.12} roughness={0.26} metalness={0.08} transparent opacity={0.8} />
        </mesh>
        <mesh position={[0, 0.09 + stackHeight / 2, 0]} castShadow>
          <boxGeometry args={[0.6, stackHeight, 0.58]} />
          <meshStandardMaterial
            color={isEmpty ? '#565962' : '#e7d7c2'}
            emissive={isReplenishing ? '#cc9e68' : requested ? '#bd7f60' : '#8d6a4b'}
            emissiveIntensity={(active ? 0.08 : 0.03) + (isReplenishing ? 0.08 : requested ? 0.06 : 0.03)}
            roughness={0.6}
            metalness={0.04}
          />
        </mesh>
        {new Array(Math.max(2, Math.ceil(fillRatio * 8))).fill(0).map((_, index) => {
          const layer = Math.floor(index / 4);
          const slot = index % 4;
          const jitterX = (seed * 0.06 + (index % 2) * 0.012) - 0.03;
          const jitterZ = (((seed * 17 + index) % 11) / 11 - 0.5) * 0.03;
          const xBase = slot % 2 === 0 ? -0.14 : 0.14;
          const zBase = slot < 2 ? -0.12 : 0.12;
          return (
            <mesh
              key={`tile-box-${tile.id}-${index}`}
              position={[xBase + jitterX, 0.1 + layer * 0.068, zBase + jitterZ]}
              rotation={[0, (seed * 0.28 + index * 0.05) - 0.1, 0]}
              castShadow
            >
              <boxGeometry args={[0.125, 0.068, 0.102]} />
              <meshStandardMaterial color="#efe1cf" emissive="#9e7753" emissiveIntensity={0.04} roughness={0.56} metalness={0.04} />
            </mesh>
          );
        })}
        {requested ? (
          <mesh position={[0.31, 0.13, 0.31]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 0.03, 14]} />
            <meshStandardMaterial color={isReplenishing ? '#d3ad7c' : '#c78667'} emissive={isReplenishing ? '#be9462' : '#a86a50'} emissiveIntensity={0.42} roughness={0.24} metalness={0.12} />
          </mesh>
        ) : null}
        <mesh position={[-0.31, 0.13, -0.31]}>
          <boxGeometry args={[0.18, 0.022, 0.1]} />
          <meshStandardMaterial color="#2f251d" emissive="#7a5d41" emissiveIntensity={0.22} roughness={0.3} metalness={0.12} />
        </mesh>
      </group>
      <sprite position={[0, 0.38, 0]} scale={hover ? [0.62, 0.24, 0.62] : [0.56, 0.22, 0.56]}>
        <spriteMaterial map={tex} transparent depthWrite={false} />
      </sprite>
    </group>
  );
}

function manhattan(a: GridCell, b: GridCell) {
  return Math.abs(a.col - b.col) + Math.abs(a.row - b.row);
}

function ActiveTarget({ target, index }: { target: GridCell; index: number }) {
  const groupRef = useRef<THREE.Group | null>(null);
  const ringRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const auraRef = useRef<THREE.MeshBasicMaterial | null>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const pulse = 0.5 + 0.5 * Math.sin(clock.elapsedTime * 3.2 + index * 0.37);
    const scale = 0.92 + pulse * 0.2;
    groupRef.current.scale.setScalar(scale);
    groupRef.current.position.y = 0.06 + pulse * 0.016;

    if (ringRef.current) {
      ringRef.current.emissiveIntensity = 0.34 + pulse * 0.42;
      ringRef.current.opacity = 0.38 + pulse * 0.26;
    }

    if (auraRef.current) {
      auraRef.current.opacity = 0.09 + pulse * 0.09;
    }
  });

  return (
    <group ref={groupRef} position={cellToWorld(target, 0.06)}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.2, 0.38, 20]} />
        <meshBasicMaterial ref={auraRef} color="#9bc2f6" transparent opacity={0.14} depthWrite={false} />
      </mesh>
      <mesh castShadow>
        <torusGeometry args={[0.22, 0.028, 10, 20]} />
        <meshStandardMaterial ref={ringRef} color="#b7cdf2" emissive="#95b7e6" emissiveIntensity={0.36} transparent opacity={0.58} roughness={0.22} metalness={0.28} />
      </mesh>
    </group>
  );
}

function OutboundBuffer({ cell, count, accent }: { cell: GridCell; count: number; accent: string }) {
  const [x, y, z] = cellToWorld(cell, 0.12);
  const direction = cell.col < BOARD_COLS / 2 ? -1 : 1;
  const stacks = Math.max(1, Math.min(4, Math.ceil(count / 6)));

  return (
    <group position={[x + direction * 1.04, y, z]}>
      {new Array(stacks).fill(0).map((_, stackIndex) => {
        const units = clamp(count - stackIndex * 6, 0, 6);
        const fill = units / 6;
        const stackZ = (stackIndex - (stacks - 1) / 2) * 0.64;

        return (
          <group key={`outbound-stack-${stackIndex}`} position={[0, 0, stackZ]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[0.58, 0.08, 0.54]} />
              <meshStandardMaterial color="#6d5a45" emissive="#846a4f" emissiveIntensity={0.08} roughness={0.6} metalness={0.08} />
            </mesh>
            <mesh position={[0, 0.05 + fill * 0.18, 0]} castShadow>
              <boxGeometry args={[0.48, 0.08 + fill * 0.36, 0.44]} />
              <meshStandardMaterial color="#d3e5ff" emissive="#84afe6" emissiveIntensity={0.16 + fill * 0.2} roughness={0.34} metalness={0.16} />
            </mesh>
            {new Array(units).fill(0).map((__, unitIndex) => (
              <mesh
                key={`outbound-unit-${stackIndex}-${unitIndex}`}
                position={[
                  unitIndex % 2 === 0 ? -0.11 : 0.11,
                  0.13,
                  (Math.floor(unitIndex / 2) - 1) * 0.11
                ]}
                castShadow
              >
                <boxGeometry args={[0.12, 0.08, 0.09]} />
                <meshStandardMaterial color="#e1efff" emissive="#8ab5ea" emissiveIntensity={0.14} roughness={0.3} metalness={0.12} />
              </mesh>
            ))}
          </group>
        );
      })}

      <mesh position={[direction * 0.36, 0.42, 0]}>
        <boxGeometry args={[0.06, 0.26, 0.06]} />
        <meshStandardMaterial color="#d5e8ff" emissive={accent} emissiveIntensity={0.24} roughness={0.26} metalness={0.2} />
      </mesh>
      <mesh position={[direction * 0.36, 0.58, 0]}>
        <boxGeometry args={[0.22, 0.06, 0.06]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.34} roughness={0.2} metalness={0.18} />
      </mesh>
    </group>
  );
}

function WorkerAgent({ agent, stations }: { agent: AgentVisual; stations: StationSet }) {
  const ref = useRef<THREE.Group | null>(null);
  const smooth = useRef(new THREE.Vector3());
  const beaconRef = useRef<THREE.MeshStandardMaterial | null>(null);

  const target = useMemo(() => {
    const [x, y, z] = cellToWorld(agent.cell, 0.18);
    return new THREE.Vector3(x, y, z);
  }, [agent.cell]);

  const hasCarry = useMemo(() => {
    if (agent.role === 'picker') {
      return manhattan(agent.cell, stations.packingTable) <= 2 || manhattan(agent.cell, stations.machine) <= 2;
    }
    return manhattan(agent.cell, stations.outbound) <= 2 || stations.docks.some((dock) => manhattan(agent.cell, dock) <= 2);
  }, [agent, stations]);

  useEffect(() => {
    if (!ref.current) return;
    if (smooth.current.lengthSq() === 0) {
      smooth.current.copy(target);
      ref.current.position.copy(target);
    }
  }, [target]);

  useFrame(({ clock }, delta) => {
    if (!ref.current) return;
    const ease = 1 - Math.exp(-delta * 10.5);
    smooth.current.lerp(target, ease);
    const bob = 0.01 * Math.sin(clock.elapsedTime * 4.6 + agent.cell.col * 0.31 + agent.cell.row * 0.22);
    ref.current.position.set(smooth.current.x, smooth.current.y + bob, smooth.current.z);

    const look = new THREE.Vector3(target.x - smooth.current.x, 0, target.z - smooth.current.z);
    if (look.lengthSq() > 0.0004) {
      ref.current.rotation.y = Math.atan2(look.x, look.z);
    }

    if (beaconRef.current) {
      const pulse = 0.5 + 0.5 * Math.sin(clock.elapsedTime * 3.2 + agent.cell.col * 0.22);
      beaconRef.current.emissiveIntensity = 0.22 + pulse * 0.22;
    }
  });

  return (
    <group ref={ref}>
      <mesh position={[0, 0.12, 0]} castShadow>
        <capsuleGeometry args={[0.08, 0.2, 6, 10]} />
        <meshStandardMaterial
          color={agent.role === 'picker' ? '#8ec1ff' : '#a9c9f2'}
          emissive={agent.role === 'picker' ? '#6b9ce0' : '#7fa6d7'}
          emissiveIntensity={0.2}
          roughness={0.36}
          metalness={0.14}
        />
      </mesh>
      <mesh position={[0, 0.3, 0]} castShadow>
        <sphereGeometry args={[0.065, 14, 14]} />
        <meshStandardMaterial color="#f2dfc5" roughness={0.58} metalness={0.04} />
      </mesh>
      <mesh position={[0, 0.22, -0.1]} castShadow>
        <boxGeometry args={[0.14, 0.1, 0.04]} />
        <meshStandardMaterial color="#20324a" emissive="#3d5f88" emissiveIntensity={0.12} roughness={0.34} metalness={0.18} />
      </mesh>
      {hasCarry ? (
        <mesh position={[0.12, 0.16, 0]} castShadow>
          <boxGeometry args={[0.11, 0.08, 0.1]} />
          <meshStandardMaterial color="#dcecff" emissive="#8fb9ed" emissiveIntensity={0.18} roughness={0.32} metalness={0.12} />
        </mesh>
      ) : null}
      <mesh position={[0, 0.4, 0]}>
        <sphereGeometry args={[0.04, 12, 12]} />
        <meshStandardMaterial ref={beaconRef} color="#9fc3f0" emissive="#88b3e8" emissiveIntensity={0.24} roughness={0.22} metalness={0.16} />
      </mesh>
    </group>
  );
}

function MovingBox({ box, stations }: { box: BoxVisual; stations: StationSet }) {
  const nearMachine = manhattan(box.cell, stations.machine) <= 1;
  const nearOutbound = manhattan(box.cell, stations.outbound) <= 1;
  const atDock = stations.docks.some((dock) => manhattan(box.cell, dock) <= 0);
  const nearPacking = manhattan(box.cell, stations.packingTable) <= 1;

  const palette = nearPacking
    ? { color: '#adc9ec', emissive: '#7ea8df', intensity: 0.16 }
    : nearMachine
      ? { color: '#c0d8f6', emissive: '#8cb2e6', intensity: 0.22 }
      : nearOutbound || atDock
        ? { color: '#deedff', emissive: '#99c0ef', intensity: 0.28 }
        : { color: '#c8ddfb', emissive: '#8fb3e6', intensity: 0.18 };

  return (
    <group position={cellToWorld(box.cell, 0.16)}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.22, 0.16, 0.2]} />
        <meshStandardMaterial color={palette.color} emissive={palette.emissive} emissiveIntensity={palette.intensity} roughness={0.32} metalness={0.14} />
      </mesh>
      <mesh position={[0, 0.09, 0]}>
        <boxGeometry args={[0.2, 0.02, 0.18]} />
        <meshStandardMaterial color="#f2f7ff" emissive="#c1daf8" emissiveIntensity={0.1} roughness={0.26} metalness={0.08} />
      </mesh>
    </group>
  );
}

function ReachTruck({ truck }: { truck: ReachTruckVisual }) {
  const ref = useRef<THREE.Group | null>(null);
  const smooth = useRef(new THREE.Vector3());
  const cabinRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const beaconRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const glowRef = useRef<THREE.PointLight | null>(null);
  const headingRef = useRef(0);

  const target = useMemo(() => {
    const [x, y, z] = cellToWorld(truck.cell, 0.14);
    return new THREE.Vector3(x, y, z);
  }, [truck.cell]);

  const facingTarget = useMemo(() => {
    const [x, , z] = cellToWorld(truck.target, 0.14);
    return new THREE.Vector3(x, 0, z);
  }, [truck.target]);

  useEffect(() => {
    if (!ref.current) return;
    if (smooth.current.lengthSq() === 0) {
      smooth.current.copy(target);
      ref.current.position.copy(target);
    }
  }, [target]);

  useFrame(({ clock }, delta) => {
    if (!ref.current) return;
    const ease = 1 - Math.exp(-delta * 11);
    smooth.current.lerp(target, ease);
    const bob = 0.007 * Math.sin(clock.elapsedTime * 4 + truck.cell.col * 0.2 + truck.cell.row * 0.2);
    ref.current.position.set(smooth.current.x, smooth.current.y + bob, smooth.current.z);

    const direction = new THREE.Vector3(facingTarget.x - smooth.current.x, 0, facingTarget.z - smooth.current.z);
    if (direction.lengthSq() > 0.0004) {
      const targetHeading = Math.atan2(direction.x, direction.z);
      let deltaHeading = targetHeading - headingRef.current;
      while (deltaHeading > Math.PI) deltaHeading -= Math.PI * 2;
      while (deltaHeading < -Math.PI) deltaHeading += Math.PI * 2;
      headingRef.current += deltaHeading * Math.min(1, delta * 6.5);
      ref.current.rotation.y = headingRef.current;
    }

    const modeBoost =
      truck.mode === 'refill' ? 0.62 : truck.mode === 'to-pallet' ? 0.36 : truck.mode === 'to-storage' ? 0.26 : truck.mode === 'roam' ? 0.14 : 0.08;
    const pulse = 0.5 + 0.5 * Math.sin(clock.elapsedTime * (truck.mode === 'refill' ? 6 : 3.4) + truck.cell.col * 0.22);

    if (cabinRef.current) {
      cabinRef.current.emissiveIntensity = 0.16 + modeBoost * 0.32 + pulse * 0.12;
    }

    if (beaconRef.current) {
      beaconRef.current.emissiveIntensity = 0.3 + modeBoost * 0.86 + pulse * 0.4;
    }

    if (glowRef.current) {
      glowRef.current.intensity = 0.26 + modeBoost * 0.9 + pulse * 0.32;
      glowRef.current.distance = 1.6 + modeBoost * 1.1;
    }
  });

  return (
    <group ref={ref}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.54, 0.14, 0.34]} />
        <meshStandardMaterial color="#8fb6ea" emissive="#6c95d3" emissiveIntensity={0.2} roughness={0.34} metalness={0.22} />
      </mesh>
      <mesh position={[0.11, 0.15, 0]} castShadow>
        <boxGeometry args={[0.2, 0.2, 0.24]} />
        <meshStandardMaterial ref={cabinRef} color="#2c4463" emissive="#4a6e9f" emissiveIntensity={0.16} roughness={0.32} metalness={0.22} />
      </mesh>
      <mesh position={[-0.2, 0.2, -0.08]} castShadow>
        <boxGeometry args={[0.04, 0.34, 0.04]} />
        <meshStandardMaterial color="#b8cff0" emissive="#91b3e3" emissiveIntensity={0.2} roughness={0.26} metalness={0.24} />
      </mesh>
      <mesh position={[-0.2, 0.2, 0.08]} castShadow>
        <boxGeometry args={[0.04, 0.34, 0.04]} />
        <meshStandardMaterial color="#b8cff0" emissive="#91b3e3" emissiveIntensity={0.2} roughness={0.26} metalness={0.24} />
      </mesh>
      <mesh position={[-0.29, 0.07, -0.07]} castShadow>
        <boxGeometry args={[0.2, 0.03, 0.04]} />
        <meshStandardMaterial color="#9ec0ee" emissive="#8db2e6" emissiveIntensity={0.22} roughness={0.26} metalness={0.22} />
      </mesh>
      <mesh position={[-0.29, 0.07, 0.07]} castShadow>
        <boxGeometry args={[0.2, 0.03, 0.04]} />
        <meshStandardMaterial color="#9ec0ee" emissive="#8db2e6" emissiveIntensity={0.22} roughness={0.26} metalness={0.22} />
      </mesh>
      {truck.carrying ? (
        <mesh position={[-0.24, 0.12, 0]} castShadow>
          <boxGeometry args={[0.14, 0.09, 0.14]} />
          <meshStandardMaterial color="#d8e8ff" emissive="#8cb2e6" emissiveIntensity={0.2} roughness={0.33} metalness={0.12} />
        </mesh>
      ) : null}
      <mesh position={[0.24, 0.24, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.03, 14]} />
        <meshStandardMaterial ref={beaconRef} color="#9ec4f2" emissive="#86b4ea" emissiveIntensity={0.34} roughness={0.2} metalness={0.18} />
      </mesh>
      <pointLight ref={glowRef} position={[0.24, 0.22, 0]} color="#9ec3f0" intensity={0.36} distance={2.1} decay={1.8} />
    </group>
  );
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
  onRemoveHumanTileById,
  onConsumeSpawnDragTile,
  performanceMode,
  onAutoPerformanceMode
}: ThreeSceneProps & {
  performanceMode: boolean;
  onAutoPerformanceMode: () => void;
}) {
  const { camera } = useThree();
  const [draggingTileId, setDraggingTileId] = useState<string | null>(null);
  const [previewCell, setPreviewCell] = useState<GridCell | null>(null);
  const [hoverTileId, setHoverTileId] = useState<string | null>(null);
  const [focusCell, setFocusCell] = useState<GridCell | null>(null);
  const [lastPlacement, setLastPlacement] = useState<{ tileId: string; at: number } | null>(null);
  const [outboundFill, setOutboundFill] = useState({ human: 0, ai: 0 });
  const [dockFill, setDockFill] = useState<{ human: number[]; ai: number[] }>(() => ({
    human: humanStations.docks.map(() => 0),
    ai: aiStations.docks.map(() => 0)
  }));
  const [finishedQueue, setFinishedQueue] = useState({ human: 0, ai: 0 });
  const [stagedFinished, setStagedFinished] = useState({ human: 0, ai: 0 });
  const [effectsEnabled, setEffectsEnabled] = useState(true);
  const deliveredBoxRefs = useRef<Set<string>>(new Set());
  const deliveredDockRefs = useRef<Set<string>>(new Set());
  const packedRefs = useRef<{ human: Set<string>; ai: Set<string> }>({ human: new Set<string>(), ai: new Set<string>() });
  const finishedQueueRef = useRef({ human: 0, ai: 0 });
  const stagedFinishedRef = useRef({ human: 0, ai: 0 });
  const lowFpsStreakRef = useRef(0);
  const fpsWindowRef = useRef({ elapsed: 0, frames: 0 });
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const controlsLockedByDrag = canEdit && draggingTileId !== null;

  const humanPackingOutput = useMemo(() => {
    const [x, y, z] = cellToWorld({ col: humanStations.packingTable.col + 0.8, row: humanStations.packingTable.row }, 0.12);
    return new THREE.Vector3(x, y, z);
  }, [humanStations.packingTable]);

  const aiPackingOutput = useMemo(() => {
    const [x, y, z] = cellToWorld({ col: aiStations.packingTable.col + 0.8, row: aiStations.packingTable.row }, 0.12);
    return new THREE.Vector3(x, y, z);
  }, [aiStations.packingTable]);

  const humanPickBounds = useMemo(
    () => cellRect(HUMAN_COL_RANGE.min, HUMAN_COL_RANGE.max, 0, BOARD_ROWS - 1),
    []
  );

  const aiPickBounds = useMemo(
    () => cellRect(AI_COL_MIN, BOARD_COLS - 1, 0, BOARD_ROWS - 1),
    []
  );

  const humanStagingSlots = useMemo(() => {
    const laneCount = 3;
    const slotsPerLane = 7;
    const laneGap = 0.74;
    const slotGap = 0.56;
    const topBoundaryZ = cellToWorld({ col: 0, row: 0 }, 0.1)[2] - CELL_SIZE / 2;
    const laneStartX = -FACILITY_WIDTH / 2 + 0.92;
    const laneStartZ = topBoundaryZ + 2.7;
    const stagingZone: BoundsRect = {
      minX: -FACILITY_WIDTH / 2 + 0.6,
      maxX: humanPickBounds.minX - 0.52,
      minZ: topBoundaryZ + 0.7,
      maxZ: topBoundaryZ + 7.2
    };
    const forbidden = [humanPickBounds, cellRect(HUMAN_COL_RANGE.min, HUMAN_COL_RANGE.max, 7, 9)];
    const laneSlots: THREE.Vector3[][] = [];

    for (let lane = 0; lane < laneCount; lane += 1) {
      const laneX = laneStartX + lane * laneGap;
      const slots: THREE.Vector3[] = [];
      for (let row = 0; row < slotsPerLane; row += 1) {
        const candidate = new THREE.Vector3(laneX, 0.1, laneStartZ - row * slotGap);
        if (isValidStagingSlot(candidate, stagingZone, forbidden)) {
          slots.push(candidate);
        }
      }
      laneSlots.push(slots);
    }

    const overflowAnchorX = laneStartX + laneCount * laneGap + 0.58;
    const overflowAnchorZ = laneStartZ - 0.58;
    const overflowSlots: THREE.Vector3[] = [];
    for (let col = 0; col < 2; col += 1) {
      for (let row = 0; row < 2; row += 1) {
        const candidate = new THREE.Vector3(overflowAnchorX + col * 0.56, 0.1, overflowAnchorZ - row * 0.56);
        if (isValidStagingSlot(candidate, stagingZone, forbidden)) {
          overflowSlots.push(candidate);
        }
      }
    }

    const validLaneSlots = laneSlots.filter((lane) => lane.length > 0);
    const allSlots = [...validLaneSlots.flat(), ...overflowSlots];
    const corridorAnchorX = validLaneSlots[validLaneSlots.length - 1]?.[0]?.x ?? laneStartX;

    return {
      laneSlots: validLaneSlots,
      overflowSlots,
      allSlots,
      corridorX: corridorAnchorX + 0.28,
      zoneBounds: stagingZone
    };
  }, [humanPickBounds]);

  const aiStagingSlots = useMemo(() => {
    const laneCount = 3;
    const slotsPerLane = 7;
    const laneGap = 0.74;
    const slotGap = 0.56;
    const topBoundaryZ = cellToWorld({ col: 0, row: 0 }, 0.1)[2] - CELL_SIZE / 2;
    const laneStartX = aiPickBounds.minX - 2.7;
    const laneStartZ = topBoundaryZ + 2.7;
    const stagingZone: BoundsRect = {
      minX: aiPickBounds.minX - 2.9,
      maxX: aiPickBounds.minX - 0.52,
      minZ: topBoundaryZ + 0.7,
      maxZ: topBoundaryZ + 7.2
    };
    const forbidden = [aiPickBounds, cellRect(AI_COL_MIN, BOARD_COLS - 1, 7, 9)];
    const laneSlots: THREE.Vector3[][] = [];

    for (let lane = 0; lane < laneCount; lane += 1) {
      const laneX = laneStartX + lane * laneGap;
      const slots: THREE.Vector3[] = [];
      for (let row = 0; row < slotsPerLane; row += 1) {
        const candidate = new THREE.Vector3(laneX, 0.1, laneStartZ - row * slotGap);
        if (isValidStagingSlot(candidate, stagingZone, forbidden)) {
          slots.push(candidate);
        }
      }
      laneSlots.push(slots);
    }

    const overflowAnchorX = laneStartX + laneCount * laneGap + 0.58;
    const overflowAnchorZ = laneStartZ - 0.58;
    const overflowSlots: THREE.Vector3[] = [];
    for (let col = 0; col < 2; col += 1) {
      for (let row = 0; row < 2; row += 1) {
        const candidate = new THREE.Vector3(overflowAnchorX + col * 0.56, 0.1, overflowAnchorZ - row * 0.56);
        if (isValidStagingSlot(candidate, stagingZone, forbidden)) {
          overflowSlots.push(candidate);
        }
      }
    }

    const validLaneSlots = laneSlots.filter((lane) => lane.length > 0);
    const allSlots = [...validLaneSlots.flat(), ...overflowSlots];
    const corridorAnchorX = validLaneSlots[validLaneSlots.length - 1]?.[0]?.x ?? laneStartX;

    return {
      laneSlots: validLaneSlots,
      overflowSlots,
      allSlots,
      corridorX: corridorAnchorX + 0.28,
      zoneBounds: stagingZone
    };
  }, [aiPickBounds]);

  const logisticsForklifts = useMemo(() => {
    const humanCount = 1;
    const aiCount = 1;

    const humanRuntimes: LogisticsForkliftRuntime[] = new Array(humanCount).fill(0).map((_, index) => ({
      id: `human-logistics-forklift-${index}`,
      side: 'human' as const,
      from: humanPackingOutput.clone(),
      to: humanPackingOutput.clone(),
      progress: 1,
      state: 'idle',
      carrying: false,
      targetSlot: null,
      trailPhase: index * 0.9 + 0.2
    }));

    const aiRuntimes: LogisticsForkliftRuntime[] = new Array(aiCount).fill(0).map((_, index) => ({
      id: `ai-logistics-forklift-${index}`,
      side: 'ai' as const,
      from: aiPackingOutput.clone(),
      to: aiPackingOutput.clone(),
      progress: 1,
      state: 'idle',
      carrying: false,
      targetSlot: null,
      trailPhase: index * 1.1 + 0.7
    }));

    return { human: humanRuntimes, ai: aiRuntimes };
  }, [humanPackingOutput, aiPackingOutput]);

  const floorTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d');

    if (!context) {
      return new THREE.CanvasTexture(canvas);
    }

    context.fillStyle = '#8b735a';
    context.fillRect(0, 0, 256, 256);
    context.strokeStyle = 'rgba(86, 60, 40, 0.16)';
    context.lineWidth = 1;

    for (let index = 0; index <= 16; index += 1) {
      const offset = index * 16;
      context.beginPath();
      context.moveTo(offset, 0);
      context.lineTo(offset, 256);
      context.stroke();

      context.beginPath();
      context.moveTo(0, offset);
      context.lineTo(256, offset);
      context.stroke();
    }

    context.fillStyle = 'rgba(67, 47, 32, 0.12)';
    context.fillRect(0, 0, 256, 18);
    context.fillRect(0, 238, 256, 18);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2.2, 1.6);
    texture.anisotropy = 4;
    texture.needsUpdate = true;
    return texture;
  }, []);

  useEffect(() => {
    return () => {
      floorTexture.dispose();
    };
  }, [floorTexture]);

  function ZoneOverlay({
    colStart,
    colEnd,
    rowStart,
    rowEnd,
    color,
    opacity = 0.08,
    y = 0.056
  }: {
    colStart: number;
    colEnd: number;
    rowStart: number;
    rowEnd: number;
    color: string;
    opacity?: number;
    y?: number;
  }) {
    const center = useMemo(() => {
      const [ax, , az] = cellToWorld({ col: colStart, row: rowStart });
      const [bx, , bz] = cellToWorld({ col: colEnd, row: rowEnd });
      return [(ax + bx) / 2, y, (az + bz) / 2] as [number, number, number];
    }, [colStart, colEnd, rowStart, rowEnd, y]);

    const width = (Math.abs(colEnd - colStart) + 1) * CELL_SIZE;
    const depth = (Math.abs(rowEnd - rowStart) + 1) * CELL_SIZE;

    return (
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={center}>
        <planeGeometry args={[width - 0.08, depth - 0.08]} />
        <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
      </mesh>
    );
  }

  function MachineProcessor({ stations, phaseOffset }: { stations: StationSet; phaseOffset: number }) {
    const [mx, , mz] = cellToWorld(stations.machine, 0.28);
    const [px, , pz] = cellToWorld(stations.packingTable, 0.28);
    const [ox, , oz] = cellToWorld(stations.outbound, 0.28);
    const inCrateRef = useRef<THREE.Group | null>(null);
    const outCrateRef = useRef<THREE.Group | null>(null);

    useFrame(({ clock }) => {
      const cycle = (clock.elapsedTime * 0.42 + phaseOffset) % 1;
      const toMachine = Math.min(1, cycle / 0.52);

      if (inCrateRef.current) {
        inCrateRef.current.position.set(
          THREE.MathUtils.lerp(px, mx, toMachine),
          0.2,
          THREE.MathUtils.lerp(pz, mz, toMachine)
        );
        inCrateRef.current.visible = cycle < 0.7;
      }

      if (outCrateRef.current) {
        const fromMachine = clamp((cycle - 0.56) / 0.4, 0, 1);
        outCrateRef.current.position.set(
          THREE.MathUtils.lerp(mx, ox, fromMachine),
          0.2,
          THREE.MathUtils.lerp(mz, oz, fromMachine)
        );
        outCrateRef.current.visible = cycle > 0.55;
      }
    });

    return (
      <>
        <group ref={inCrateRef}>
          <mesh castShadow>
            <boxGeometry args={[0.14, 0.1, 0.12]} />
            <meshStandardMaterial color="#afcdef" emissive="#7ea8de" emissiveIntensity={0.18} roughness={0.32} metalness={0.12} />
          </mesh>
        </group>
        <group ref={outCrateRef}>
          <mesh castShadow>
            <boxGeometry args={[0.16, 0.11, 0.14]} />
            <meshStandardMaterial color="#dcebff" emissive="#90b9ec" emissiveIntensity={0.26} roughness={0.26} metalness={0.1} />
          </mesh>
        </group>
      </>
    );
  }


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

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (!canEdit) return;
      if (event.key !== 'Backspace' && event.key !== 'Delete') return;

      const activeElement = document.activeElement as HTMLElement | null;
      if (
        activeElement &&
        (activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.isContentEditable)
      ) {
        return;
      }

      const hoveredHumanTile = humanTiles.find((tile) => tile.id === hoverTileId);
      if (!hoveredHumanTile) return;

      event.preventDefault();
      onRemoveHumanTileById(hoveredHumanTile.id);
      if (draggingTileId === hoveredHumanTile.id) {
        setDraggingTileId(null);
        setPreviewCell(null);
      }
      setHoverTileId(null);
      setFocusCell(null);
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [canEdit, hoverTileId, humanTiles, onRemoveHumanTileById, draggingTileId]);

  const floorWidth = FACILITY_WIDTH + 4;
  const floorDepth = FACILITY_DEPTH + 4;

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

    const committedTileId = draggingTileId;
    onCommitHumanTile(committedTileId, cell);
    setLastPlacement({ tileId: committedTileId, at: performance.now() });
    setDraggingTileId(null);
    setPreviewCell(null);
  };

  const aiPulse = aiActiveTileId ? 0.35 : 0;
  const palletLookup = useMemo(() => {
    const lookup = new Map<string, PalletVisual>();
    [...visualState.humanPallets, ...visualState.aiPallets].forEach((pallet) => {
      lookup.set(pallet.id, pallet);
    });
    return lookup;
  }, [visualState.humanPallets, visualState.aiPallets]);

  useEffect(() => {
    camera.position.set(18.6, 14.8, 18.6);
    const controls = controlsRef.current;
    if (controls) {
      controls.target.set(0, 0.24, 0);
      controls.update();
    }
  }, [camera]);

  useEffect(() => {
    if (phase === 'build') {
      setOutboundFill({ human: 0, ai: 0 });
      setDockFill({
        human: humanStations.docks.map(() => 0),
        ai: aiStations.docks.map(() => 0)
      });
      setFinishedQueue({ human: 0, ai: 0 });
      setStagedFinished({ human: 0, ai: 0 });
      finishedQueueRef.current = { human: 0, ai: 0 };
      stagedFinishedRef.current = { human: 0, ai: 0 };
      deliveredBoxRefs.current.clear();
      deliveredDockRefs.current.clear();
      packedRefs.current.human.clear();
      packedRefs.current.ai.clear();
    }
  }, [phase, humanStations.docks, aiStations.docks]);

  useEffect(() => {
    if (phase !== 'simulating') {
      packedRefs.current.human.clear();
      packedRefs.current.ai.clear();
      return;
    }

    const nextHumanPacked = new Set<string>();
    const nextAiPacked = new Set<string>();
    let humanPackedIncrement = 0;
    let aiPackedIncrement = 0;

    visualState.humanBoxes.forEach((box, index) => {
      const key = `h-packed:${box.id}:${index}`;
      const atPacking = manhattan(box.cell, humanStations.packingTable) <= 1;
      if (atPacking) {
        nextHumanPacked.add(key);
        if (!packedRefs.current.human.has(key)) {
          humanPackedIncrement += 1;
        }
      }
    });

    visualState.aiBoxes.forEach((box, index) => {
      const key = `a-packed:${box.id}:${index}`;
      const atPacking = manhattan(box.cell, aiStations.packingTable) <= 1;
      if (atPacking) {
        nextAiPacked.add(key);
        if (!packedRefs.current.ai.has(key)) {
          aiPackedIncrement += 1;
        }
      }
    });

    if (humanPackedIncrement > 0 || aiPackedIncrement > 0) {
      setFinishedQueue((current) => {
        const next = {
          human: clamp(current.human + humanPackedIncrement, 0, 220),
          ai: clamp(current.ai + aiPackedIncrement, 0, 220)
        };
        finishedQueueRef.current = next;
        return next;
      });
    }

    packedRefs.current.human = nextHumanPacked;
    packedRefs.current.ai = nextAiPacked;
  }, [phase, visualState.humanBoxes, visualState.aiBoxes, humanStations.packingTable, aiStations.packingTable]);

  useEffect(() => {
    if (phase !== 'simulating') {
      deliveredBoxRefs.current.clear();
      return;
    }

    const nextDelivered = new Set<string>();
    const nextDockDelivered = new Set<string>();
    let humanIncrement = 0;
    let aiIncrement = 0;
    const humanDockIncrements = humanStations.docks.map(() => 0);
    const aiDockIncrements = aiStations.docks.map(() => 0);

    visualState.humanBoxes.forEach((box, index) => {
      const key = `h:${box.id}:${index}`;
      const atOutbound = manhattan(box.cell, humanStations.outbound) <= 1;
      if (atOutbound) {
        nextDelivered.add(key);
        if (!deliveredBoxRefs.current.has(key)) {
          humanIncrement += 1;
        }
      }

      const dockIndex = humanStations.docks.findIndex((dock) => manhattan(box.cell, dock) <= 0);
      if (dockIndex >= 0) {
        const dockKey = `h:${box.id}:${dockIndex}`;
        nextDockDelivered.add(dockKey);
        if (!deliveredDockRefs.current.has(dockKey)) {
          humanDockIncrements[dockIndex] += 1;
        }
      }
    });

    visualState.aiBoxes.forEach((box, index) => {
      const key = `a:${box.id}:${index}`;
      const atOutbound = manhattan(box.cell, aiStations.outbound) <= 1;
      if (atOutbound) {
        nextDelivered.add(key);
        if (!deliveredBoxRefs.current.has(key)) {
          aiIncrement += 1;
        }
      }

      const dockIndex = aiStations.docks.findIndex((dock) => manhattan(box.cell, dock) <= 0);
      if (dockIndex >= 0) {
        const dockKey = `a:${box.id}:${dockIndex}`;
        nextDockDelivered.add(dockKey);
        if (!deliveredDockRefs.current.has(dockKey)) {
          aiDockIncrements[dockIndex] += 1;
        }
      }
    });

    if (humanIncrement > 0 || aiIncrement > 0) {
      setOutboundFill((current) => ({
        human: clamp(current.human + humanIncrement, 0, 24),
        ai: clamp(current.ai + aiIncrement, 0, 24)
      }));
    }

    if (humanDockIncrements.some((value) => value > 0) || aiDockIncrements.some((value) => value > 0)) {
      setDockFill((current) => ({
        human: current.human.map((value, index) => clamp(value + (humanDockIncrements[index] ?? 0), 0, 28)),
        ai: current.ai.map((value, index) => clamp(value + (aiDockIncrements[index] ?? 0), 0, 28))
      }));
    }

    deliveredBoxRefs.current = nextDelivered;
    deliveredDockRefs.current = nextDockDelivered;
  }, [phase, visualState.humanBoxes, visualState.aiBoxes, humanStations.outbound, aiStations.outbound, humanStations.docks, aiStations.docks]);

  useFrame((_, delta) => {
    if (phase === 'simulating') {
      let queueHuman = finishedQueueRef.current.human;
      let queueAi = finishedQueueRef.current.ai;
      let stagedHuman = stagedFinishedRef.current.human;
      let stagedAi = stagedFinishedRef.current.ai;

      (['human', 'ai'] as LogisticsSide[]).forEach((side) => {
        const runtimes = side === 'human' ? logisticsForklifts.human : logisticsForklifts.ai;
        const packingPoint = side === 'human' ? humanPackingOutput : aiPackingOutput;
        const staging = side === 'human' ? humanStagingSlots : aiStagingSlots;
        const stagingSlots = staging.allSlots;
        const corridorX = staging.corridorX;
        const speed = side === 'ai' ? (performanceMode ? 1.12 : 1.28) : (performanceMode ? 0.9 : 1.02);
        let reservedDrops = 0;

        runtimes.forEach((runtime) => {
          if (runtime.state !== 'idle') {
            const distance = Math.max(0.01, runtime.from.distanceTo(runtime.to));
            runtime.progress = clamp(runtime.progress + (delta * speed) / distance, 0, 1);
          }

          if (runtime.state === 'to-corridor' && runtime.progress >= 1) {
            if (runtime.targetSlot) {
              runtime.state = 'to-stage';
              runtime.from = runtime.to.clone();
              runtime.to = runtime.targetSlot.clone();
              runtime.progress = 0;
            }
          } else if (runtime.state === 'to-stage' && runtime.progress >= 1) {
            runtime.carrying = false;
            runtime.state = 'to-return-corridor';
            runtime.from = runtime.to.clone();
            runtime.to = new THREE.Vector3(corridorX, packingPoint.y, runtime.to.z);
            runtime.progress = 0;
            if (side === 'human') {
              stagedHuman = clamp(stagedHuman + 1, 0, humanStagingSlots.allSlots.length);
            } else {
              stagedAi = clamp(stagedAi + 1, 0, aiStagingSlots.allSlots.length);
            }
          } else if (runtime.state === 'to-return-corridor' && runtime.progress >= 1) {
            runtime.state = 'to-pack-return';
            runtime.from = runtime.to.clone();
            runtime.to = packingPoint.clone();
            runtime.progress = 0;
          } else if (runtime.state === 'to-pack-return' && runtime.progress >= 1) {
            runtime.state = 'idle';
            runtime.from = packingPoint.clone();
            runtime.to = packingPoint.clone();
            runtime.progress = 1;
            runtime.targetSlot = null;
          }

          const currentQueue = side === 'human' ? queueHuman : queueAi;
          if (runtime.state === 'idle' && currentQueue > 0 && stagingSlots.length > 0) {
            if (side === 'human') {
              queueHuman -= 1;
            } else {
              queueAi -= 1;
            }

            const currentStaged = side === 'human' ? stagedHuman : stagedAi;
            const slotIndex = clamp(currentStaged + reservedDrops, 0, stagingSlots.length - 1);
            reservedDrops += 1;
            const targetSlot = stagingSlots[slotIndex];

            runtime.carrying = true;
            runtime.state = 'to-corridor';
            runtime.targetSlot = targetSlot.clone();
            runtime.from = packingPoint.clone();
            runtime.to = new THREE.Vector3(corridorX, packingPoint.y, packingPoint.z);
            runtime.progress = 0;
          }
        });
      });

      if (queueHuman !== finishedQueueRef.current.human || queueAi !== finishedQueueRef.current.ai) {
        const nextQueue = { human: queueHuman, ai: queueAi };
        finishedQueueRef.current = nextQueue;
        setFinishedQueue(nextQueue);
      }

      if (stagedHuman !== stagedFinishedRef.current.human || stagedAi !== stagedFinishedRef.current.ai) {
        const nextStaged = { human: stagedHuman, ai: stagedAi };
        stagedFinishedRef.current = nextStaged;
        setStagedFinished(nextStaged);
      }
    }

    if (performanceMode) {
      fpsWindowRef.current.elapsed = 0;
      fpsWindowRef.current.frames = 0;
      lowFpsStreakRef.current = 0;
      return;
    }

    fpsWindowRef.current.elapsed += delta;
    fpsWindowRef.current.frames += 1;

    if (fpsWindowRef.current.elapsed >= 1) {
      const averageFps = fpsWindowRef.current.frames / fpsWindowRef.current.elapsed;
      if (averageFps < 42) {
        lowFpsStreakRef.current += 1;
        if (lowFpsStreakRef.current >= 2) {
          onAutoPerformanceMode();
        }
      } else {
        lowFpsStreakRef.current = 0;
      }

      fpsWindowRef.current.elapsed = 0;
      fpsWindowRef.current.frames = 0;
    }
  });

  return (
    <>
      <fog attach="fog" args={['#1d1511', 78, 168]} />
      <ambientLight intensity={0.22} color="#d9be9a" />
      <directionalLight
        position={[12.2, 18.6, 10.4]}
        intensity={1.1}
        color="#f2d2a5"
      />
      <pointLight position={[-9.6, 6.2, -6]} color="#8ea2c3" intensity={0.4} distance={12} decay={2.2} />
      <pointLight position={[10.4, 5.4, 7.2]} color="#f1cc9d" intensity={0.34} distance={10} decay={2.1} />

      <mesh position={[0, -0.27, 0]} receiveShadow>
        <boxGeometry args={[floorWidth + 1.6, 0.62, floorDepth + 1.6]} />
        <meshStandardMaterial color="#2a2019" emissive="#32251c" emissiveIntensity={0.04} roughness={0.84} metalness={0.06} />
      </mesh>

      <mesh position={[0, -0.06, 0]} receiveShadow>
        <boxGeometry args={[FACILITY_WIDTH + 0.7, 0.16, FACILITY_DEPTH + 0.7]} />
        <meshStandardMaterial color="#3a2d24" emissive="#443328" emissiveIntensity={0.05} roughness={0.74} metalness={0.08} />
      </mesh>

      <mesh position={[0, 0.02, 0]} receiveShadow>
        <boxGeometry args={[FACILITY_WIDTH, 0.06, FACILITY_DEPTH]} />
        <meshStandardMaterial color="#6d5a46" emissive="#7a624b" emissiveIntensity={0.04} roughness={0.68} metalness={0.08} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.052, 0]} receiveShadow>
        <planeGeometry args={[PICK_ZONE_WIDTH, PICK_ZONE_DEPTH]} />
        <meshStandardMaterial color="#8f765b" roughness={0.76} metalness={0.06} map={floorTexture} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} receiveShadow>
        <planeGeometry args={[FACILITY_WIDTH, FACILITY_DEPTH]} />
        <meshStandardMaterial color="#18293f" emissive="#223a57" emissiveIntensity={0.03} roughness={0.78} metalness={0.1} transparent opacity={0.12} depthWrite={false} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.051, 0]} receiveShadow>
        <planeGeometry args={[PICK_ZONE_WIDTH - 0.1, PICK_ZONE_DEPTH - 0.1]} />
        <meshStandardMaterial color="#122033" emissive="#223b5b" emissiveIntensity={0.03} roughness={0.8} metalness={0.08} transparent opacity={0.13} depthWrite={false} />
      </mesh>

      <ZoneOverlay colStart={HUMAN_COL_RANGE.min} colEnd={HUMAN_COL_RANGE.max} rowStart={0} rowEnd={6} color="#6ea4df" opacity={0.065} />
      <ZoneOverlay colStart={AI_COL_MIN} colEnd={BOARD_COLS - 1} rowStart={0} rowEnd={6} color="#9bb7dc" opacity={0.058} />
      <ZoneOverlay colStart={HUMAN_COL_RANGE.min} colEnd={HUMAN_COL_RANGE.max} rowStart={7} rowEnd={7} color="#d29267" opacity={0.08} />
      <ZoneOverlay colStart={AI_COL_MIN} colEnd={BOARD_COLS - 1} rowStart={7} rowEnd={7} color="#d29267" opacity={0.08} />
      <ZoneOverlay colStart={HUMAN_COL_RANGE.min} colEnd={HUMAN_COL_RANGE.max} rowStart={8} rowEnd={9} color="#84b1e7" opacity={0.075} />
      <ZoneOverlay colStart={AI_COL_MIN} colEnd={BOARD_COLS - 1} rowStart={8} rowEnd={9} color="#84b1e7" opacity={0.075} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.052, 0]} receiveShadow>
        <planeGeometry args={[FACILITY_WIDTH - 0.5, FACILITY_DEPTH - 0.5]} />
        <meshBasicMaterial color="#f3e2cb" transparent opacity={0.03} depthWrite={false} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-11.6, 0.056, 0]} receiveShadow>
        <planeGeometry args={[6.2, FACILITY_DEPTH - 1.2]} />
        <meshBasicMaterial color="#6f9ad4" transparent opacity={0.018} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[11.6, 0.056, 0]} receiveShadow>
        <planeGeometry args={[6.2, FACILITY_DEPTH - 1.2]} />
        <meshBasicMaterial color="#8ea8cc" transparent opacity={0.018} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.056, -8.4]} receiveShadow>
        <planeGeometry args={[PICK_ZONE_WIDTH - 0.4, 5]} />
        <meshBasicMaterial color="#7c9fcf" transparent opacity={0.015} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.056, 6.4]} receiveShadow>
        <planeGeometry args={[PICK_ZONE_WIDTH - 0.5, 3.8]} />
        <meshBasicMaterial color="#b7cceb" transparent opacity={0.022} />
      </mesh>

      {[-6, -3, 0, 3, 6].map((x, index) => (
        <mesh key={`dock-mark-${index}`} position={[x, 0.09, 6.4]}>
          <boxGeometry args={[0.08, 0.01, 2.8]} />
          <meshStandardMaterial color="#a6c0e6" emissive="#86addf" emissiveIntensity={0.28} roughness={0.24} metalness={0.18} transparent opacity={0.62} />
        </mesh>
      ))}

      <mesh position={cellToWorld({ col: 7, row: 4.5 }, 0.09)} castShadow receiveShadow>
        <boxGeometry args={[0.08, 0.16, PICK_ZONE_DEPTH + 0.8]} />
        <meshStandardMaterial color="#a6bfe4" emissive="#7b9ccf" emissiveIntensity={0.3} roughness={0.28} metalness={0.26} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.058, 0]}>
        <planeGeometry args={[PICK_ZONE_WIDTH - 0.25, PICK_ZONE_DEPTH - 0.25]} />
        <meshBasicMaterial color="#9dbfe9" transparent opacity={0.014} depthWrite={false} />
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

      <StorageRackField />
      <StoragePallets />
      {phase === 'build' ? (
        <>
          <Forklift cell={{ col: 0.6, row: 0.8 }} heading={Math.PI * 0.28} />
          <Forklift cell={{ col: 14.3, row: 0.8 }} heading={Math.PI * -0.22} />
        </>
      ) : null}

      {focusCell ? (
        <mesh position={cellToWorld(draggingTileId ? sideClamp(focusCell) : focusCell, 0.08)}>
          <boxGeometry args={[0.98, 0.02, 0.98]} />
          <meshStandardMaterial color="#9ec0eb" emissive="#8db4e9" emissiveIntensity={0.42} transparent opacity={0.34} />
        </mesh>
      ) : null}

      {draggingTileId && previewCell ? (
        <mesh position={cellToWorld(sideClamp(previewCell), 0.09)}>
          <boxGeometry args={[0.94, 0.04, 0.94]} />
          <meshStandardMaterial
            color={occupancy.has(cellKey(sideClamp(previewCell))) || blockedHuman.has(cellKey(sideClamp(previewCell))) ? '#c56f6f' : '#7da7df'}
            emissive={occupancy.has(cellKey(sideClamp(previewCell))) || blockedHuman.has(cellKey(sideClamp(previewCell))) ? '#aa5d5d' : '#6f9bd8'}
            emissiveIntensity={0.6}
            transparent
            opacity={0.72}
          />
        </mesh>
      ) : null}

      <DioramaStation cell={humanStations.depot} title="Depot" accent="#b88f63" />
      <DioramaStation cell={humanStations.dropoff} title="Drop" accent="#b88f63" />
      <DioramaStation cell={humanStations.packingTable} title="Packing" accent="#cf9d67" />
      <DioramaStation cell={humanStations.machine} title="Machine" accent="#b68a5f" />
      <DioramaStation cell={humanStations.outbound} title="Outbound" accent="#b88f63" />
      <MachineProcessor stations={humanStations} phaseOffset={0.08} />
      <OutboundBuffer cell={humanStations.outbound} count={outboundFill.human} accent="#8cb8ef" />
      <DockGroup docks={humanStations.docks} loadCounts={dockFill.human} />
      <Conveyor from={humanStations.packingTable} to={humanStations.machine} />

      {new Array(Math.min(finishedQueue.human, 6)).fill(0).map((_, index) => {
        const offsetX = (index % 2) * 0.32;
        const offsetZ = Math.floor(index / 2) * 0.28;
        const base = humanPackingOutput;
        return (
          <FinishedPalletUnit
            key={`human-queue-finished-${index}`}
            position={[base.x + offsetX, base.y + 0.01, base.z + offsetZ]}
            rotationY={0.05 * (index % 3)}
            wrappedColor="#e8f2ff"
            strapColor="#8cb7ea"
          />
        );
      })}

      <StagedPalletInstancedField
        slots={humanStagingSlots.allSlots}
        count={stagedFinished.human}
        wrappedColor="#e7f2ff"
        strapColor="#8ab6ea"
      />

      <StagingLaneMarkings
        laneSlots={humanStagingSlots.laneSlots}
        overflowSlots={humanStagingSlots.overflowSlots}
        zoneBounds={humanStagingSlots.zoneBounds}
        laneColor="#7ea8dc"
        slotColor="#b6cff0"
        overflowColor="#c5d6ef"
      />

      {logisticsForklifts.human.map((runtime) => (
        <LogisticsForklift key={runtime.id} runtime={runtime} color="#8bb3e6" glow="#7ca4db" />
      ))}

      <DioramaStation cell={aiStations.depot} title="Depot" accent="#b88f63" />
      <DioramaStation cell={aiStations.dropoff} title="Drop" accent="#b88f63" />
      <DioramaStation cell={aiStations.packingTable} title="Packing" accent="#cf9d67" />
      <DioramaStation cell={aiStations.machine} title="Machine" accent="#b68a5f" />
      <DioramaStation cell={aiStations.outbound} title="Outbound" accent="#b88f63" />
      <MachineProcessor stations={aiStations} phaseOffset={0.42} />
      <OutboundBuffer cell={aiStations.outbound} count={outboundFill.ai} accent="#8cb8ef" />
      <DockGroup docks={aiStations.docks} loadCounts={dockFill.ai} />
      <Conveyor from={aiStations.packingTable} to={aiStations.machine} />

      {new Array(Math.min(finishedQueue.ai, 8)).fill(0).map((_, index) => {
        const offsetX = (index % 2) * 0.32;
        const offsetZ = Math.floor(index / 2) * 0.28;
        const base = aiPackingOutput;
        return (
          <FinishedPalletUnit
            key={`ai-queue-finished-${index}`}
            position={[base.x + offsetX, base.y + 0.01, base.z + offsetZ]}
            rotationY={0.06 * (index % 4)}
            wrappedColor="#def0ff"
            strapColor="#76a5df"
          />
        );
      })}

      <StagedPalletInstancedField
        slots={aiStagingSlots.allSlots}
        count={stagedFinished.ai}
        wrappedColor="#e1efff"
        strapColor="#79a7e0"
      />

      <StagingLaneMarkings
        laneSlots={aiStagingSlots.laneSlots}
        overflowSlots={aiStagingSlots.overflowSlots}
        zoneBounds={aiStagingSlots.zoneBounds}
        laneColor="#7a9fd1"
        slotColor="#afc8e8"
        overflowColor="#bed2ec"
      />

      {logisticsForklifts.ai.map((runtime) => (
        <LogisticsForklift key={runtime.id} runtime={runtime} color="#7fa9df" glow="#6999d4" />
      ))}

      {humanTiles.map((tile) => (
        <DioramaPallet
          key={tile.id}
          tile={tile}
          pallet={palletLookup.get(tile.id)}
          y={0.18}
          hover={hoverTileId === tile.id}
          active={phase === 'simulating'}
          previewCell={previewCell}
          isDragging={draggingTileId === tile.id}
          placementPulseAt={lastPlacement?.tileId === tile.id ? lastPlacement.at : undefined}
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
        <DioramaPallet
          key={tile.id}
          tile={tile}
          pallet={palletLookup.get(tile.id)}
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
        <ActiveTarget key={`target-${index}-${target.col}-${target.row}`} target={target} index={index} />
      ))}

      {visualState.humanBoxes.map((box) => (
        <MovingBox key={`h-${box.id}`} box={box} stations={humanStations} />
      ))}

      {visualState.aiBoxes.map((box) => (
        <MovingBox key={`a-${box.id}`} box={box} stations={aiStations} />
      ))}

      {visualState.humanAgents.map((agent) => (
        <WorkerAgent key={`h-agent-${agent.id}`} agent={agent} stations={humanStations} />
      ))}

      {visualState.aiAgents.map((agent) => (
        <WorkerAgent key={`a-agent-${agent.id}`} agent={agent} stations={aiStations} />
      ))}

      {[...visualState.humanReachTrucks, ...visualState.aiReachTrucks].map((truck) => (
        <ReachTruck key={truck.id} truck={truck} />
      ))}

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enabled={!controlsLockedByDrag}
        enableRotate={!controlsLockedByDrag}
        enablePan={!controlsLockedByDrag}
        panSpeed={0.26}
        enableZoom={!controlsLockedByDrag}
        enableDamping
        dampingFactor={controlsLockedByDrag ? 0 : 0.1}
        minDistance={17.2}
        maxDistance={31.5}
        minPolarAngle={0.72}
        maxPolarAngle={1.14}
        minAzimuthAngle={Math.PI / 4 - 0.35}
        maxAzimuthAngle={Math.PI / 4 + 0.35}
        target={[0, 0.24, 0]}
      />

      {effectsEnabled && !performanceMode ? (
        <ErrorBoundary
          onError={(error) => {
            console.error('[ThreeScene] Postprocessing failed, disabling effects.', error);
            setEffectsEnabled(false);
          }}
          fallbackRender={() => null}
        >
          <EffectComposer>
            <Bloom luminanceThreshold={0.36} luminanceSmoothing={0.74} intensity={0.1 + aiPulse * 0.22} />
            <Vignette eskil offset={0.2} darkness={0.56} />
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
  const [performanceMode, setPerformanceMode] = useState(false);

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
          key={performanceMode ? 'performance' : 'quality'}
          shadows={false}
          dpr={performanceMode ? [1, 1.2] : [1, 1.5]}
          camera={{ position: [18.6, 14.8, 18.6], fov: 30 }}
          gl={{ antialias: !performanceMode, powerPreference: 'high-performance' }}
          onCreated={({ gl }) => {
            try {
              if (!gl || typeof gl.getContextAttributes !== 'function') {
                throw new Error('WebGL renderer context unavailable');
              }
              (gl as THREE.WebGLRenderer & { useLegacyLights?: boolean }).useLegacyLights = false;
              gl.outputColorSpace = THREE.SRGBColorSpace;
              gl.toneMapping = THREE.ACESFilmicToneMapping;
              gl.toneMappingExposure = 1.03;
            } catch (error) {
              console.error('[ThreeScene] Canvas creation check failed.', error);
              setCanvasFailed(true);
            }
          }}
        >
          <color attach="background" args={[ASCENTRA_THEME.color.neutral0]} />
          <SceneRig
            {...props}
            performanceMode={performanceMode}
            onAutoPerformanceMode={() => {
              setPerformanceMode(true);
            }}
          />
        </Canvas>
      </div>
    </ErrorBoundary>
  );
}
