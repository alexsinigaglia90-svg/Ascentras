import { useEffect, useMemo, useRef, useState } from 'react';
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
const PICK_ZONE_WIDTH = BOARD_COLS * CELL_SIZE;
const PICK_ZONE_DEPTH = BOARD_ROWS * CELL_SIZE;
const FACILITY_WIDTH = PICK_ZONE_WIDTH * 2.5;
const FACILITY_DEPTH = PICK_ZONE_DEPTH * 2.55;

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
    <group>
      <lineSegments geometry={geometry} position={[0, 0, 0]}>
        <lineBasicMaterial color="#6f8fb4" transparent opacity={0.072} />
      </lineSegments>
      <lineSegments geometry={geometry} position={[0, 0.002, 0]}>
        <lineBasicMaterial color="#89a9cf" transparent opacity={0.016} />
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
        color="#27364d"
        emissive="#41587a"
        emissiveIntensity={0.2}
        stripColor={STATION_THEME.strip}
        stripOpacity={0.52}
      />
      <mesh position={[0, 0.09, 0]}>
        <boxGeometry args={[length * 0.92, 0.02, 0.28]} />
        <meshStandardMaterial color="#1f2d40" emissive="#314965" emissiveIntensity={0.18} roughness={0.54} metalness={0.18} />
      </mesh>
      <mesh position={[0, 0.1, 0.23]}>
        <boxGeometry args={[length * 0.9, 0.03, 0.04]} />
        <meshStandardMaterial color="#9ebde7" emissive="#88afe4" emissiveIntensity={0.24} roughness={0.28} metalness={0.22} />
      </mesh>
      <mesh position={[0, 0.1, -0.23]}>
        <boxGeometry args={[length * 0.9, 0.03, 0.04]} />
        <meshStandardMaterial color="#9ebde7" emissive="#88afe4" emissiveIntensity={0.24} roughness={0.28} metalness={0.22} />
      </mesh>
      <group ref={stripeRef}>
        {new Array(8).fill(0).map((_, index) => (
          <mesh key={index} castShadow>
            <boxGeometry args={[0.22, 0.016, 0.18]} />
            <meshStandardMaterial color="#7fa7dc" emissive="#87b4e9" emissiveIntensity={0.3} roughness={0.34} metalness={0.24} />
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
  const labelWarm = title === 'Packing';
  const [texture] = useState(() => labelTexture(title, labelWarm ? '#f0b47f' : '#9cc4ee', labelWarm));
  const [x, y, z] = cellToWorld(cell, 0.24);
  const ledRef = useRef<THREE.MeshStandardMaterial | null>(null);

  useFrame(({ clock }) => {
    if (!ledRef.current) return;
    const pulse = 0.35 + (Math.sin(clock.elapsedTime * 2.1 + x * 0.12 + z * 0.08) + 1) * 0.26;
    ledRef.current.emissiveIntensity = pulse;
  });

  return (
    <group position={[x, y, z]}>
      <BeveledBlock
        size={[scale[0] * 1.06, scale[1] * 0.58, scale[2] * 1.06]}
        radius={ASCENTRA_THEME.radius.machine}
        color={STATION_THEME.base}
        emissive={accent}
        emissiveIntensity={0.1}
        stripColor={STATION_THEME.strip}
        stripOpacity={0.34}
      />
      <mesh position={[0, 0.18, 0]} castShadow receiveShadow>
        <boxGeometry args={[scale[0] * 0.9, scale[1] * 0.76, scale[2] * 0.9]} />
        <meshStandardMaterial color="#344d6d" emissive={accent} emissiveIntensity={0.08} roughness={0.48} metalness={0.16} />
      </mesh>
      <mesh position={[0, 0.24, scale[2] * 0.36]}>
        <boxGeometry args={[scale[0] * 0.52, 0.05, 0.06]} />
        <meshStandardMaterial color="#cde1fb" emissive="#9bc3ef" emissiveIntensity={0.2} roughness={0.3} metalness={0.16} />
      </mesh>
      <mesh position={[scale[0] * 0.36, 0.19, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.06, scale[1] * 0.48, scale[2] * 0.4]} />
        <meshStandardMaterial color="#344d6d" emissive={accent} emissiveIntensity={0.12} roughness={0.34} metalness={0.26} />
      </mesh>
      <mesh position={[-scale[0] * 0.36, 0.19, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.06, scale[1] * 0.48, scale[2] * 0.4]} />
        <meshStandardMaterial color="#2f4663" emissive={accent} emissiveIntensity={0.12} roughness={0.34} metalness={0.26} />
      </mesh>
      <mesh position={[0, 0.36, 0]} castShadow receiveShadow>
        <boxGeometry args={[scale[0] * 0.8, 0.05, scale[2] * 0.8]} />
        <meshStandardMaterial color="#86aede" emissive="#9ec3f1" emissiveIntensity={0.16} roughness={0.34} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.366, 0]}>
        <boxGeometry args={[scale[0] * 0.82, 0.012, scale[2] * 0.82]} />
        <meshStandardMaterial color="#e6effc" emissive="#ffffff" emissiveIntensity={0.08} roughness={0.2} metalness={0.04} />
      </mesh>
      <mesh position={[0, 0.34, scale[2] * 0.38]}>
        <boxGeometry args={[scale[0] * 0.62, 0.02, 0.03]} />
        <meshStandardMaterial color={STATION_THEME.strip} emissive={STATION_THEME.strip} emissiveIntensity={0.24} transparent opacity={0.72} roughness={0.24} metalness={0.16} />
      </mesh>
      <mesh position={[0, 0.2, -scale[2] * 0.37]}>
        <boxGeometry args={[scale[0] * 0.5, 0.06, 0.05]} />
        <meshStandardMaterial color={labelWarm ? '#f2b88e' : '#a6c7ed'} emissive={labelWarm ? '#e9aa79' : '#8eb5e6'} emissiveIntensity={0.24} roughness={0.2} metalness={0.24} />
      </mesh>
      <mesh position={[scale[0] * 0.31, 0.38, scale[2] * 0.31]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.02, 14]} />
        <meshStandardMaterial ref={ledRef} color={STATION_THEME.led} emissive={STATION_THEME.led} emissiveIntensity={0.28} roughness={0.24} metalness={0.16} />
      </mesh>
      <mesh position={[0, 0.22, 0.31]}>
        <boxGeometry args={[scale[0] * 0.38, 0.04, 0.03]} />
        <meshStandardMaterial color="#d0e4ff" emissive="#9abde7" emissiveIntensity={0.24} roughness={0.18} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.22, -0.31]}>
        <boxGeometry args={[scale[0] * 0.38, 0.04, 0.03]} />
        <meshStandardMaterial color="#d0e4ff" emissive="#9abde7" emissiveIntensity={0.24} roughness={0.18} metalness={0.2} />
      </mesh>
      <sprite position={[0, 0.55, 0]} scale={[1.2, 0.48, 1]}>
        <spriteMaterial map={texture} transparent depthWrite={false} />
      </sprite>
    </group>
  );
}

