import { useRef, useMemo, useEffect } from 'react';
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

/** Instanced AutoStore grid with PBR bins, frame detail, and micro-elements */
export function AutoStoreGrid() {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const speed = useStore(s => s.autostoreSpeed);
  const heatmap = useStore(s => s.autostoreHeatmap);
  const density = useStore(s => s.autostoreBinDensity);
  const emergency = useStore(s => s.emergencyStop);

  const cols = 8;
  const rows = 6;
  const layers = 3;
  const count = cols * rows * layers;

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);

  /* Initialise instance colors */
  useEffect(() => {
    if (!meshRef.current) return;
    for (let i = 0; i < count; i++) {
      meshRef.current.setColorAt(i, tempColor.set('#737c88'));
    }
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  }, [count, tempColor]);

  useFrame(() => {
    if (!meshRef.current) return;
    const time = performance.now() * 0.001;
    const speedFactor = emergency ? 0 : speed / 100;

    let idx = 0;
    for (let l = 0; l < layers; l++) {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const visible = (idx / count) * 100 < density;
          const x = (c - cols / 2) * 0.45;
          const y = l * 0.35 + 0.175;
          const z = (r - rows / 2) * 0.45;

          const wobble = visible ? Math.sin(time * speedFactor * 2 + idx * 0.5) * 0.02 * speedFactor : 0;

          dummy.position.set(x, y + wobble, z);
          dummy.scale.setScalar(visible ? 0.38 : 0);
          dummy.updateMatrix();
          meshRef.current.setMatrixAt(idx, dummy.matrix);

          // Color
          if (heatmap && visible) {
            const heat = Math.sin(time * 0.5 + idx * 0.3) * 0.5 + 0.5;
            tempColor.setRGB(0.3 + heat * 0.5, 0.6 - heat * 0.3, 0.3);
          } else if (visible) {
            tempColor.setRGB(0.45, 0.52, 0.58);
          } else {
            tempColor.setRGB(0.1, 0.1, 0.1);
          }
          meshRef.current.setColorAt(idx, tempColor);
          idx++;
        }
      }
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <group position={[3, 0, -1.5]}>
      {/* ── Structural frame — vertical posts ── */}
      {[
        [-cols * 0.225 - 0.08, 0, -rows * 0.225 - 0.08],
        [cols * 0.225 + 0.08, 0, -rows * 0.225 - 0.08],
        [-cols * 0.225 - 0.08, 0, rows * 0.225 + 0.08],
        [cols * 0.225 + 0.08, 0, rows * 0.225 + 0.08],
      ].map(([x, _, z], i) => (
        <mesh key={`post${i}`} position={[x, (layers * 0.35 + 0.2) / 2, z]} castShadow>
          <boxGeometry args={[0.05, layers * 0.35 + 0.2, 0.05]} />
          <meshPhysicalMaterial color="#4a5060" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}

      {/* ── Horizontal rails per layer ── */}
      {Array.from({ length: layers + 1 }).map((_, l) => (
        <group key={`rail${l}`}>
          <mesh position={[0, l * 0.35 + 0.01, -rows * 0.225 - 0.08]}>
            <boxGeometry args={[cols * 0.45 + 0.25, 0.02, 0.03]} />
            <meshPhysicalMaterial color="#5a6070" metalness={0.6} roughness={0.35} />
          </mesh>
          <mesh position={[0, l * 0.35 + 0.01, rows * 0.225 + 0.08]}>
            <boxGeometry args={[cols * 0.45 + 0.25, 0.02, 0.03]} />
            <meshPhysicalMaterial color="#5a6070" metalness={0.6} roughness={0.35} />
          </mesh>
        </group>
      ))}

      {/* ── Wire frame outline ── */}
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[cols * 0.45 + 0.2, layers * 0.35 + 0.2, rows * 0.45 + 0.2]} />
        <meshStandardMaterial color="#4a5058" wireframe transparent opacity={0.08} />
      </mesh>

      {/* ── Bins ── */}
      <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow receiveShadow>
        <boxGeometry args={[0.36, 0.28, 0.36]} />
        <meshPhysicalMaterial
          vertexColors
          roughness={0.5}
          metalness={0.25}
          clearcoat={0.15}
          clearcoatRoughness={0.6}
        />
      </instancedMesh>

      {/* ── Top robot rail ── */}
      <mesh position={[0, layers * 0.35 + 0.15, 0]}>
        <boxGeometry args={[cols * 0.45 + 0.1, 0.03, rows * 0.45 + 0.1]} />
        <meshPhysicalMaterial color="#5a6070" metalness={0.65} roughness={0.3} />
      </mesh>

      {/* ── Robot shuttle on top ── */}
      <RobotShuttle layers={layers} speed={speed} emergency={emergency} />

      {/* ── Label plate ── */}
      <group position={[0, layers * 0.35 + 0.35, 0]}>
        <mesh>
          <boxGeometry args={[1.2, 0.18, 0.02]} />
          <meshPhysicalMaterial color="#2a3038" roughness={0.4} metalness={0.3} clearcoat={0.3} clearcoatRoughness={0.4} />
        </mesh>
        {/* "AUTOSTORE" text indicator */}
        <mesh position={[0, 0, 0.011]}>
          <planeGeometry args={[1.0, 0.08]} />
          <meshStandardMaterial
            color="#7090a0"
            emissive="#7090a0"
            emissiveIntensity={0.15}
            roughness={0.3}
          />
        </mesh>
      </group>

      {/* ── Warning labels ── */}
      <mesh position={[cols * 0.225 + 0.1, 0.3, 0]} rotation={[0, Math.PI * 0.5, 0]}>
        <planeGeometry args={[0.2, 0.12]} />
        <meshStandardMaterial color="#c8a020" emissive="#c8a020" emissiveIntensity={0.05} roughness={0.5} />
      </mesh>

      {/* ── Power cable run from grid to floor (TubeGeometry) ── */}
      <Cable
        points={[
          [cols * 0.225 + 0.1, 0.5, rows * 0.225 + 0.1],
          [cols * 0.225 + 0.15, 0.25, rows * 0.225 + 0.15],
          [cols * 0.225 + 0.2, 0.05, rows * 0.225 + 0.2],
          [cols * 0.225 + 0.3, 0.02, rows * 0.225 + 0.3],
        ]}
        radius={0.015}
        color="#2a2a2a"
      />
      {/* Signal cable */}
      <Cable
        points={[
          [cols * 0.225 + 0.1, 0.4, -(rows * 0.225 + 0.1)],
          [cols * 0.225 + 0.12, 0.2, -(rows * 0.225 + 0.15)],
          [cols * 0.225 + 0.15, 0.02, -(rows * 0.225 + 0.2)],
        ]}
        radius={0.008}
        color="#2a3040"
      />

      {/* ── Controller box at base ── */}
      <group position={[cols * 0.225 + 0.15, 0.15, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.12, 0.2, 0.15]} />
          <meshPhysicalMaterial color="#4a5060" roughness={0.5} metalness={0.5} />
        </mesh>
        <mesh position={[0.061, 0, 0]}>
          <planeGeometry args={[0.08, 0.06]} />
          <meshPhysicalMaterial color="#c8c8c0" roughness={0.3} metalness={0.7} />
        </mesh>
        {/* Green status LED */}
        <mesh position={[0.062, 0.07, 0.04]}>
          <sphereGeometry args={[0.006, 6, 6]} />
          <meshBasicMaterial color={emergency ? '#ff3030' : '#40c040'} />
        </mesh>
        {/* Amber status LED */}
        <mesh position={[0.062, 0.07, -0.04]}>
          <sphereGeometry args={[0.006, 6, 6]} />
          <meshBasicMaterial color="#c0a030" />
        </mesh>
      </group>
    </group>
  );
}

/** Small robot shuttle on top of grid */
function RobotShuttle({ layers, speed, emergency }: { layers: number; speed: number; emergency: boolean }) {
  const ref = useRef<THREE.Mesh>(null!);

  useFrame(() => {
    if (!ref.current || emergency) return;
    const time = performance.now() * 0.001;
    const spd = speed / 100;
    ref.current.position.x = Math.sin(time * spd * 1.5) * 1.2;
    ref.current.position.z = Math.cos(time * spd * 0.8) * 0.8;
  });

  return (
    <mesh ref={ref} position={[0, layers * 0.35 + 0.2, 0]} castShadow>
      <boxGeometry args={[0.25, 0.06, 0.25]} />
      <meshPhysicalMaterial color="#c8a96e" metalness={0.5} roughness={0.3} clearcoat={0.3} clearcoatRoughness={0.3} />
    </mesh>
  );
}
