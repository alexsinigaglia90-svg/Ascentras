import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../state/store';

/** Atmospheric floating particles with depth-aware sizing */
export function DustParticles({ count = 300 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null!);
  const performanceMode = useStore(s => s.performanceMode);
  const particleCount = performanceMode ? Math.floor(count / 4) : count;

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 15;
      positions[i * 3 + 1] = Math.random() * 4.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 11;
      sizes[i] = 0.008 + Math.random() * 0.015;
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    return geo;
  }, [particleCount]);

  useFrame(() => {
    if (!ref.current) return;
    const pos = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    const time = performance.now() * 0.0001;
    for (let i = 0; i < particleCount; i++) {
      const ix = i * 3;
      arr[ix + 1] += Math.sin(time + i * 0.1) * 0.0004;
      arr[ix] += Math.cos(time * 0.7 + i * 0.2) * 0.00015;
      arr[ix + 2] += Math.sin(time * 0.5 + i * 0.15) * 0.0001;
      if (arr[ix + 1] > 4.5) arr[ix + 1] = 0;
      if (arr[ix + 1] < 0) arr[ix + 1] = 4.5;
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        color="#d0c8b8"
        size={0.018}
        transparent
        opacity={0.3}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
