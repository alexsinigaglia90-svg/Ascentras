import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../state/store';
import { Cable } from '../props/Cable';

/** ────────────────────────────────────────────────────
 *  Depalletizer Rig — 6-DOF robot arm with PBR joints,
 *  suction-cup end effector, hydraulic cylinder, pallet
 *  stack, safety fence, control cabinet, cable runs.
 *  Added: wrist rotation joint, extra mounting bolts,
 *  floor anchor plate, air-hose, beacon lamp.
 *  ──────────────────────────────────────────────────── */
export function DepalletizerRig() {
  const armRef = useRef<THREE.Group>(null!);
  const clawRef = useRef<THREE.Mesh>(null!);
  const beaconRef = useRef<THREE.Mesh>(null!);
  const running = useStore(s => s.depalletizerRunning);
  const speed = useStore(s => s.depalletizerSpeed);
  const fault = useStore(s => s.depalletizerFault);
  const emergency = useStore(s => s.emergencyStop);

  useFrame(() => {
    if (!armRef.current || !clawRef.current) return;
    const time = performance.now() * 0.001;
    const active = running && !fault && !emergency;
    const spd = (speed / 100) * (active ? 1 : 0);

    armRef.current.rotation.y = active
      ? Math.sin(time * spd * 2) * 0.6
      : armRef.current.rotation.y * 0.95;

    clawRef.current.position.y = active
      ? 1.2 + Math.sin(time * spd * 3) * 0.3
      : clawRef.current.position.y;

    if (fault) {
      armRef.current.rotation.z = Math.sin(time * 15) * 0.03;
    } else {
      armRef.current.rotation.z = 0;
    }

    // Beacon strobe
    if (beaconRef.current) {
      const mat = beaconRef.current.material as THREE.MeshBasicMaterial;
      if (fault) {
        mat.color.set(Math.sin(time * 8) > 0 ? '#ff2020' : '#400000');
      } else if (active) {
        mat.color.set('#30c030');
      } else {
        mat.color.set('#404040');
      }
    }
  });

  return (
    <group position={[-3.5, 0, -1.5]}>
      {/* ── Floor anchor plate ── */}
      <mesh position={[0, 0.005, 0]} receiveShadow>
        <boxGeometry args={[0.7, 0.01, 0.7]} />
        <meshPhysicalMaterial color="#4a4a50" metalness={0.6} roughness={0.5} />
      </mesh>

      {/* ── Anchor base ── */}
      <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.5, 0.55, 0.16, 16]} />
        <meshPhysicalMaterial color="#4a5060" roughness={0.5} metalness={0.65} clearcoat={0.15} clearcoatRoughness={0.5} />
      </mesh>

      {/* ── Base mounting bolts — 8 for extra realism ── */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => {
        const rad = (angle * Math.PI) / 180;
        return (
          <mesh key={angle} position={[Math.cos(rad) * 0.45, 0.17, Math.sin(rad) * 0.45]}>
            <cylinderGeometry args={[0.02, 0.02, 0.02, 6]} />
            <meshPhysicalMaterial color="#7a7a7a" metalness={0.9} roughness={0.15} />
          </mesh>
        );
      })}

      {/* ── Turret ring ── */}
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.35, 0.4, 0.04, 16]} />
        <meshPhysicalMaterial color="#5a6370" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Turret ring rivets */}
      {[0, 90, 180, 270].map(a => {
        const r = (a * Math.PI) / 180;
        return (
          <mesh key={`tr${a}`} position={[Math.cos(r) * 0.37, 0.2, Math.sin(r) * 0.37]}>
            <sphereGeometry args={[0.008, 6, 6]} />
            <meshPhysicalMaterial color="#6a6a70" metalness={0.85} roughness={0.2} />
          </mesh>
        );
      })}

      {/* ── Arm group ── */}
      <group ref={armRef} position={[0, 0.2, 0]}>
        {/* Lower arm */}
        <mesh position={[0, 0.6, 0]} castShadow>
          <boxGeometry args={[0.12, 1.2, 0.12]} />
          <meshPhysicalMaterial
            color={fault ? '#8a3030' : '#5a6370'}
            roughness={0.4}
            metalness={0.65}
            clearcoat={0.1}
            clearcoatRoughness={0.6}
          />
        </mesh>
        {/* Hydraulic cylinder */}
        <mesh position={[0.08, 0.4, 0]} rotation={[0, 0, 0.15]}>
          <cylinderGeometry args={[0.015, 0.02, 0.5, 8]} />
          <meshPhysicalMaterial color="#8a8a8a" metalness={0.85} roughness={0.15} />
        </mesh>
        {/* Hydraulic piston rod */}
        <mesh position={[0.09, 0.55, 0]} rotation={[0, 0, 0.15]}>
          <cylinderGeometry args={[0.008, 0.008, 0.25, 6]} />
          <meshPhysicalMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
        </mesh>

        {/* Cables along arm */}
        <Cable
          points={[[-0.07, 0.05, 0.05], [-0.08, 0.3, 0.06], [-0.06, 0.6, 0.04], [-0.04, 0.9, 0.05], [-0.05, 1.15, 0.04]]}
          radius={0.008}
          color="#2a2a2a"
        />
        <Cable
          points={[[-0.05, 0.05, -0.05], [-0.06, 0.35, -0.04], [-0.04, 0.65, -0.05], [-0.03, 0.95, -0.03], [-0.04, 1.15, -0.04]]}
          radius={0.005}
          color="#2a3040"
        />
        {/* Air hose (blue) */}
        <Cable
          points={[[0.06, 0.1, 0.06], [0.07, 0.4, 0.07], [0.05, 0.7, 0.06], [0.04, 1.0, 0.07], [0.06, 1.18, 0.05]]}
          radius={0.006}
          color="#304a6a"
        />

        {/* ── Elbow joint ── */}
        <mesh position={[0, 1.2, 0]} castShadow>
          <sphereGeometry args={[0.1, 12, 12]} />
          <meshPhysicalMaterial color="#6a7080" metalness={0.75} roughness={0.2} clearcoat={0.3} clearcoatRoughness={0.3} />
        </mesh>
        <mesh position={[0, 1.2, 0]} rotation={[Math.PI * 0.5, 0, 0]}>
          <torusGeometry args={[0.11, 0.015, 8, 16]} />
          <meshPhysicalMaterial color="#5a6070" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* ── Upper arm ── */}
        <mesh position={[0.4, 1.2, 0]} rotation={[0, 0, Math.PI * 0.25]} castShadow>
          <boxGeometry args={[0.1, 0.8, 0.1]} />
          <meshPhysicalMaterial
            color={fault ? '#8a3030' : '#5a6370'}
            roughness={0.4}
            metalness={0.65}
            clearcoat={0.1}
            clearcoatRoughness={0.6}
          />
        </mesh>

        {/* ── Wrist rotation joint ── */}
        <mesh position={[0.65, 1.22, 0]} rotation={[0, 0, Math.PI * 0.5]}>
          <cylinderGeometry args={[0.04, 0.04, 0.06, 10]} />
          <meshPhysicalMaterial color="#6a7080" metalness={0.7} roughness={0.25} />
        </mesh>

        {/* ── End effector / suction plate ── */}
        <mesh ref={clawRef} position={[0.7, 1.2, 0]} castShadow>
          <boxGeometry args={[0.3, 0.05, 0.25]} />
          <meshPhysicalMaterial color="#c8a96e" roughness={0.3} metalness={0.6} clearcoat={0.25} clearcoatRoughness={0.3} />
        </mesh>
        {/* Suction cups */}
        {[[-0.1, 0, -0.08], [-0.1, 0, 0.08], [0.1, 0, -0.08], [0.1, 0, 0.08], [0, 0, 0]].map(([x, , z], i) => (
          <mesh key={`cup${i}`} position={[0.7 + x, 1.17, z]}>
            <cylinderGeometry args={[0.02, 0.015, 0.02, 8]} />
            <meshStandardMaterial color="#3a3a3a" roughness={0.8} metalness={0.2} />
          </mesh>
        ))}
      </group>

      {/* ── Pallet stack ── */}
      {[0, 0.12, 0.24].map((y, i) => (
        <mesh key={i} position={[-0.8, y + 0.06, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.7, 0.1, 0.5]} />
          <meshPhysicalMaterial color="#7a6a50" roughness={0.85} metalness={0.02} clearcoat={0.02} clearcoatRoughness={0.9} />
        </mesh>
      ))}
      {/* Pallet nails */}
      {[-0.3, 0, 0.3].map((x) => (
        <mesh key={`nail${x}`} position={[-0.8 + x * 0.3, 0.01, 0]}>
          <cylinderGeometry args={[0.003, 0.003, 0.04, 4]} />
          <meshStandardMaterial color="#8a8a8a" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}

      {/* ── Safety fence posts + rails ── */}
      {[[-1.2, 0, -0.8], [-1.2, 0, 0.8], [0.8, 0, 0.8]].map(([x, , z], i) => (
        <group key={`fence${i}`}>
          <mesh position={[x, 0.35, z]}>
            <boxGeometry args={[0.03, 0.7, 0.03]} />
            <meshPhysicalMaterial color="#c8a020" metalness={0.5} roughness={0.3} />
          </mesh>
          {/* Fence cap */}
          <mesh position={[x, 0.71, z]}>
            <sphereGeometry args={[0.02, 6, 6]} />
            <meshPhysicalMaterial color="#d0a828" metalness={0.4} roughness={0.3} />
          </mesh>
        </group>
      ))}
      {/* Fence horizontal rail */}
      <mesh position={[-1.2, 0.5, 0]}>
        <boxGeometry args={[0.02, 0.02, 1.58]} />
        <meshPhysicalMaterial color="#c8a020" metalness={0.5} roughness={0.3} />
      </mesh>

      {/* ── Beacon lamp on post ── */}
      <group position={[-1.2, 0.85, -0.8]}>
        <mesh>
          <cylinderGeometry args={[0.025, 0.025, 0.06, 8]} />
          <meshStandardMaterial color="#3a3a3a" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh ref={beaconRef} position={[0, 0.04, 0]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshBasicMaterial color="#404040" />
        </mesh>
      </group>

      {/* ── Control cabinet ── */}
      <group position={[0.5, 0.4, 0.6]}>
        <mesh castShadow>
          <boxGeometry args={[0.3, 0.8, 0.2]} />
          <meshPhysicalMaterial color="#5a6068" roughness={0.5} metalness={0.5} clearcoat={0.1} clearcoatRoughness={0.7} />
        </mesh>
        {/* Handle */}
        <mesh position={[0.151, 0.1, 0]}>
          <boxGeometry args={[0.008, 0.1, 0.015]} />
          <meshPhysicalMaterial color="#7a7a7a" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Cabinet status LED */}
        <mesh position={[0, 0.3, 0.101]}>
          <sphereGeometry args={[0.015, 6, 6]} />
          <meshBasicMaterial color={fault ? '#ff3030' : running ? '#40ff40' : '#606060'} />
        </mesh>
        {/* Ventilation slots */}
        {[-0.1, -0.05, 0, 0.05, 0.1].map((y, i) => (
          <mesh key={i} position={[0, y - 0.1, 0.101]}>
            <planeGeometry args={[0.2, 0.01]} />
            <meshStandardMaterial color="#3a3a3a" roughness={0.8} />
          </mesh>
        ))}
        {/* Nameplate */}
        <mesh position={[0, 0.35, 0.101]}>
          <planeGeometry args={[0.12, 0.03]} />
          <meshStandardMaterial color="#c8c8c0" metalness={0.6} roughness={0.3} />
        </mesh>
      </group>

      {/* ── Main status LED ── */}
      <mesh position={[0, 1.8, 0.15]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial color={fault ? '#ff3030' : running ? '#40ff40' : '#606060'} />
      </mesh>

      {/* ── Warning labels ── */}
      <mesh position={[0, 0.5, 0.08]}>
        <planeGeometry args={[0.12, 0.08]} />
        <meshStandardMaterial color="#c8a020" emissive="#c8a020" emissiveIntensity={0.04} roughness={0.5} />
      </mesh>
      <mesh position={[0.3, 0.25, 0.08]}>
        <planeGeometry args={[0.08, 0.05]} />
        <meshStandardMaterial color="#c04040" emissive="#c04040" emissiveIntensity={0.03} roughness={0.5} />
      </mesh>
    </group>
  );
}
