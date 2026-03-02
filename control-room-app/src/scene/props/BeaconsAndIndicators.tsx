import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import * as M from '../materials/materialPresets';

/* ── Safety Beacon ──
 *  Rotating amber/red beacon with pulsing emissive light.
 */
export function SafetyBeacon({ position, color = '#ff8800', speed = 2.0 }: {
  position: [number, number, number];
  color?: string;
  speed?: number;
}) {
  const lensRef = useRef<THREE.Mesh>(null!);
  const lightRef = useRef<THREE.PointLight>(null!);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const pulse = (Math.sin(t * speed * Math.PI * 2) + 1) * 0.5;
    if (lensRef.current) {
      (lensRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.3 + pulse * 1.2;
    }
    if (lightRef.current) {
      lightRef.current.intensity = pulse * 0.8;
    }
  });

  return (
    <group position={position}>
      {/* Base cup */}
      <mesh castShadow>
        <cylinderGeometry args={[0.022, 0.025, 0.02, 8]} />
        <meshPhysicalMaterial {...M.blackPlastic} />
      </mesh>
      {/* Lens dome */}
      <mesh ref={lensRef} position={[0, 0.025, 0]}>
        <sphereGeometry args={[0.02, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.8}
          transparent
          opacity={0.85}
          roughness={0.2}
        />
      </mesh>
      <pointLight ref={lightRef} position={[0, 0.04, 0]} color={color} intensity={0.5} distance={0.6} decay={2} />
    </group>
  );
}

/* ── Status LED ──
 *  Small indicator dot that glows a given colour.
 */
export function StatusLED({ position, color = '#00ff44', on = true, size = 0.005 }: {
  position: [number, number, number];
  color?: string;
  on?: boolean;
  size?: number;
}) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[size, 6, 6]} />
      <meshStandardMaterial
        color={on ? color : '#333'}
        emissive={on ? color : '#000'}
        emissiveIntensity={on ? 1.2 : 0}
        roughness={0.3}
      />
    </mesh>
  );
}

/* ── Light Stack / Signal Tower ──
 *  3-element (red/amber/green) andon-style light stack.
 *  `activeIndex` lights up one layer; -1 = all off.
 */
export function LightStack({ position, activeIndex = 1, rotation = [0, 0, 0] }: {
  position: [number, number, number];
  activeIndex?: number;         // 0=red, 1=amber, 2=green
  rotation?: [number, number, number];
}) {
  const colors = ['#ff2020', '#ff8800', '#00cc44'];
  const labels = ['red', 'amber', 'green'];
  return (
    <group position={position} rotation={rotation}>
      {/* Mounting post */}
      <mesh>
        <cylinderGeometry args={[0.008, 0.008, 0.12, 6]} />
        <meshPhysicalMaterial {...M.machinedSteel} />
      </mesh>
      {/* Light layers */}
      {colors.map((c, i) => {
        const y = 0.07 + i * 0.035;
        const isOn = i === activeIndex;
        return (
          <mesh key={labels[i]} position={[0, y, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.028, 8]} />
            <meshStandardMaterial
              color={isOn ? c : '#333'}
              emissive={isOn ? c : '#000'}
              emissiveIntensity={isOn ? 1.5 : 0}
              transparent
              opacity={0.9}
              roughness={0.3}
            />
          </mesh>
        );
      })}
    </group>
  );
}

/* ── Light Curtain ──
 *  Vertical safety light curtain (two pillars with emissive beam).
 */
export function LightCurtain({ position, rotation = [0, 0, 0], height = 0.8, gap = 0.6 }: {
  position: [number, number, number];
  rotation?: [number, number, number];
  height?: number;
  gap?: number;
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* Left pillar */}
      <mesh position={[-gap / 2, height / 2, 0]} castShadow>
        <boxGeometry args={[0.025, height, 0.025]} />
        <meshPhysicalMaterial {...M.safetyYellow} />
      </mesh>
      {/* Right pillar */}
      <mesh position={[gap / 2, height / 2, 0]} castShadow>
        <boxGeometry args={[0.025, height, 0.025]} />
        <meshPhysicalMaterial {...M.safetyYellow} />
      </mesh>
      {/* Beam zone (subtle glow) */}
      <mesh position={[0, height / 2, 0]}>
        <planeGeometry args={[gap - 0.03, height - 0.04]} />
        <meshStandardMaterial
          color="#ff3300"
          emissive="#ff3300"
          emissiveIntensity={0.15}
          transparent
          opacity={0.04}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
