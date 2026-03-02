import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../state/store';

/** Curved cable using TubeGeometry */
function Cable({ points, radius = 0.008, color = '#1a1a1a' }: {
  points: [number, number, number][];
  radius?: number;
  color?: string;
}) {
  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(
      points.map(p => new THREE.Vector3(...p)),
      false,
      'catmullrom',
      0.5,
    );
    return new THREE.TubeGeometry(curve, 24, radius, 6, false);
  }, [points, radius]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color={color} roughness={0.85} />
    </mesh>
  );
}

/** PBR gantry Palletizer with micro-detail */
export function Palletizer() {
  const headRef = useRef<THREE.Mesh>(null!);
  const running = useStore(s => s.palletizerRunning);
  const pattern = useStore(s => s.palletizerPattern);
  const emergency = useStore(s => s.emergencyStop);

  useFrame(() => {
    if (!headRef.current) return;
    const time = performance.now() * 0.001;
    const active = running && !emergency;

    if (active) {
      if (pattern === 'A') {
        headRef.current.position.x = Math.sin(time * 2) * 0.4;
        headRef.current.position.z = Math.cos(time * 1.5) * 0.2;
      } else {
        headRef.current.rotation.y = time * 2;
        headRef.current.position.x = Math.cos(time * 1.8) * 0.3;
      }
      headRef.current.position.y = 1.4 + Math.sin(time * 3) * 0.15;
    }
  });

  return (
    <group position={[3.5, 0, 2.5]}>
      {/* ── Frame uprights ── */}
      {[[-0.6, 0, -0.4], [0.6, 0, -0.4], [-0.6, 0, 0.4], [0.6, 0, 0.4]].map(([x, _, z], i) => (
        <mesh key={i} position={[x, 0.85, z]} castShadow>
          <boxGeometry args={[0.06, 1.7, 0.06]} />
          <meshPhysicalMaterial color="#4a5060" roughness={0.4} metalness={0.6} clearcoat={0.1} clearcoatRoughness={0.6} />
        </mesh>
      ))}

      {/* ── Bracing diagonals ── */}
      {[
        { pos: [-0.6, 0.85, -0.4] as [number, number, number], rot: [0, 0, 0.3] as [number, number, number] },
        { pos: [0.6, 0.85, -0.4] as [number, number, number], rot: [0, 0, -0.3] as [number, number, number] },
      ].map(({ pos, rot }, i) => (
        <mesh key={`brace${i}`} position={pos} rotation={rot}>
          <boxGeometry args={[0.02, 0.6, 0.02]} />
          <meshPhysicalMaterial color="#5a6070" metalness={0.6} roughness={0.35} />
        </mesh>
      ))}

      {/* ── Top beam / gantry rail ── */}
      <mesh position={[0, 1.7, 0]} castShadow>
        <boxGeometry args={[1.3, 0.06, 0.9]} />
        <meshPhysicalMaterial color="#4a5060" roughness={0.4} metalness={0.6} clearcoat={0.1} clearcoatRoughness={0.6} />
      </mesh>
      {/* Rail tracks */}
      {[-0.3, 0.3].map(z => (
        <mesh key={`track${z}`} position={[0, 1.68, z]}>
          <boxGeometry args={[1.25, 0.015, 0.04]} />
          <meshPhysicalMaterial color="#7a7a80" metalness={0.8} roughness={0.15} />
        </mesh>
      ))}

      {/* ── Moving head ── */}
      <group>
        <mesh ref={headRef} position={[0, 1.4, 0]} castShadow>
          <boxGeometry args={[0.4, 0.06, 0.35]} />
          <meshPhysicalMaterial
            color="#c8a96e"
            roughness={0.3}
            metalness={0.55}
            clearcoat={0.3}
            clearcoatRoughness={0.3}
          />
        </mesh>
      </group>

      {/* ── Linear actuator (vertical) ── */}
      <mesh position={[0, 1.0, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.6, 6]} />
        <meshPhysicalMaterial color="#8a8a8a" metalness={0.85} roughness={0.15} />
      </mesh>

      {/* ── Output pallet ── */}
      <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.8, 0.1, 0.6]} />
        <meshPhysicalMaterial color="#6a5a40" roughness={0.85} metalness={0.02} />
      </mesh>
      {/* Pallet slats */}
      {[-0.2, 0, 0.2].map(z => (
        <mesh key={`slat${z}`} position={[0, 0.001, z]} rotation={[-Math.PI * 0.5, 0, 0]}>
          <planeGeometry args={[0.78, 0.08]} />
          <meshStandardMaterial color="#5a4a30" roughness={0.9} />
        </mesh>
      ))}

      {/* ── Stacked boxes ── */}
      {running && !emergency && [0, 0.22, 0.44].map((y, i) => (
        <mesh key={i} position={[(i % 2) * 0.2 - 0.1, 0.22 + y, 0]} castShadow>
          <boxGeometry args={[0.3, 0.2, 0.25]} />
          <meshPhysicalMaterial
            color={['#8a7a60', '#7a6a50', '#8a7060'][i]}
            roughness={0.75}
            metalness={0.05}
            clearcoat={0.03}
            clearcoatRoughness={0.9}
          />
        </mesh>
      ))}

      {/* ── Control panel ── */}
      <group position={[0.7, 1.0, 0.45]}>
        <mesh castShadow>
          <boxGeometry args={[0.15, 0.3, 0.08]} />
          <meshPhysicalMaterial color="#5a6068" roughness={0.5} metalness={0.5} />
        </mesh>
        {/* Small screen */}
        <mesh position={[0, 0.05, 0.041]}>
          <planeGeometry args={[0.1, 0.08]} />
          <meshPhysicalMaterial
            color="#0a1520"
            emissive={running ? '#2a5a3a' : '#1a1a2a'}
            emissiveIntensity={0.3}
            roughness={0.05}
            clearcoat={0.6}
            clearcoatRoughness={0.1}
          />
        </mesh>
        {/* Buttons */}
        {[-0.03, 0.03].map((x, i) => (
          <mesh key={i} position={[x, -0.08, 0.041]}>
            <cylinderGeometry args={[0.012, 0.012, 0.008, 8]} />
            <meshPhysicalMaterial
              color={i === 0 ? '#40a040' : '#c04040'}
              roughness={0.3}
              metalness={0.3}
              clearcoat={0.5}
              clearcoatRoughness={0.2}
            />
          </mesh>
        ))}
      </group>

      {/* ── Safety fence ── */}
      {[[-0.8, 0, -0.6], [0.8, 0, -0.6], [-0.8, 0, 0.6], [0.8, 0, 0.6]].map(([x, _, z], i) => (
        <mesh key={`fence${i}`} position={[x, 0.4, z]}>
          <boxGeometry args={[0.025, 0.8, 0.025]} />
          <meshPhysicalMaterial color="#c8a020" metalness={0.5} roughness={0.3} />
        </mesh>
      ))}

      {/* ── Status LED ── */}
      <mesh position={[0.65, 1.5, 0.42]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshBasicMaterial color={running && !emergency ? '#40ff40' : '#606060'} />
      </mesh>

      {/* ── Power cable run to floor (TubeGeometry) ── */}
      <Cable
        points={[[0.7, 0.85, 0.48], [0.75, 0.5, 0.55], [0.78, 0.15, 0.6], [0.8, 0.02, 0.65]]}
        radius={0.012}
        color="#2a2a2a"
      />
      {/* Signal cable from control panel */}
      <Cable
        points={[[0.7, 0.9, 0.5], [0.5, 1.2, 0.4], [0.2, 1.55, 0.3], [0, 1.68, 0.2]]}
        radius={0.006}
        color="#2a3a4a"
      />

      {/* ── Pneumatic valve block ── */}
      <group position={[-0.5, 0.1, 0.35]}>
        <mesh castShadow>
          <boxGeometry args={[0.12, 0.08, 0.06]} />
          <meshPhysicalMaterial color="#5a6068" roughness={0.4} metalness={0.6} />
        </mesh>
        {/* Fittings */}
        {[-0.03, 0.03].map((x, i) => (
          <mesh key={i} position={[x, 0.04, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 0.02, 6]} />
            <meshPhysicalMaterial color="#b0a040" metalness={0.7} roughness={0.2} />
          </mesh>
        ))}
      </group>

      {/* ── Warning labels ── */}
      <mesh position={[0.62, 0.5, -0.4]} rotation={[0, -Math.PI * 0.5, 0]}>
        <planeGeometry args={[0.12, 0.08]} />
        <meshStandardMaterial color="#c8a020" emissive="#c8a020" emissiveIntensity={0.04} roughness={0.5} />
      </mesh>
      {/* Additional warning — "AUTOMATED AREA" */}
      <mesh position={[-0.62, 0.3, -0.4]} rotation={[0, Math.PI * 0.5, 0]}>
        <planeGeometry args={[0.14, 0.06]} />
        <meshStandardMaterial color="#c04040" emissive="#c04040" emissiveIntensity={0.03} roughness={0.5} />
      </mesh>
    </group>
  );
}
