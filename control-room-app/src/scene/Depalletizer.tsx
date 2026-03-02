import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../state/store';

/** Curved cable using TubeGeometry + CatmullRomCurve3 */
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

/** PBR Depalletizer robot arm with micro-detail */
export function Depalletizer() {
  const armRef = useRef<THREE.Group>(null!);
  const clawRef = useRef<THREE.Mesh>(null!);
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
  });

  return (
    <group position={[-3.5, 0, -1.5]}>
      {/* ── Anchor base — heavy machined look ── */}
      <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.5, 0.55, 0.16, 16]} />
        <meshPhysicalMaterial
          color="#4a5060"
          roughness={0.5}
          metalness={0.65}
          clearcoat={0.15}
          clearcoatRoughness={0.5}
        />
      </mesh>
      {/* Base mounting bolts */}
      {[0, 60, 120, 180, 240, 300].map(angle => {
        const rad = (angle * Math.PI) / 180;
        return (
          <mesh key={angle} position={[Math.cos(rad) * 0.45, 0.17, Math.sin(rad) * 0.45]}>
            <cylinderGeometry args={[0.02, 0.02, 0.02, 6]} />
            <meshPhysicalMaterial color="#7a7a7a" metalness={0.9} roughness={0.15} />
          </mesh>
        );
      })}
      {/* Turret ring */}
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.35, 0.4, 0.04, 16]} />
        <meshPhysicalMaterial color="#5a6370" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* ── Arm group ── */}
      <group ref={armRef} position={[0, 0.2, 0]}>
        {/* Lower arm — industrial beam profile */}
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
        {/* Hydraulic cylinder on arm */}
        <mesh position={[0.08, 0.4, 0]} rotation={[0, 0, 0.15]}>
          <cylinderGeometry args={[0.015, 0.02, 0.5, 8]} />
          <meshPhysicalMaterial color="#8a8a8a" metalness={0.85} roughness={0.15} />
        </mesh>
        {/* Cable along arm — curved tube */}
        <Cable
          points={[[-0.07, 0.05, 0.05], [-0.08, 0.3, 0.06], [-0.06, 0.6, 0.04], [-0.04, 0.9, 0.05], [-0.05, 1.15, 0.04]]}
          radius={0.008}
          color="#2a2a2a"
        />
        {/* Secondary cable (signal) */}
        <Cable
          points={[[-0.05, 0.05, -0.05], [-0.06, 0.35, -0.04], [-0.04, 0.65, -0.05], [-0.03, 0.95, -0.03], [-0.04, 1.15, -0.04]]}
          radius={0.005}
          color="#2a3040"
        />

        {/* ── Elbow joint — sphere with ring ── */}
        <mesh position={[0, 1.2, 0]} castShadow>
          <sphereGeometry args={[0.1, 12, 12]} />
          <meshPhysicalMaterial color="#6a7080" metalness={0.75} roughness={0.2} clearcoat={0.3} clearcoatRoughness={0.3} />
        </mesh>
        {/* Joint ring */}
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

        {/* ── End effector / claw ── */}
        <mesh ref={clawRef} position={[0.7, 1.2, 0]} castShadow>
          <boxGeometry args={[0.3, 0.05, 0.25]} />
          <meshPhysicalMaterial
            color="#c8a96e"
            roughness={0.3}
            metalness={0.6}
            clearcoat={0.25}
            clearcoatRoughness={0.3}
          />
        </mesh>
        {/* Suction cups on end effector */}
        {[[-0.1, 0, -0.08], [-0.1, 0, 0.08], [0.1, 0, -0.08], [0.1, 0, 0.08]].map(([x, _, z], i) => (
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
          <meshPhysicalMaterial
            color="#7a6a50"
            roughness={0.85}
            metalness={0.02}
            clearcoat={0.02}
            clearcoatRoughness={0.9}
          />
        </mesh>
      ))}

      {/* ── Safety fence posts ── */}
      {[[-1.2, 0, -0.8], [-1.2, 0, 0.8], [0.8, 0, 0.8]].map(([x, _, z], i) => (
        <mesh key={`fence${i}`} position={[x, 0.35, z]}>
          <boxGeometry args={[0.03, 0.7, 0.03]} />
          <meshPhysicalMaterial color="#c8a020" metalness={0.5} roughness={0.3} />
        </mesh>
      ))}

      {/* ── Control cabinet ── */}
      <group position={[0.5, 0.4, 0.6]}>
        <mesh castShadow>
          <boxGeometry args={[0.3, 0.8, 0.2]} />
          <meshPhysicalMaterial color="#5a6068" roughness={0.5} metalness={0.5} clearcoat={0.1} clearcoatRoughness={0.7} />
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
      </group>

      {/* ── Main status LED ── */}
      <mesh position={[0, 1.8, 0.15]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial color={fault ? '#ff3030' : running ? '#40ff40' : '#606060'} />
      </mesh>

      {/* ── Warning label ── */}
      <mesh position={[0, 0.5, 0.08]} rotation={[0, 0, 0]}>
        <planeGeometry args={[0.12, 0.08]} />
        <meshStandardMaterial color="#c8a020" emissive="#c8a020" emissiveIntensity={0.04} roughness={0.5} />
      </mesh>
    </group>
  );
}
