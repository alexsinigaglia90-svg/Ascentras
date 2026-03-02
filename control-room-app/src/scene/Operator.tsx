import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface OperatorProps {
  position: [number, number, number];
  robeColor?: string;
  accentColor?: string;
  phase?: number;
}

export function Operator({
  position,
  robeColor = '#a79ad8',
  accentColor = '#9ad7c8',
  phase = 0,
}: OperatorProps) {
  const rootRef = useRef<THREE.Group>(null!);
  const bodyRef = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    if (!rootRef.current || !bodyRef.current) return;
    const t = clock.getElapsedTime() + phase;
    const breathe = Math.sin(t * 1.5) * 0.018;
    rootRef.current.position.y = position[1] + breathe;
    bodyRef.current.scale.y = 1 + Math.sin(t * 1.5) * 0.02;
  });

  return (
    <group ref={rootRef} position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.22, 20]} />
        <meshBasicMaterial color="#7c8da1" transparent opacity={0.2} />
      </mesh>

      <mesh ref={bodyRef} position={[0, 0.42, 0]} castShadow>
        <capsuleGeometry args={[0.11, 0.38, 8, 14]} />
        <meshStandardMaterial color={robeColor} roughness={0.95} metalness={0.01} flatShading />
      </mesh>

      <mesh position={[0, 0.67, 0]} castShadow>
        <sphereGeometry args={[0.09, 14, 14]} />
        <meshStandardMaterial color="#f3ddc9" roughness={0.95} metalness={0.01} flatShading />
      </mesh>

      <mesh position={[-0.03, 0.68, 0.08]}>
        <sphereGeometry args={[0.008, 8, 8]} />
        <meshStandardMaterial color="#2f3742" roughness={1} metalness={0} />
      </mesh>
      <mesh position={[0.03, 0.68, 0.08]}>
        <sphereGeometry args={[0.008, 8, 8]} />
        <meshStandardMaterial color="#2f3742" roughness={1} metalness={0} />
      </mesh>

      <mesh position={[0, 0.45, 0.1]}>
        <boxGeometry args={[0.12, 0.02, 0.03]} />
        <meshStandardMaterial color={accentColor} roughness={0.95} metalness={0.01} flatShading />
      </mesh>
    </group>
  );
}