function DockGroup({ docks }: { docks: GridCell[] }) {
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
        color="#22354d"
        emissive="#334f73"
        emissiveIntensity={0.08}
      />
      <mesh position={[0, 0.22, 0]} castShadow>
        <boxGeometry args={[0.92, 0.03, 0.4]} />
        <meshStandardMaterial color="#7090b8" emissive="#8bb0df" emissiveIntensity={0.13} roughness={0.22} metalness={0.24} />
      </mesh>
      <mesh position={[0, -0.02, 0]} castShadow>
        <boxGeometry args={[0.92, 0.03, 0.4]} />
        <meshStandardMaterial color="#5b7698" emissive="#7499c8" emissiveIntensity={0.1} roughness={0.24} metalness={0.24} />
      </mesh>
      <mesh position={[0, 0.08, 0.16]}>
        <boxGeometry args={[0.34, 0.12, 0.08]} />
        <meshStandardMaterial color="#d0e1f8" emissive="#90b6e5" emissiveIntensity={0.14} roughness={0.36} metalness={0.12} />
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
            <meshStandardMaterial color="#745f47" emissive="#8d7255" emissiveIntensity={0.07} roughness={0.58} metalness={0.04} />
          </mesh>
          <mesh position={[0, 0.09, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.36, 0.1, 0.36]} />
            <meshStandardMaterial color="#b9cce8" emissive="#90b3df" emissiveIntensity={0.1} roughness={0.42} metalness={0.12} />
          </mesh>
          <mesh position={[0.11, 0.16, -0.11]} castShadow receiveShadow>
            <boxGeometry args={[0.1, 0.06, 0.1]} />
            <meshStandardMaterial color="#d4e3f8" emissive="#9dbce2" emissiveIntensity={0.08} roughness={0.36} metalness={0.1} />
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

function Tile({
  tile,
  pallet,
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
  pallet?: PalletVisual;
  y: number;
  hover: boolean;
  active: boolean;
  previewCell?: GridCell | null;
  isDragging: boolean;
  onPointerDown?: (event: ThreeEvent<PointerEvent>) => void;
  onPointerOver?: (event: ThreeEvent<PointerEvent>) => void;
  onPointerOut?: (event: ThreeEvent<PointerEvent>) => void;
}) {
  const moverTone = MOVER_THEME[tile.kind];
  const [tex] = useState(() => labelTexture(moverTone.label, moverTone.tileStrip));
  const groupRef = useRef<THREE.Group | null>(null);
  const smooth = useRef(new THREE.Vector3());
  const fillRatio = clamp((pallet?.fillLevel ?? 100) / 100, 0, 1);
  const stackHeight = 0.05 + fillRatio * 0.34;
  const isEmpty = pallet?.isEmpty ?? false;
  const isReplenishing = pallet?.replenishing ?? false;
  const requested = pallet?.replenishmentRequested ?? false;

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
    const bobAmplitude = active ? 0.022 : hover ? 0.016 : 0.008;
    const bob = bobAmplitude * Math.sin(performance.now() * 0.003 + tile.cell.col * 0.5 + tile.cell.row * 0.34);
    groupRef.current.position.set(smooth.current.x, smooth.current.y + bob, smooth.current.z);
    groupRef.current.rotation.y = (active ? 0.03 : hover ? 0.018 : 0) * Math.sin(performance.now() * 0.0018 + tile.cell.col * 0.2);
  });

  return (
    <group ref={groupRef} onPointerDown={onPointerDown} onPointerOver={onPointerOver} onPointerOut={onPointerOut}>
      <group>
        <BeveledBlock
          size={[0.84, 0.08, 0.84]}
          radius={0.06}
          color="#6f5b47"
          emissive="#8a7157"
          emissiveIntensity={0.05 + (hover ? 0.06 : 0)}
          roughness={0.58}
          metalness={0.06}
          stripColor={moverTone.tileStrip}
          stripOpacity={hover ? 0.46 : 0.3}
        />
        <mesh position={[0, 0.075, 0]} castShadow>
          <boxGeometry args={[0.72, 0.03, 0.72]} />
          <meshStandardMaterial color={moverTone.tileColor} emissive={moverTone.tileEmissive} emissiveIntensity={0.12 + (active ? 0.05 : 0)} roughness={0.42} metalness={0.12} />
        </mesh>
        <mesh position={[0, 0.07 + stackHeight / 2, 0]} castShadow>
          <boxGeometry args={[0.6, stackHeight, 0.6]} />
          <meshStandardMaterial
            color={isEmpty ? '#2d3f57' : '#d7e7ff'}
            emissive={isReplenishing ? '#87b6ee' : requested ? '#d08f7a' : moverTone.tileEmissive}
            emissiveIntensity={(active ? 0.1 : 0.04) + (isReplenishing ? 0.16 : requested ? 0.08 : 0.04)}
            roughness={0.36}
            metalness={0.12}
          />
        </mesh>
        <mesh position={[0, 0.12 + stackHeight, 0]} castShadow>
          <boxGeometry args={[0.56, 0.02, 0.56]} />
          <meshStandardMaterial color="#bfd4f0" emissive={moverTone.tileStrip} emissiveIntensity={0.14 + fillRatio * 0.1} roughness={0.3} metalness={0.12} />
        </mesh>
        <mesh position={[0, 0.11 + stackHeight, 0]}>
          <boxGeometry args={[0.62, 0.008, 0.62]} />
          <meshStandardMaterial color="#edf4ff" emissive="#ffffff" emissiveIntensity={0.07} roughness={0.2} metalness={0.04} />
        </mesh>
        <mesh position={[0.22, 0.18 + stackHeight, -0.22]} castShadow>
          <boxGeometry args={[0.14, 0.12, 0.14]} />
          <meshStandardMaterial color={moverTone.tileColor} emissive={moverTone.tileStrip} emissiveIntensity={0.16} roughness={0.38} metalness={0.12} />
        </mesh>
        <mesh position={[0, 0.13 + stackHeight, 0.31]}>
          <boxGeometry args={[0.38, 0.014, 0.03]} />
          <meshStandardMaterial color={moverTone.tileStrip} emissive={moverTone.tileStrip} emissiveIntensity={0.24} transparent opacity={0.62} roughness={0.24} metalness={0.14} />
        </mesh>
        <mesh position={[0, 0.13 + stackHeight, -0.31]}>
          <boxGeometry args={[0.38, 0.014, 0.03]} />
          <meshStandardMaterial color={moverTone.tileStrip} emissive={moverTone.tileStrip} emissiveIntensity={0.22} transparent opacity={0.6} roughness={0.24} metalness={0.14} />
        </mesh>
        <mesh position={[-0.27, 0.07 + stackHeight, -0.27]} castShadow>
          <boxGeometry args={[0.16, Math.max(0.05, stackHeight * 0.82), 0.16]} />
          <meshStandardMaterial color="#e5efff" emissive="#8fb4e8" emissiveIntensity={0.1} roughness={0.33} metalness={0.12} />
        </mesh>
        <mesh position={[0.27, 0.07 + stackHeight, -0.27]} castShadow>
          <boxGeometry args={[0.16, Math.max(0.05, stackHeight * 0.72), 0.16]} />
          <meshStandardMaterial color="#deebff" emissive="#85afe6" emissiveIntensity={0.1} roughness={0.33} metalness={0.12} />
        </mesh>
        <mesh position={[0, 0.07 + stackHeight, 0.27]} castShadow>
          <boxGeometry args={[0.2, Math.max(0.05, stackHeight * 0.66), 0.16]} />
          <meshStandardMaterial color="#d4e4fb" emissive="#81a6db" emissiveIntensity={0.1} roughness={0.34} metalness={0.12} />
        </mesh>
        {requested ? (
          <mesh position={[0.31, 0.13, 0.31]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 0.03, 14]} />
            <meshStandardMaterial color={isReplenishing ? '#82b5f2' : '#d49b80'} emissive={isReplenishing ? '#6ea4e8' : '#c67e65'} emissiveIntensity={0.54} roughness={0.24} metalness={0.18} />
          </mesh>
        ) : null}
        <mesh position={[-0.31, 0.13, -0.31]}>
          <boxGeometry args={[0.18, 0.022, 0.1]} />
          <meshStandardMaterial color="#0f1a2a" emissive="#3f5f87" emissiveIntensity={0.28} roughness={0.24} metalness={0.2} />
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

