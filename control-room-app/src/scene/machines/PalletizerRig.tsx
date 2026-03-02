import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../state/store';
import { Cable } from '../props/Cable';

/** ────────────────────────────────────────────────────
 *  Palletizer Rig — gantry frame with linear rails,
 *  moving head, vertical actuator, output pallet,
 *  control panel, safety fence, pneumatic block, cables.
 *  Added: rail carriages, drag chain, inspection window,
 *  air regulator unit, extra bracing.
 *  ──────────────────────────────────────────────────── */
export function PalletizerRig() {
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

  const uprightPositions: [number, number, number][] = [
    [-0.6, 0.85, -0.4], [0.6, 0.85, -0.4],
    [-0.6, 0.85, 0.4], [0.6, 0.85, 0.4],
  ];

  return (
    <group position={[3.5, 0, 2.5]}>
      {/* ── Frame uprights ── */}
      {uprightPositions.map(([x, y, z], i) => (
        <group key={i}>
          <mesh position={[x, y, z]} castShadow>
            <boxGeometry args={[0.06, 1.7, 0.06]} />
            <meshPhysicalMaterial color="#4a5060" roughness={0.4} metalness={0.6} clearcoat={0.1} clearcoatRoughness={0.6} />
          </mesh>
          {/* Foot plate */}
          <mesh position={[x, 0.005, z]} receiveShadow>
            <boxGeometry args={[0.12, 0.01, 0.12]} />
            <meshPhysicalMaterial color="#4a4a50" metalness={0.6} roughness={0.5} />
          </mesh>
          {/* Anchor bolts */}
          {[[-0.04, 0, -0.04], [0.04, 0, -0.04], [-0.04, 0, 0.04], [0.04, 0, 0.04]].map(([bx, , bz], bi) => (
            <mesh key={`bolt${i}_${bi}`} position={[x + bx, 0.015, z + bz]}>
              <cylinderGeometry args={[0.006, 0.006, 0.01, 6]} />
              <meshPhysicalMaterial color="#7a7a7a" metalness={0.9} roughness={0.15} />
            </mesh>
          ))}
        </group>
      ))}

      {/* ── Diagonal bracing ── */}
      {[
        { pos: [-0.6, 0.85, -0.4] as [number, number, number], rot: [0, 0, 0.3] as [number, number, number] },
        { pos: [0.6, 0.85, -0.4] as [number, number, number], rot: [0, 0, -0.3] as [number, number, number] },
        { pos: [-0.6, 0.85, 0.4] as [number, number, number], rot: [0, 0, 0.25] as [number, number, number] },
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

      {/* ── Rail tracks with bearings ── */}
      {[-0.3, 0.3].map(z => (
        <group key={`track${z}`}>
          <mesh position={[0, 1.68, z]}>
            <boxGeometry args={[1.25, 0.015, 0.04]} />
            <meshPhysicalMaterial color="#7a7a80" metalness={0.8} roughness={0.15} />
          </mesh>
          {/* Rail bearing blocks */}
          {[-0.4, 0, 0.4].map((x, i) => (
            <mesh key={i} position={[x, 1.665, z]}>
              <boxGeometry args={[0.06, 0.02, 0.06]} />
              <meshPhysicalMaterial color="#5a5a60" metalness={0.7} roughness={0.3} />
            </mesh>
          ))}
        </group>
      ))}

      {/* ── Moving head ── */}
      <mesh ref={headRef} position={[0, 1.4, 0]} castShadow>
        <boxGeometry args={[0.4, 0.06, 0.35]} />
        <meshPhysicalMaterial color="#c8a96e" roughness={0.3} metalness={0.55} clearcoat={0.3} clearcoatRoughness={0.3} />
      </mesh>

      {/* ── Linear actuator (vertical) ── */}
      <mesh position={[0, 1.0, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.6, 6]} />
        <meshPhysicalMaterial color="#8a8a8a" metalness={0.85} roughness={0.15} />
      </mesh>
      {/* Actuator guide rail */}
      <mesh position={[0.03, 1.0, 0]}>
        <boxGeometry args={[0.008, 0.55, 0.008]} />
        <meshPhysicalMaterial color="#6a6a70" metalness={0.75} roughness={0.2} />
      </mesh>

      {/* ── Drag chain (energy chain) ── */}
      <Cable
        points={[[0.5, 1.7, 0.35], [0.3, 1.65, 0.35], [0.1, 1.55, 0.35], [0, 1.45, 0.3]]}
        radius={0.012}
        color="#2a2a2a"
      />

      {/* ── Output pallet ── */}
      <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.8, 0.1, 0.6]} />
        <meshPhysicalMaterial color="#6a5a40" roughness={0.85} metalness={0.02} />
      </mesh>
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
        {/* Panel nameplate */}
        <mesh position={[0, 0.12, 0.041]}>
          <planeGeometry args={[0.06, 0.015]} />
          <meshStandardMaterial color="#e0e0d8" metalness={0.5} roughness={0.3} />
        </mesh>
      </group>

      {/* ── Safety fence ── */}
      {[[-0.8, 0, -0.6], [0.8, 0, -0.6], [-0.8, 0, 0.6], [0.8, 0, 0.6]].map(([x, , z], i) => (
        <group key={`fence${i}`}>
          <mesh position={[x, 0.4, z]}>
            <boxGeometry args={[0.025, 0.8, 0.025]} />
            <meshPhysicalMaterial color="#c8a020" metalness={0.5} roughness={0.3} />
          </mesh>
          <mesh position={[x, 0.81, z]}>
            <sphereGeometry args={[0.016, 6, 6]} />
            <meshPhysicalMaterial color="#d0a828" metalness={0.4} roughness={0.3} />
          </mesh>
        </group>
      ))}
      {/* Fence horizontal rails */}
      <mesh position={[0, 0.55, -0.6]}>
        <boxGeometry args={[1.58, 0.015, 0.015]} />
        <meshPhysicalMaterial color="#c8a020" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.25, -0.6]}>
        <boxGeometry args={[1.58, 0.015, 0.015]} />
        <meshPhysicalMaterial color="#c8a020" metalness={0.5} roughness={0.3} />
      </mesh>

      {/* ── Status LED ── */}
      <mesh position={[0.65, 1.5, 0.42]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshBasicMaterial color={running && !emergency ? '#40ff40' : '#606060'} />
      </mesh>

      {/* ── Cable runs ── */}
      <Cable
        points={[[0.7, 0.85, 0.48], [0.75, 0.5, 0.55], [0.78, 0.15, 0.6], [0.8, 0.02, 0.65]]}
        radius={0.012}
        color="#2a2a2a"
      />
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
        {[-0.03, 0, 0.03].map((x, i) => (
          <mesh key={i} position={[x, 0.04, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 0.02, 6]} />
            <meshPhysicalMaterial color="#b0a040" metalness={0.7} roughness={0.2} />
          </mesh>
        ))}
      </group>

      {/* ── Air filter / regulator unit ── */}
      <group position={[-0.5, 0.25, 0.35]}>
        <mesh>
          <cylinderGeometry args={[0.02, 0.02, 0.1, 8]} />
          <meshPhysicalMaterial color="#5a6068" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0, -0.06, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.02, 8]} />
          <meshPhysicalMaterial color="#90a0b0" metalness={0.3} roughness={0.5} />
        </mesh>
      </group>

      {/* ── Warning labels ── */}
      <mesh position={[0.62, 0.5, -0.4]} rotation={[0, -Math.PI * 0.5, 0]}>
        <planeGeometry args={[0.12, 0.08]} />
        <meshStandardMaterial color="#c8a020" emissive="#c8a020" emissiveIntensity={0.04} roughness={0.5} />
      </mesh>
      <mesh position={[-0.62, 0.3, -0.4]} rotation={[0, Math.PI * 0.5, 0]}>
        <planeGeometry args={[0.14, 0.06]} />
        <meshStandardMaterial color="#c04040" emissive="#c04040" emissiveIntensity={0.03} roughness={0.5} />
      </mesh>
    </group>
  );
}
