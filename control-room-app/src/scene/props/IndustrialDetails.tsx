import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../state/store';
import { Cable, Conduit } from '../props/Cable';

/** ────────────────────────────────────────────────────
 *  Industrial Details — shared micro-detail layer added
 *  on top of the base scene: instanced floor bolts,
 *  safety beacons, e-stop mushroom buttons on columns,
 *  cable trays between machines, floor markings,
 *  fire extinguisher, first-aid station.
 *  ──────────────────────────────────────────────────── */
export function IndustrialDetails() {
  const performanceMode = useStore(s => s.performanceMode);
  const emergency = useStore(s => s.emergencyStop);

  return (
    <group>
      {/* ── Instanced floor anchor bolts ── */}
      <FloorBolts />

      {/* ── Floor safety markings (yellow pedestrian zone) ── */}
      <FloorMarkings />

      {/* ── Main cable tray run (back wall → machines) ── */}
      <Conduit
        points={[[-5, 0.03, -3.5], [-2, 0.03, -3.5], [1, 0.03, -3.5], [4, 0.03, -3.5]]}
        radius={0.025}
        color="#4a4a50"
      />
      <Conduit
        points={[[-5, 0.03, 3.5], [-2, 0.03, 3.5], [1, 0.03, 3.5], [4, 0.03, 3.5]]}
        radius={0.02}
        color="#4a4a50"
      />

      {/* ── Overhead cable tray ── */}
      {!performanceMode && (
        <group position={[0, 3.8, 0]}>
          {/* Tray base */}
          <mesh>
            <boxGeometry args={[10, 0.02, 0.3]} />
            <meshPhysicalMaterial color="#4a5060" metalness={0.6} roughness={0.4} />
          </mesh>
          {/* Tray sides */}
          {[-0.15, 0.15].map((z, i) => (
            <mesh key={i} position={[0, 0.04, z]}>
              <boxGeometry args={[10, 0.06, 0.01]} />
              <meshPhysicalMaterial color="#4a5060" metalness={0.6} roughness={0.4} />
            </mesh>
          ))}
          {/* Cables inside */}
          <Cable points={[[-4.5, 0.02, -0.05], [-1, 0.03, -0.04], [2, 0.02, -0.05], [4.5, 0.03, -0.04]]} radius={0.01} color="#2a2a2a" />
          <Cable points={[[-4.5, 0.02, 0.05], [-1, 0.03, 0.06], [2, 0.02, 0.05], [4.5, 0.03, 0.06]]} radius={0.008} color="#2a3040" />
          <Cable points={[[-4.5, 0.02, 0], [0, 0.03, 0.01], [4.5, 0.02, 0]]} radius={0.006} color="#304a2a" />
          {/* Tray hangers */}
          {[-3, -1, 1, 3].map((x, i) => (
            <mesh key={i} position={[x, 0.15, 0]}>
              <boxGeometry args={[0.02, 0.3, 0.02]} />
              <meshStandardMaterial color="#4a5060" metalness={0.5} roughness={0.4} />
            </mesh>
          ))}
        </group>
      )}

      {/* ── Safety beacons on columns ── */}
      <SafetyBeacon position={[-6.5, 2.5, -4]} emergency={emergency} />
      <SafetyBeacon position={[6.5, 2.5, -4]} emergency={emergency} />
      <SafetyBeacon position={[-6.5, 2.5, 4]} emergency={emergency} />

      {/* ── E-stop mushroom buttons on walls ── */}
      <EStopButton position={[-7, 1.0, -2]} rotation={[0, Math.PI * 0.5, 0]} />
      <EStopButton position={[7, 1.0, 2]} rotation={[0, -Math.PI * 0.5, 0]} />
      <EStopButton position={[0, 1.0, -5.5]} rotation={[0, 0, 0]} />

      {/* ── Fire extinguisher ── */}
      <group position={[-7.2, 0.5, 1]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.35, 8]} />
          <meshPhysicalMaterial color="#c03030" roughness={0.4} metalness={0.3} />
        </mesh>
        {/* Handle */}
        <mesh position={[0, 0.2, 0]}>
          <boxGeometry args={[0.06, 0.04, 0.02]} />
          <meshStandardMaterial color="#2a2a2a" metalness={0.5} roughness={0.4} />
        </mesh>
        {/* Nozzle */}
        <mesh position={[0.04, 0.15, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.08, 6]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.5} />
        </mesh>
        {/* Wall bracket */}
        <mesh position={[0.06, 0, 0]}>
          <boxGeometry args={[0.01, 0.2, 0.08]} />
          <meshStandardMaterial color="#5a5a60" metalness={0.5} roughness={0.4} />
        </mesh>
      </group>

      {/* ── First aid box ── */}
      <group position={[7.2, 1.2, -1]}>
        <mesh castShadow>
          <boxGeometry args={[0.04, 0.2, 0.15]} />
          <meshPhysicalMaterial color="#f0f0f0" roughness={0.5} metalness={0.2} />
        </mesh>
        {/* Green cross */}
        <mesh position={[-0.021, 0, 0]}>
          <planeGeometry args={[0.06, 0.06]} />
          <meshStandardMaterial color="#30a030" emissive="#30a030" emissiveIntensity={0.1} roughness={0.5} />
        </mesh>
      </group>

      {/* ── Light curtain indicators (between depalletizer zone) ── */}
      {!performanceMode && (
        <>
          <LightCurtain position={[-2.2, 0.4, -2.3]} height={0.8} />
          <LightCurtain position={[-2.2, 0.4, -0.7]} height={0.8} />
        </>
      )}

      {/* ── Drain grate near conveyor ── */}
      <mesh position={[-2, 0.002, 3.5]} rotation={[-Math.PI * 0.5, 0, 0]}>
        <planeGeometry args={[0.3, 0.3]} />
        <meshStandardMaterial color="#3a3a40" metalness={0.6} roughness={0.5} />
      </mesh>
      {/* Grate bars */}
      {[-0.1, -0.05, 0, 0.05, 0.1].map((x, i) => (
        <mesh key={i} position={[-2 + x, 0.005, 3.5]} rotation={[-Math.PI * 0.5, 0, 0]}>
          <planeGeometry args={[0.008, 0.28]} />
          <meshStandardMaterial color="#2a2a2a" metalness={0.7} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

/** Instanced floor bolts — scattered around machine bases */
function FloorBolts() {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const count = 48;

  const positions = useMemo(() => {
    const pts: [number, number, number][] = [];
    // Around AutoStore base
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      pts.push([3 + Math.cos(a) * 2.2, 0.008, -1.5 + Math.sin(a) * 1.8]);
    }
    // Around Depalletizer
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      pts.push([-3.5 + Math.cos(a) * 0.8, 0.008, -1.5 + Math.sin(a) * 0.8]);
    }
    // Along conveyor legs
    for (let i = 0; i < 8; i++) {
      pts.push([-2 + (i - 4) * 0.9, 0.008, 1.55]);
      pts.push([-2 + (i - 4) * 0.9, 0.008, 2.45]);
    }
    // Around Palletizer
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      pts.push([3.5 + Math.cos(a) * 1.0, 0.008, 2.5 + Math.sin(a) * 0.8]);
    }
    return pts.slice(0, count);
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    if (!meshRef.current) return;
    positions.forEach(([x, y, z], i) => {
      dummy.position.set(x, y, z);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [positions, dummy]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} receiveShadow>
      <cylinderGeometry args={[0.012, 0.012, 0.016, 6]} />
      <meshPhysicalMaterial color="#6a6a70" metalness={0.85} roughness={0.2} />
    </instancedMesh>
  );
}

/** Yellow floor safety markings */
function FloorMarkings() {
  return (
    <group>
      {/* Pedestrian walkway marking */}
      <mesh position={[0, 0.003, 4.5]} rotation={[-Math.PI * 0.5, 0, 0]}>
        <planeGeometry args={[12, 0.08]} />
        <meshStandardMaterial color="#c8a020" emissive="#c8a020" emissiveIntensity={0.02} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.003, 5.0]} rotation={[-Math.PI * 0.5, 0, 0]}>
        <planeGeometry args={[12, 0.08]} />
        <meshStandardMaterial color="#c8a020" emissive="#c8a020" emissiveIntensity={0.02} roughness={0.7} />
      </mesh>
      {/* Machine zone border */}
      <mesh position={[-3.5, 0.003, -1.5]} rotation={[-Math.PI * 0.5, 0, 0]}>
        <ringGeometry args={[0.9, 0.93, 24]} />
        <meshStandardMaterial color="#c8a020" emissive="#c8a020" emissiveIntensity={0.02} roughness={0.7} />
      </mesh>
    </group>
  );
}

/** Safety beacon with strobe effect */
function SafetyBeacon({ position, emergency }: {
  position: [number, number, number];
  emergency: boolean;
}) {
  const ref = useRef<THREE.Mesh>(null!);

  useFrame(() => {
    if (!ref.current) return;
    const mat = ref.current.material as THREE.MeshBasicMaterial;
    if (emergency) {
      mat.color.set(Math.sin(performance.now() * 0.01) > 0 ? '#ff2020' : '#400000');
    } else {
      mat.color.set('#30a030');
    }
  });

  return (
    <group position={position}>
      <mesh>
        <cylinderGeometry args={[0.035, 0.035, 0.08, 8]} />
        <meshStandardMaterial color="#3a3a3a" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh ref={ref} position={[0, 0.06, 0]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshBasicMaterial color="#30a030" />
      </mesh>
    </group>
  );
}

/** E-stop mushroom button */
function EStopButton({ position, rotation }: {
  position: [number, number, number];
  rotation: [number, number, number];
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* Backing plate */}
      <mesh>
        <boxGeometry args={[0.08, 0.08, 0.015]} />
        <meshPhysicalMaterial color="#c8c020" roughness={0.4} metalness={0.3} />
      </mesh>
      {/* Mushroom head */}
      <mesh position={[0, 0, 0.015]}>
        <cylinderGeometry args={[0.025, 0.03, 0.02, 8]} />
        <meshPhysicalMaterial color="#c03030" roughness={0.3} metalness={0.3} clearcoat={0.6} clearcoatRoughness={0.2} />
      </mesh>
      {/* Label "STOP" */}
      <mesh position={[0, -0.035, 0.008]}>
        <planeGeometry args={[0.06, 0.015]} />
        <meshStandardMaterial color="#f0f0f0" roughness={0.5} />
      </mesh>
    </group>
  );
}

/** Light curtain safety sensor pair */
function LightCurtain({ position, height }: {
  position: [number, number, number];
  height: number;
}) {
  return (
    <group position={position}>
      {/* Emitter column */}
      <mesh>
        <boxGeometry args={[0.025, height, 0.025]} />
        <meshPhysicalMaterial color="#2a2a30" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Status LED strip */}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={i} position={[0.013, (i / 4 - 0.5) * (height * 0.8), 0]}>
          <sphereGeometry args={[0.004, 4, 4]} />
          <meshBasicMaterial color="#ff4040" />
        </mesh>
      ))}
    </group>
  );
}
