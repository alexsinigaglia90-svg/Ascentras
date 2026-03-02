import { useMemo } from 'react';
import * as THREE from 'three';
import * as M from '../materials/materialPresets';

/* ── Warning Decal / Label ──
 *  Flat rectangular plate that sits on a surface (e.g. machine enclosure).
 *  color = decal colour, text rendered as a simple filled shape.
 */
export function WarningLabel({ position, rotation = [0, 0, 0], width = 0.06, height = 0.04, color = '#ffc107' }: {
  position: [number, number, number];
  rotation?: [number, number, number];
  width?: number;
  height?: number;
  color?: string;
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* Backing plate */}
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.0} side={THREE.DoubleSide} />
      </mesh>
      {/* Border */}
      <mesh position={[0, 0, 0.001]}>
        <planeGeometry args={[width - 0.006, height - 0.006]} />
        <meshStandardMaterial color="#111" roughness={0.6} metalness={0.0} side={THREE.DoubleSide} />
      </mesh>
      {/* Inner warning triangle hint */}
      <mesh position={[0, 0, 0.002]}>
        <circleGeometry args={[Math.min(width, height) * 0.25, 3]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.0} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/* ── Nameplate ── 
 *  Engraved-look metal plate (serial number / model info).
 */
export function Nameplate({ position, rotation = [0, 0, 0], width = 0.06, height = 0.025, label = 'SN-2024' }: {
  position: [number, number, number];
  rotation?: [number, number, number];
  width?: number;
  height?: number;
  label?: string;
}) {
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <boxGeometry args={[width, height, 0.002]} />
        <meshPhysicalMaterial {...M.brushedAluminium} />
      </mesh>
      {/* Mounting holes */}
      {[[-width / 2 + 0.005, 0], [width / 2 - 0.005, 0]].map(([dx, dy], i) => (
        <mesh key={i} position={[dx, dy, 0.0015]}>
          <cylinderGeometry args={[0.002, 0.002, 0.003, 6]} />
          <meshPhysicalMaterial {...M.machinedSteel} />
        </mesh>
      ))}
    </group>
  );
}

/* ── Barcode Tag ──
 *  Small printed label with barcode stripe pattern.
 */
export function BarcodeTag({ position, rotation = [0, 0, 0], width = 0.04, height = 0.025 }: {
  position: [number, number, number];
  rotation?: [number, number, number];
  width?: number;
  height?: number;
}) {
  const barWidths = useMemo(
    () => Array.from({ length: 8 }, () => 0.001 + Math.random() * 0.0015),
    [],
  );
  return (
    <group position={position} rotation={rotation}>
      {/* White backing */}
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color="#f8f8f8" roughness={0.8} metalness={0.0} side={THREE.DoubleSide} />
      </mesh>
      {/* Barcode stripes */}
      {barWidths.map((bw, i) => {
        const x = -width / 2 + 0.005 + i * (width - 0.01) / 8;
        return (
          <mesh key={i} position={[x, -height * 0.1, 0.001]}>
            <planeGeometry args={[bw, height * 0.45]} />
            <meshStandardMaterial color="#111" roughness={0.9} metalness={0.0} side={THREE.DoubleSide} />
          </mesh>
        );
      })}
    </group>
  );
}

/* ── Zone Marker ──
 *  Floor-level hazard zone stripe (alternating yellow/black).
 */
export function ZoneMarker({ position, width = 1.0, depth = 0.06, stripes = 6 }: {
  position: [number, number, number];
  width?: number;
  depth?: number;
  stripes?: number;
}) {
  const sw = width / stripes;
  return (
    <group position={position}>
      {Array.from({ length: stripes }).map((_, i) => (
        <mesh key={i} position={[-width / 2 + sw * i + sw / 2, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[sw, depth]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? '#f5c518' : '#1a1a1a'}
            roughness={0.7}
            metalness={0.0}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}