function AgentOrb({ agent }: { agent: AgentVisual }) {
  const ref = useRef<THREE.Mesh | null>(null);
  const smooth = useRef(new THREE.Vector3());

  const target = useMemo(() => {
    const [x, y, z] = cellToWorld(agent.cell, 0.22);
    return new THREE.Vector3(x, y, z);
  }, [agent.cell]);

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
  });

  return (
    <mesh ref={ref} castShadow>
      <sphereGeometry args={[agent.role === 'picker' ? 0.16 : 0.14, 16, 16]} />
      <meshStandardMaterial
        color={agent.role === 'picker' ? '#7cb3ff' : '#b8d3ff'}
        emissive={agent.role === 'picker' ? '#5e95e7' : '#8db0e2'}
        emissiveIntensity={agent.role === 'picker' ? 0.46 : 0.32}
        roughness={0.3}
        metalness={0.2}
      />
    </mesh>
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
  onConsumeSpawnDragTile
}: ThreeSceneProps) {
  const { camera } = useThree();
  const [draggingTileId, setDraggingTileId] = useState<string | null>(null);
  const [previewCell, setPreviewCell] = useState<GridCell | null>(null);
  const [hoverTileId, setHoverTileId] = useState<string | null>(null);
  const [focusCell, setFocusCell] = useState<GridCell | null>(null);
  const [effectsEnabled, setEffectsEnabled] = useState(true);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const controlsLockedByDrag = canEdit && draggingTileId !== null;

  const floorTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d');

    if (!context) {
      return new THREE.CanvasTexture(canvas);
    }

    context.fillStyle = '#0d1725';
    context.fillRect(0, 0, 256, 256);
    context.strokeStyle = 'rgba(154, 188, 236, 0.08)';
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

    onCommitHumanTile(draggingTileId, cell);
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
    camera.position.set(17.2, 13.8, 17.2);
    const controls = controlsRef.current;
    if (controls) {
      controls.target.set(0, 0.24, 0);
      controls.update();
    }
  }, [camera]);

  return (
    <>
      <fog attach="fog" args={['#0a111b', 70, 165]} />
      <ambientLight intensity={0.24} color="#a8c0de" />
      <hemisphereLight intensity={0.56} color="#dcecff" groundColor="#0d1726" position={[0, 18, 0]} />
      <directionalLight
        castShadow
        position={[14.2, 18, 12.8]}
        intensity={1.02}
        color="#e1efff"
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={2}
        shadow-camera-far={62}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
        shadow-radius={4.6}
        shadow-bias={-0.00011}
      />
      <directionalLight
        position={[-15, 8.2, -12.5]}
        intensity={0.34}
        color="#9dbbe1"
      />

      <mesh position={[0, -0.11, 0]} receiveShadow>
        <boxGeometry args={[floorWidth + 0.9, 0.24, floorDepth + 0.9]} />
        <meshStandardMaterial color="#08101a" emissive="#0d1a2c" emissiveIntensity={0.03} roughness={0.92} metalness={0.06} />
      </mesh>

      <mesh position={[0, 0.01, 0]} receiveShadow>
        <boxGeometry args={[FACILITY_WIDTH, 0.075, FACILITY_DEPTH]} />
        <meshStandardMaterial color="#122033" emissive="#1c304a" emissiveIntensity={0.05} roughness={0.68} metalness={0.1} />
      </mesh>

      <mesh position={[0, 0.055, 0]} receiveShadow>
        <boxGeometry args={[FACILITY_WIDTH - 0.38, 0.03, FACILITY_DEPTH - 0.38]} />
        <meshStandardMaterial color="#1b2c43" emissive="#27425f" emissiveIntensity={0.05} roughness={0.6} metalness={0.1} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} receiveShadow>
        <planeGeometry args={[PICK_ZONE_WIDTH, PICK_ZONE_DEPTH]} />
        <meshStandardMaterial color="#0e1928" roughness={0.86} metalness={0.08} map={floorTexture} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} receiveShadow>
        <planeGeometry args={[FACILITY_WIDTH, FACILITY_DEPTH]} />
        <meshStandardMaterial color="#18293f" emissive="#223a57" emissiveIntensity={0.03} roughness={0.78} metalness={0.1} transparent opacity={0.12} depthWrite={false} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.051, 0]} receiveShadow>
        <planeGeometry args={[PICK_ZONE_WIDTH - 0.1, PICK_ZONE_DEPTH - 0.1]} />
        <meshStandardMaterial color="#122033" emissive="#223b5b" emissiveIntensity={0.03} roughness={0.8} metalness={0.08} transparent opacity={0.13} depthWrite={false} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.052, 0]} receiveShadow>
        <planeGeometry args={[FACILITY_WIDTH - 0.5, FACILITY_DEPTH - 0.5]} />
        <meshBasicMaterial color="#a1bee3" transparent opacity={0.012} depthWrite={false} />
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
          <boxGeometry args={[0.98, 0.016, 0.98]} />
          <meshStandardMaterial color="#a7c3ea" emissive="#88afe2" emissiveIntensity={0.26} transparent opacity={0.24} />
        </mesh>
      ) : null}

      {draggingTileId && previewCell ? (
        <mesh position={cellToWorld(sideClamp(previewCell), 0.09)}>
          <boxGeometry args={[0.92, 0.03, 0.92]} />
          <meshStandardMaterial
            color={occupancy.has(cellKey(sideClamp(previewCell))) || blockedHuman.has(cellKey(sideClamp(previewCell))) ? '#c56f6f' : '#7da7df'}
            emissive={occupancy.has(cellKey(sideClamp(previewCell))) || blockedHuman.has(cellKey(sideClamp(previewCell))) ? '#aa5d5d' : '#6f9bd8'}
            emissiveIntensity={0.46}
            transparent
            opacity={0.62}
          />
        </mesh>
      ) : null}

      <StationObject cell={humanStations.depot} title="Depot" accent="#6f9ed8" />
      <StationObject cell={humanStations.dropoff} title="Drop" accent="#79a5dd" />
      <StationObject cell={humanStations.packingTable} title="Packing" accent="#e69b63" />
      <StationObject cell={humanStations.machine} title="Machine" accent="#6d9add" />
      <StationObject cell={humanStations.outbound} title="Outbound" accent="#6f94c9" />
      <DockGroup docks={humanStations.docks} />
      <Conveyor from={humanStations.dropoff} to={humanStations.machine} />

      <StationObject cell={aiStations.depot} title="Depot" accent="#6f9ed8" />
      <StationObject cell={aiStations.dropoff} title="Drop" accent="#79a5dd" />
      <StationObject cell={aiStations.packingTable} title="Packing" accent="#e69b63" />
      <StationObject cell={aiStations.machine} title="Machine" accent="#6d9add" />
      <StationObject cell={aiStations.outbound} title="Outbound" accent="#6f94c9" />
      <DockGroup docks={aiStations.docks} />
      <Conveyor from={aiStations.dropoff} to={aiStations.machine} />

      {humanTiles.map((tile) => (
        <Tile
          key={tile.id}
          tile={tile}
          pallet={palletLookup.get(tile.id)}
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

      {[...visualState.humanBoxes, ...visualState.aiBoxes].map((box) => (
        <mesh key={box.id} position={cellToWorld(box.cell, 0.16)} castShadow receiveShadow>
          <boxGeometry args={[0.22, 0.22, 0.22]} />
          <meshStandardMaterial color="#d8e9ff" emissive="#89b0e8" emissiveIntensity={0.35} roughness={0.34} metalness={0.22} />
        </mesh>
      ))}

      {[...visualState.humanAgents, ...visualState.aiAgents].map((agent) => (
        <AgentOrb key={agent.id} agent={agent} />
      ))}

      {[...visualState.humanReachTrucks, ...visualState.aiReachTrucks].map((truck) => (
        <ReachTruck key={truck.id} truck={truck} />
      ))}

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enabled={!controlsLockedByDrag}
        enableRotate={false}
        enablePan={false}
        panSpeed={0.2}
        enableZoom={!controlsLockedByDrag}
        enableDamping
        dampingFactor={0.09}
        minDistance={21.2}
        maxDistance={27.4}
        minPolarAngle={0.96}
        maxPolarAngle={0.96}
        minAzimuthAngle={Math.PI / 4}
        maxAzimuthAngle={Math.PI / 4}
        target={[0, 0.24, 0]}
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
            <Bloom luminanceThreshold={0.28} luminanceSmoothing={0.72} intensity={0.18 + aiPulse * 0.55} />
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
          shadows
          camera={{ position: [17.2, 13.8, 17.2], fov: 34 }}
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
          <color attach="background" args={[ASCENTRA_THEME.color.neutral0]} />
          <SceneRig {...props} />
        </Canvas>
      </div>
    </ErrorBoundary>
  );
}
