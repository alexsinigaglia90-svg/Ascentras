import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface AMRProps {
  bodyColor: string;
  accentColor: string;
  ledColor: string;
  phase: number;
  runtime: AMRRuntime;
}

export interface AMRRuntime {
  x: number;
  y: number;
  z: number;
  rotY: number;
  waiting: boolean;
  moving: boolean;
}

export function AMR({
  bodyColor,
  accentColor,
  ledColor,
  phase,
  runtime,
}: AMRProps) {
  const rootRef = useRef<THREE.Group>(null!);
  const beaconRef = useRef<THREE.Mesh>(null!);
  const ledRingRef = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    if (!rootRef.current) return;
    const t = clock.getElapsedTime() + phase;

    const bob = Math.sin(t * 1.8) * 0.02;
    rootRef.current.position.y = runtime.y + 0.12 + bob;
    rootRef.current.position.x = runtime.x;
    rootRef.current.position.z = runtime.z;
    rootRef.current.rotation.y = runtime.rotY;

    if (beaconRef.current) {
      const mat = beaconRef.current.material as THREE.MeshStandardMaterial;
      const pulse = runtime.waiting ? 0.45 + Math.sin(t * 6) * 0.35 : 0.3 + Math.sin(t * 3) * 0.2;
      mat.emissiveIntensity = Math.max(0.1, pulse);
      mat.color.set(runtime.waiting ? '#ff9f7a' : ledColor);
      mat.emissive.set(runtime.waiting ? '#ff8f6a' : ledColor);
    }

    if (ledRingRef.current) {
      const ringMat = ledRingRef.current.material as THREE.MeshStandardMaterial;
      ringMat.emissiveIntensity = runtime.moving ? 0.9 : 0.45;
    }
  });

  return (
    <group ref={rootRef} position={[runtime.x, runtime.y, runtime.z]}>
      <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.42, 24]} />
        <meshBasicMaterial color={ledColor} transparent opacity={0.12} toneMapped={false} />
      </mesh>

      <mesh castShadow>
        <capsuleGeometry args={[0.2, 0.26, 8, 16]} />
        <meshStandardMaterial color={bodyColor} roughness={0.95} metalness={0.02} flatShading />
      </mesh>

      <mesh position={[0, 0.08, 0]} castShadow>
        <capsuleGeometry args={[0.15, 0.16, 6, 12]} />
        <meshStandardMaterial color={accentColor} roughness={0.95} metalness={0.02} flatShading />
      </mesh>

      <mesh ref={ledRingRef} position={[0, 0.09, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.17, 0.01, 8, 24]} />
        <meshStandardMaterial color={ledColor} emissive={ledColor} emissiveIntensity={0.7} toneMapped={false} roughness={0.6} />
      </mesh>

      <mesh position={[0.11, -0.01, 0.13]}>
        <sphereGeometry args={[0.04, 10, 10]} />
        <meshStandardMaterial color="#6f7d8f" roughness={0.9} metalness={0.02} flatShading />
      </mesh>
      <mesh position={[-0.11, -0.01, 0.13]}>
        <sphereGeometry args={[0.04, 10, 10]} />
        <meshStandardMaterial color="#6f7d8f" roughness={0.9} metalness={0.02} flatShading />
      </mesh>
      <mesh position={[0.11, -0.01, -0.13]}>
        <sphereGeometry args={[0.04, 10, 10]} />
        <meshStandardMaterial color="#6f7d8f" roughness={0.9} metalness={0.02} flatShading />
      </mesh>
      <mesh position={[-0.11, -0.01, -0.13]}>
        <sphereGeometry args={[0.04, 10, 10]} />
        <meshStandardMaterial color="#6f7d8f" roughness={0.9} metalness={0.02} flatShading />
      </mesh>

      <mesh ref={beaconRef} position={[0, 0.24, 0]}>
        <sphereGeometry args={[0.035, 12, 12]} />
        <meshStandardMaterial color={ledColor} emissive={ledColor} emissiveIntensity={0.35} toneMapped={false} />
      </mesh>
    </group>
  );
}