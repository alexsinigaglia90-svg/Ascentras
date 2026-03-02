import { useMemo } from 'react';
import * as THREE from 'three';

/**
 * Reusable curved cable/conduit using TubeGeometry + CatmullRomCurve3.
 * Used across all machines and environment for realistic wiring.
 */
export function Cable({ points, radius = 0.008, color = '#1a1a1a', metalness = 0, roughness = 0.85 }: {
  points: [number, number, number][];
  radius?: number;
  color?: string;
  metalness?: number;
  roughness?: number;
}) {
  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(
      points.map(p => new THREE.Vector3(...p)),
      false,
      'catmullrom',
      0.5,
    );
    return new THREE.TubeGeometry(curve, Math.max(16, points.length * 8), radius, 6, false);
  }, [points, radius]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
    </mesh>
  );
}

/** Metal conduit variant — higher metalness */
export function Conduit({ points, radius = 0.025, color = '#5a6068' }: {
  points: [number, number, number][];
  radius?: number;
  color?: string;
}) {
  return <Cable points={points} radius={radius} color={color} metalness={0.5} roughness={0.4} />;
}
