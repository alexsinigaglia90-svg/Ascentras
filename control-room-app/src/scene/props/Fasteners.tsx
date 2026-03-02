import { useMemo } from 'react';
import * as THREE from 'three';
import * as M from '../materials/materialPresets';

/** ── Instanced hex-head bolts ──
 *  Supply an array of [x,y,z] world positions.
 *  Renders all bolts with a single InstancedMesh draw call.
 */
export function Fasteners({ positions, radius = 0.012, height = 0.016, scale = 1 }: {
  positions: [number, number, number][];
  radius?: number;
  height?: number;
  scale?: number;
}) {
  const count = positions.length;
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const mesh = useMemo(() => {
    const r = radius * scale;
    const h = height * scale;
    const geo = new THREE.CylinderGeometry(r, r, h, 6);
    const mat = new THREE.MeshPhysicalMaterial({ ...M.machinedSteel });
    const im = new THREE.InstancedMesh(geo, mat, count);
    positions.forEach(([x, y, z], i) => {
      dummy.position.set(x, y, z);
      dummy.updateMatrix();
      im.setMatrixAt(i, dummy.matrix);
    });
    im.instanceMatrix.needsUpdate = true;
    return im;
  }, [positions, radius, height, count, dummy]);

  return <primitive object={mesh} />;
}

/** Single decorative hex bolt (non-instanced, for small clusters) */
export function Bolt({ position, r = 0.012, h = 0.016 }: {
  position: [number, number, number];
  r?: number;
  h?: number;
}) {
  return (
    <mesh position={position}>
      <cylinderGeometry args={[r, r, h, 6]} />
      <meshPhysicalMaterial {...M.machinedSteel} />
    </mesh>
  );
}
