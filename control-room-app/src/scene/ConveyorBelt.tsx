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

/** PBR conveyor belt with rollers, sensors, and micro-detail */
export function ConveyorBelt() {
  const groupRef = useRef<THREE.Group>(null!);
  const segRef = useRef<THREE.Mesh[]>([]);
  const running = useStore(s => s.conveyorRunning);
  const jam = useStore(s => s.conveyorJam);
  const divert = useStore(s => s.conveyorDivert);
  const emergency = useStore(s => s.emergencyStop);

  const segCount = 20;
  const segWidth = 0.35;

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const active = running && !jam && !emergency;
    segRef.current.forEach((seg, i) => {
      if (!seg) return;
      if (active) {
        seg.position.x -= delta * 1.5;
        if (seg.position.x < -segCount * segWidth * 0.5) {
          seg.position.x += segCount * segWidth;
        }
      }
      if (jam) {
        seg.position.y = Math.sin(performance.now() * 0.02 + i) * 0.01;
      } else {
        seg.position.y = 0;
      }
    });
  });

  return (
    <group ref={groupRef} position={[-2, 0.35, 2]}>
      {/* ── Belt frame — side channels ── */}
      <mesh position={[0, -0.06, 0]} castShadow receiveShadow>
        <boxGeometry args={[segCount * segWidth, 0.06, 0.92]} />
        <meshPhysicalMaterial color="#3a3f48" roughness={0.6} metalness={0.5} clearcoat={0.1} clearcoatRoughness={0.7} />
      </mesh>

      {/* ── Support legs ── */}
      {[-2.5, -0.5, 1.5, 3.0].map((x, i) => (
        <group key={`leg${i}`}>
          <mesh position={[x, -0.2, -0.4]} castShadow>
            <boxGeometry args={[0.04, 0.35, 0.04]} />
            <meshPhysicalMaterial color="#4a5060" metalness={0.6} roughness={0.35} />
          </mesh>
          <mesh position={[x, -0.2, 0.4]} castShadow>
            <boxGeometry args={[0.04, 0.35, 0.04]} />
            <meshPhysicalMaterial color="#4a5060" metalness={0.6} roughness={0.35} />
          </mesh>
          {/* Cross brace */}
          <mesh position={[x, -0.3, 0]}>
            <boxGeometry args={[0.025, 0.025, 0.75]} />
            <meshStandardMaterial color="#4a5060" metalness={0.5} roughness={0.4} />
          </mesh>
        </group>
      ))}

      {/* ── Roller segments ── */}
      {Array.from({ length: segCount }).map((_, i) => (
        <mesh
          key={i}
          ref={el => { if (el) segRef.current[i] = el; }}
          position={[(i - segCount / 2) * segWidth, 0, 0]}
          castShadow
        >
          <boxGeometry args={[segWidth - 0.02, 0.025, 0.82]} />
          <meshPhysicalMaterial
            color={jam ? '#8a4040' : running && !emergency ? '#5a6a58' : '#4a4a4a'}
            roughness={0.55}
            metalness={0.35}
            clearcoat={0.05}
            clearcoatRoughness={0.8}
          />
        </mesh>
      ))}

      {/* ── Side rails with profile ── */}
      {[-0.48, 0.48].map(z => (
        <group key={`rail${z}`}>
          <mesh position={[0, 0.06, z]} castShadow>
            <boxGeometry args={[segCount * segWidth, 0.12, 0.035]} />
            <meshPhysicalMaterial color="#4a5060" roughness={0.4} metalness={0.6} clearcoat={0.15} clearcoatRoughness={0.5} />
          </mesh>
          {/* Top cap */}
          <mesh position={[0, 0.125, z]}>
            <boxGeometry args={[segCount * segWidth, 0.015, 0.05]} />
            <meshPhysicalMaterial color="#555d68" roughness={0.35} metalness={0.65} />
          </mesh>
        </group>
      ))}

      {/* ── Photoelectric sensors ── */}
      {[-2, 0, 2].map((x, i) => (
        <group key={`sensor${i}`}>
          <mesh position={[x, 0.18, -0.5]}>
            <boxGeometry args={[0.04, 0.04, 0.03]} />
            <meshPhysicalMaterial color="#2a2a2a" roughness={0.3} metalness={0.6} />
          </mesh>
          {/* Sensor LED */}
          <mesh position={[x, 0.18, -0.515]}>
            <sphereGeometry args={[0.008, 6, 6]} />
            <meshBasicMaterial color={running && !emergency ? '#40ff40' : '#604040'} />
          </mesh>
          {/* Opposite reflector */}
          <mesh position={[x, 0.18, 0.5]}>
            <boxGeometry args={[0.03, 0.03, 0.02]} />
            <meshPhysicalMaterial color="#e0e0e0" roughness={0.1} metalness={0.8} />
          </mesh>
        </group>
      ))}

      {/* ── Divert gate ── */}
      <group position={[1, 0.1, divert ? 0.6 : 0]} rotation={[0, divert ? Math.PI * 0.15 : 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.6, 0.2, 0.04]} />
          <meshPhysicalMaterial
            color={divert ? '#c8a96e' : '#5a6370'}
            roughness={0.4}
            metalness={0.5}
            clearcoat={0.2}
            clearcoatRoughness={0.4}
          />
        </mesh>
        {/* Actuator */}
        <mesh position={[-0.32, -0.05, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.15, 6]} />
          <meshPhysicalMaterial color="#5a6370" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>

      {/* ── End rollers (larger) ── */}
      {[-segCount * segWidth * 0.5, segCount * segWidth * 0.5].map((x, i) => (
        <mesh key={`end${i}`} position={[x, 0, 0]} rotation={[0, 0, Math.PI * 0.5]}>
          <cylinderGeometry args={[0.04, 0.04, 0.82, 12]} />
          <meshPhysicalMaterial color="#6a6e78" metalness={0.7} roughness={0.25} />
        </mesh>
      ))}

      {/* ── Warning label ── */}
      <mesh position={[-3.2, 0.04, -0.5]} rotation={[0, Math.PI * 0.5, 0]}>
        <planeGeometry args={[0.12, 0.06]} />
        <meshStandardMaterial color="#c8a020" emissive="#c8a020" emissiveIntensity={0.04} roughness={0.5} />
      </mesh>

      {/* ── E-stop button on frame ── */}
      <group position={[3.3, 0.1, -0.5]}>
        <mesh>
          <cylinderGeometry args={[0.025, 0.025, 0.02, 8]} />
          <meshPhysicalMaterial color="#c03030" roughness={0.3} metalness={0.3} clearcoat={0.6} clearcoatRoughness={0.2} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.015, 8]} />
          <meshStandardMaterial color="#c8c020" roughness={0.4} metalness={0.3} />
        </mesh>
      </group>

      {/* ── Power / signal cable runs (TubeGeometry) ── */}
      <Cable
        points={[[-3.5, -0.38, -0.45], [-3.5, -0.15, -0.5], [-3.5, 0.05, -0.5]]}
        radius={0.012}
        color="#2a2a2a"
      />
      <Cable
        points={[[3.2, -0.38, -0.45], [3.2, -0.15, -0.5], [3.2, 0.05, -0.5]]}
        radius={0.01}
        color="#2a3a40"
      />
      {/* Inter-sensor cable */}
      <Cable
        points={[[-2, 0.18, -0.52], [-1, 0.16, -0.52], [0, 0.17, -0.52], [1, 0.16, -0.52], [2, 0.18, -0.52]]}
        radius={0.005}
        color="#3a3050"
      />

      {/* ── Motor housing at drive end ── */}
      <group position={[-3.5, -0.1, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.18, 0.15, 0.2]} />
          <meshPhysicalMaterial color="#4a5060" roughness={0.4} metalness={0.6} />
        </mesh>
        {/* Motor ventilation fins */}
        {[-0.06, -0.03, 0, 0.03, 0.06].map((y, i) => (
          <mesh key={`fin${i}`} position={[-0.091, y, 0]}>
            <boxGeometry args={[0.003, 0.01, 0.18]} />
            <meshStandardMaterial color="#3a4050" metalness={0.5} roughness={0.4} />
          </mesh>
        ))}
        {/* Motor nameplate */}
        <mesh position={[0.091, 0, 0]}>
          <planeGeometry args={[0.08, 0.06]} />
          <meshPhysicalMaterial color="#c8c8c0" roughness={0.3} metalness={0.7} />
        </mesh>
        {/* Motor status LED */}
        <mesh position={[0.091, 0.05, 0.05]}>
          <sphereGeometry args={[0.006, 6, 6]} />
          <meshBasicMaterial color={running && !emergency ? '#40c040' : '#604040'} />
        </mesh>
      </group>

      {/* ── Packages on belt ── */}
      {running && !emergency && !jam && [0, 1.5, 3, 4.5].map((offset, i) => (
        <PackageBox key={i} offset={offset} index={i} />
      ))}
    </group>
  );
}

function PackageBox({ offset, index }: { offset: number; index: number }) {
  const ref = useRef<THREE.Mesh>(null!);
  const colors = ['#8a7a60', '#7a6850', '#6a7a60', '#8a7060'];

  useFrame(() => {
    if (!ref.current) return;
    const time = performance.now() * 0.001;
    ref.current.position.x = ((time * 1.5 + offset) % 7) - 3.5;
  });

  return (
    <group>
      <mesh ref={ref} position={[0, 0.13, 0]} castShadow>
        <boxGeometry args={[0.25, 0.2, 0.25]} />
        <meshPhysicalMaterial
          color={colors[index % colors.length]}
          roughness={0.75}
          metalness={0.05}
          clearcoat={0.05}
          clearcoatRoughness={0.9}
        />
      </mesh>
    </group>
  );
}
