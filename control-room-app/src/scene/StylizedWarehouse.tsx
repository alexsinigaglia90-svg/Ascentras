import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Operator } from './Operator';

const PALETTE = {
  mint: '#9ad7c8',
  teal: '#76bfb1',
  sand: '#e8d9c5',
  lavender: '#b8addf',
  coral: '#f1a28f',
  offWhite: '#f8f5ef',
  shadow: '#7d8ea3',
};

function FloatingParticles() {
  const pointsRef = useRef<THREE.Points>(null!);
  const positions = useMemo(() => {
    const arr = new Float32Array(180 * 3);
    for (let i = 0; i < 180; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 18;
      arr[i * 3 + 1] = Math.random() * 4.5 + 0.2;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }
    return arr;
  }, []);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y = clock.getElapsedTime() * 0.02;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#f7f3ff" size={0.04} transparent opacity={0.45} sizeAttenuation depthWrite={false} />
    </points>
  );
}

function StylizedPallet({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[0.66, 0.08, 0.5]} />
        <meshStandardMaterial color={PALETTE.sand} roughness={0.95} metalness={0.01} flatShading />
      </mesh>
      {[[-0.2, 0.09, -0.12], [0.2, 0.09, -0.12], [-0.2, 0.09, 0.12], [0.2, 0.09, 0.12]].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]} castShadow>
          <boxGeometry args={[0.18, 0.14, 0.18]} />
          <meshStandardMaterial color={i % 2 ? PALETTE.lavender : PALETTE.mint} roughness={0.95} metalness={0.01} flatShading />
        </mesh>
      ))}
    </group>
  );
}

export function StylizedWarehouse() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[22, 14]} />
        <meshStandardMaterial color={PALETTE.offWhite} roughness={1} metalness={0} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[3.5, 7.5, 48]} />
        <meshBasicMaterial color={PALETTE.shadow} transparent opacity={0.08} />
      </mesh>

      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[12, 0.04, 1.2]} />
        <meshStandardMaterial color={PALETTE.teal} roughness={0.95} metalness={0.02} flatShading />
      </mesh>
      <mesh position={[3.5, 0.02, 1.9]}>
        <boxGeometry args={[3.2, 0.04, 0.9]} />
        <meshStandardMaterial color={PALETTE.mint} roughness={0.95} metalness={0.02} flatShading />
      </mesh>

      <mesh position={[0, 0.36, 0]}>
        <boxGeometry args={[12, 0.06, 1.35]} />
        <meshStandardMaterial color="#d7e9e4" roughness={0.98} metalness={0.01} flatShading />
      </mesh>

      <mesh position={[-0.4, 0.42, -2.9]} castShadow>
        <boxGeometry args={[2.8, 0.2, 1.1]} />
        <meshStandardMaterial color={PALETTE.lavender} roughness={0.95} metalness={0.01} flatShading />
      </mesh>
      <mesh position={[1.1, 0.56, -2.9]} castShadow>
        <boxGeometry args={[0.9, 0.1, 0.7]} />
        <meshStandardMaterial color={PALETTE.offWhite} roughness={1} metalness={0} flatShading />
      </mesh>

      <StylizedPallet position={[-5.2, 0.05, -1.4]} />
      <StylizedPallet position={[-4.3, 0.05, -1.4]} />
      <StylizedPallet position={[6.2, 0.05, 2.4]} />
      <StylizedPallet position={[5.6, 0.05, 0.1]} />

      <group position={[3.1, 0, 0]}>
        <mesh position={[0, 0.39, 0.8]}>
          <boxGeometry args={[1.5, 0.12, 0.7]} />
          <meshStandardMaterial color={PALETTE.sand} roughness={0.95} metalness={0.01} flatShading />
        </mesh>
        <mesh position={[0, 0.39, -0.8]}>
          <boxGeometry args={[1.5, 0.12, 0.7]} />
          <meshStandardMaterial color={PALETTE.sand} roughness={0.95} metalness={0.01} flatShading />
        </mesh>
      </group>

      <Operator position={[3.1, 0, 1.3]} phase={0.3} robeColor="#b5a8e4" accentColor="#8fd4c7" />
      <Operator position={[3.3, 0, -1.25]} phase={2.2} robeColor="#9dcfe8" accentColor="#f2ab9a" />

      <mesh position={[-5.2, 0.12, -1.4]}>
        <sphereGeometry args={[0.16, 12, 12]} />
        <meshStandardMaterial color={PALETTE.coral} emissive={PALETTE.coral} emissiveIntensity={0.4} toneMapped={false} />
      </mesh>
      <mesh position={[6, 0.12, 2.4]}>
        <sphereGeometry args={[0.16, 12, 12]} />
        <meshStandardMaterial color={PALETTE.mint} emissive={PALETTE.mint} emissiveIntensity={0.35} toneMapped={false} />
      </mesh>

      <FloatingParticles />
    </group>
  );
}