import { useEffect, useMemo, useRef } from 'react';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';
import type { Metrics, AutomationLevel } from '../hooks/useSimulationModel';

type ThreeSceneProps = {
  metrics: Metrics;
  automationLevel: AutomationLevel;
  botPulseKey: number;
};

function SceneRig({ metrics, automationLevel, botPulseKey }: ThreeSceneProps) {
  const zoneMaterials = useRef<THREE.MeshStandardMaterial[]>([]);
  const conveyorMaterials = useRef<THREE.MeshStandardMaterial[]>([]);
  const particleRefs = useRef<Array<THREE.Mesh | null>>([]);
  const pulse = useRef(0);
  const flowOffset = useRef(0);
  const { camera } = useThree();
  const cameraTarget = useRef(new THREE.Vector3(20, 14, 20));

  const paths = useMemo(
    () => [
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-13, -0.15, -8),
        new THREE.Vector3(-7, -0.12, -2),
        new THREE.Vector3(-1, -0.08, -4),
        new THREE.Vector3(6, -0.1, 2),
        new THREE.Vector3(13, -0.14, 8)
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-11, -0.15, 10),
        new THREE.Vector3(-4, -0.1, 6),
        new THREE.Vector3(3, -0.08, 8),
        new THREE.Vector3(12, -0.14, 4)
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-10, -0.13, -12),
        new THREE.Vector3(-2, -0.1, -7),
        new THREE.Vector3(8, -0.09, -10),
        new THREE.Vector3(14, -0.11, -6)
      ])
    ],
    []
  );

  useEffect(() => {
    pulse.current = 1;
    cameraTarget.current.set(21, 14.6, 19.2);
  }, [botPulseKey]);

  useFrame((state, delta) => {
    const flowSpeed = 0.05 + (metrics.throughput / 100) * 0.22;
    const glow = 0.14 + (metrics.congestionRisk / 100) * 0.55;

    const automationFactor =
      automationLevel === 'Labour Driven' ? 0.36 :
      automationLevel === 'Selective Automation' ? 0.7 :
      1;

    conveyorMaterials.current.forEach((material, index) => {
      const visibleFactor = index === 2 ? Math.max(0, (automationFactor - 0.55) * 2.2) : automationFactor;
      material.emissiveIntensity = 0.18 + visibleFactor * 0.72;
      material.opacity = 0.35 + visibleFactor * 0.65;
      material.transparent = true;
    });

    zoneMaterials.current.forEach((material, index) => {
      const pulseTerm = 0.08 * Math.sin(state.clock.elapsedTime * 2.2 + index * 0.8);
      material.emissiveIntensity = glow + pulseTerm + pulse.current * 0.6;
    });

    flowOffset.current += delta * flowSpeed;
    particleRefs.current.forEach((mesh, index) => {
      if (!mesh) return;
      const curve = paths[index % paths.length];
      const t = (flowOffset.current + index / particleRefs.current.length) % 1;
      const pos = curve.getPointAt(t);
      mesh.position.set(pos.x, pos.y, pos.z);
    });

    if (pulse.current > 0) {
      pulse.current = Math.max(0, pulse.current - delta * 1.6);
    } else {
      cameraTarget.current.set(20, 14, 20);
    }

    const targetLook = new THREE.Vector3(0, -0.1, 0);
    camera.position.lerp(cameraTarget.current, 0.03);
    camera.lookAt(targetLook);
  });

  return (
    <>
      <fog attach="fog" args={['#060b12', 22, 70]} />
      <ambientLight intensity={0.45} color="#9eb7df" />
      <directionalLight position={[12, 20, 8]} intensity={1.15} color="#dce8ff" />
      <directionalLight position={[-14, 10, -12]} intensity={0.7} color="#5e89c7" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.8, 0]} receiveShadow>
        <planeGeometry args={[90, 90]} />
        <meshStandardMaterial color="#0d141f" roughness={0.95} metalness={0.08} />
      </mesh>

      {[
        { pos: [-10, -0.45, -3], size: [7, 0.7, 7] },
        { pos: [0, -0.45, -6], size: [8, 0.75, 5] },
        { pos: [10, -0.45, -1], size: [6, 0.72, 8] }
      ].map((zone, idx) => (
        <mesh key={idx} position={zone.pos as [number, number, number]}>
          <boxGeometry args={zone.size as [number, number, number]} />
          <meshStandardMaterial
            ref={(mat) => {
              if (mat) zoneMaterials.current[idx] = mat;
            }}
            color="#162537"
            emissive="#4f7dc8"
            emissiveIntensity={0.22}
            roughness={0.62}
            metalness={0.28}
          />
        </mesh>
      ))}

      {paths.map((curve, idx) => (
        <mesh key={`tube-${idx}`}>
          <tubeGeometry args={[curve, 90, 0.13, 8, false]} />
          <meshStandardMaterial
            ref={(mat) => {
              if (mat) conveyorMaterials.current[idx] = mat;
            }}
            color="#355884"
            emissive="#74a5e3"
            emissiveIntensity={0.48}
            roughness={0.35}
            metalness={0.72}
          />
        </mesh>
      ))}

      {new Array(54).fill(0).map((_, idx) => (
        <mesh
          key={`particle-${idx}`}
          ref={(mesh) => {
            particleRefs.current[idx] = mesh;
          }}
        >
          <sphereGeometry args={[0.075, 10, 10]} />
          <meshBasicMaterial color="#a7d0ff" />
        </mesh>
      ))}

      <Environment preset="city" />
      <EffectComposer>
        <Bloom luminanceThreshold={0.15} luminanceSmoothing={0.6} intensity={0.45} />
        <Vignette eskil offset={0.18} darkness={0.9} />
      </EffectComposer>
    </>
  );
}

export function ThreeScene(props: ThreeSceneProps) {
  return (
    <div className="fixed inset-0 z-0">
      <Canvas camera={{ position: [20, 14, 20], fov: 45 }} gl={{ antialias: true }}>
        <color attach="background" args={['#060b12']} />
        <SceneRig {...props} />
      </Canvas>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_18%,rgba(107,145,206,0.16),transparent_44%),radial-gradient(circle_at_85%_80%,rgba(117,146,199,0.12),transparent_46%),linear-gradient(180deg,rgba(6,10,18,0.26),rgba(6,10,18,0.74))]" />
    </div>
  );
}
