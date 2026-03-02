import { useMemo } from 'react';
import * as THREE from 'three';
import * as M from '../materials/materialPresets';

/* ── Cable Tray / Raceway ──
 *  Horizontal U-channel tray for routing cables above machines.
 */
export function CableTray({ from, to, width = 0.08, depth = 0.04 }: {
  from: [number, number, number];
  to: [number, number, number];
  width?: number;
  depth?: number;
}) {
  const [x1, y1, z1] = from;
  const [x2, y2, z2] = to;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const mz = (z1 + z2) / 2;
  const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2 + (z2 - z1) ** 2);
  const dir = new THREE.Vector3(x2 - x1, y2 - y1, z2 - z1).normalize();
  const quat = useMemo(() => {
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
    return q;
  }, [dir.x, dir.y, dir.z]);

  return (
    <group position={[mx, my, mz]} quaternion={quat}>
      {/* Bottom */}
      <mesh receiveShadow>
        <boxGeometry args={[width, 0.003, len]} />
        <meshPhysicalMaterial {...M.paintedSteel} />
      </mesh>
      {/* Left wall */}
      <mesh position={[-width / 2, depth / 2, 0]}>
        <boxGeometry args={[0.003, depth, len]} />
        <meshPhysicalMaterial {...M.paintedSteel} />
      </mesh>
      {/* Right wall */}
      <mesh position={[width / 2, depth / 2, 0]}>
        <boxGeometry args={[0.003, depth, len]} />
        <meshPhysicalMaterial {...M.paintedSteel} />
      </mesh>
    </group>
  );
}

/* ── Drag Chain ──
 *  Animated energy chain (cable carrier) for machine axes.
 *  Rendered as a series of small link segments.
 */
export function DragChain({ from, to, segmentCount = 12, width = 0.03 }: {
  from: [number, number, number];
  to: [number, number, number];
  segmentCount?: number;
  width?: number;
}) {
  const [x1, y1, z1] = from;
  const [x2, y2, z2] = to;

  const links = useMemo(() => {
    const arr: [number, number, number][] = [];
    for (let i = 0; i < segmentCount; i++) {
      const t = i / (segmentCount - 1);
      // Catenary-like droop
      const droop = -Math.sin(t * Math.PI) * 0.06;
      arr.push([
        x1 + (x2 - x1) * t,
        y1 + (y2 - y1) * t + droop,
        z1 + (z2 - z1) * t,
      ]);
    }
    return arr;
  }, [x1, y1, z1, x2, y2, z2, segmentCount]);

  return (
    <group>
      {links.map((pos, i) => (
        <mesh key={i} position={pos} castShadow>
          <boxGeometry args={[width, 0.015, 0.018]} />
          <meshPhysicalMaterial {...M.blackPlastic} />
        </mesh>
      ))}
    </group>
  );
}

/* ── Conduit Bundle ──
 *  Multiple parallel conduit runs (using simple cylinders).
 */
export function ConduitBundle({ from, to, count = 3, spacing = 0.02 }: {
  from: [number, number, number];
  to: [number, number, number];
  count?: number;
  spacing?: number;
}) {
  const [x1, y1, z1] = from;
  const [x2, y2, z2] = to;
  const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2 + (z2 - z1) ** 2);
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const mz = (z1 + z2) / 2;
  const dir = new THREE.Vector3(x2 - x1, y2 - y1, z2 - z1).normalize();
  const quat = useMemo(() => {
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    return q;
  }, [dir.x, dir.y, dir.z]);

  const offset = ((count - 1) * spacing) / 2;
  return (
    <group position={[mx, my, mz]} quaternion={quat}>
      {Array.from({ length: count }).map((_, i) => (
        <mesh key={i} position={[(i * spacing) - offset, 0, 0]}>
          <cylinderGeometry args={[0.006, 0.006, len, 6]} />
          <meshPhysicalMaterial {...M.greyPVC} />
        </mesh>
      ))}
    </group>
  );
}
