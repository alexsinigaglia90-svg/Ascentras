import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../state/store';
import { Cable } from '../props/Cable';

/** ────────────────────────────────────────────────────
 *  AutoStore Rig — instanced bins, structural frame,
 *  top rail, robot shuttle, controller box, cable runs,
 *  extra detail: cross-braces, corner gussets, brand plate,
 *  per-post bolt caps, maintenance label, barcode tag.
 *  ──────────────────────────────────────────────────── */
export function AutoStoreRig() {
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
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  const postCorners: [number, number, number][] = [
    [-cols * 0.225 - 0.08, 0, -rows * 0.225 - 0.08],
    [cols * 0.225 + 0.08, 0, -rows * 0.225 - 0.08],
    [-cols * 0.225 - 0.08, 0, rows * 0.225 + 0.08],
    [cols * 0.225 + 0.08, 0, rows * 0.225 + 0.08],
  ];

  return (
    <group position={[3, 0, -1.5]}>
      {/* ── Structural posts ── */}
      {postCorners.map(([x, , z], i) => (
        <group key={`post${i}`}>
          <mesh position={[x, (layers * 0.35 + 0.2) / 2, z]} castShadow>
            <boxGeometry args={[0.05, layers * 0.35 + 0.2, 0.05]} />
            <meshPhysicalMaterial color="#4a5060" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Bolt caps on top of each post */}
          <mesh position={[x, layers * 0.35 + 0.21, z]}>
            <cylinderGeometry args={[0.018, 0.018, 0.015, 6]} />
            <meshPhysicalMaterial color="#7a7a7a" metalness={0.9} roughness={0.15} />
          </mesh>
          {/* Corner gusset plate */}
          <mesh position={[x, 0.06, z]} castShadow>
            <boxGeometry args={[0.1, 0.12, 0.1]} />
            <meshPhysicalMaterial color="#4a5060" metalness={0.6} roughness={0.4} />
          </mesh>
        </group>
      ))}

      {/* ── Horizontal rails per layer ── */}
      {Array.from({ length: layers + 1 }).map((_, l) => (
        <group key={`rail${l}`}>
          {[-rows * 0.225 - 0.08, rows * 0.225 + 0.08].map((z, zi) => (
            <mesh key={zi} position={[0, l * 0.35 + 0.01, z]}>
              <boxGeometry args={[cols * 0.45 + 0.25, 0.02, 0.03]} />
              <meshPhysicalMaterial color="#5a6070" metalness={0.6} roughness={0.35} />
            </mesh>
          ))}
        </group>
      ))}

      {/* ── Cross-braces (diagonal X pattern on back face) ── */}
      {[0, 1].map(i => (
        <mesh
          key={`xbrace${i}`}
          position={[0, 0.55, -rows * 0.225 - 0.09]}
          rotation={[0, 0, i === 0 ? 0.5 : -0.5]}
        >
          <boxGeometry args={[0.015, 0.9, 0.015]} />
          <meshPhysicalMaterial color="#5a6070" metalness={0.65} roughness={0.35} />
        </mesh>
      ))}

      {/* ── Wire frame outline ── */}
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[cols * 0.45 + 0.2, layers * 0.35 + 0.2, rows * 0.45 + 0.2]} />
        <meshStandardMaterial color="#4a5058" wireframe transparent opacity={0.08} />
      </mesh>

      {/* ── Instanced bins ── */}
      <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow receiveShadow>
        <boxGeometry args={[0.36, 0.28, 0.36]} />
        <meshPhysicalMaterial vertexColors roughness={0.5} metalness={0.25} clearcoat={0.15} clearcoatRoughness={0.6} />
      </instancedMesh>

      {/* ── Top rail platform ── */}
      <mesh position={[0, layers * 0.35 + 0.15, 0]}>
        <boxGeometry args={[cols * 0.45 + 0.1, 0.03, rows * 0.45 + 0.1]} />
        <meshPhysicalMaterial color="#5a6070" metalness={0.65} roughness={0.3} />
      </mesh>

      {/* ── Robot shuttle ── */}
      <RobotShuttle layers={layers} speed={speed} emergency={emergency} />

      {/* ── Brand / label plate ── */}
      <group position={[0, layers * 0.35 + 0.35, 0]}>
        <mesh>
          <boxGeometry args={[1.2, 0.18, 0.02]} />
          <meshPhysicalMaterial color="#2a3038" roughness={0.4} metalness={0.3} clearcoat={0.3} clearcoatRoughness={0.4} />
        </mesh>
        <mesh position={[0, 0, 0.011]}>
          <planeGeometry args={[1.0, 0.08]} />
          <meshStandardMaterial color="#7090a0" emissive="#7090a0" emissiveIntensity={0.15} roughness={0.3} />
        </mesh>
      </group>

      {/* ── Barcode tag on side ── */}
      <mesh position={[cols * 0.225 + 0.1, 0.6, 0]} rotation={[0, Math.PI * 0.5, 0]}>
        <planeGeometry args={[0.18, 0.06]} />
        <meshStandardMaterial color="#f0f0f0" roughness={0.8} />
      </mesh>
      {/* ── Warning label ── */}
      <mesh position={[cols * 0.225 + 0.1, 0.3, 0]} rotation={[0, Math.PI * 0.5, 0]}>
        <planeGeometry args={[0.2, 0.12]} />
        <meshStandardMaterial color="#c8a020" emissive="#c8a020" emissiveIntensity={0.05} roughness={0.5} />
      </mesh>

      {/* ── Cable runs ── */}
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
      <Cable
        points={[
          [cols * 0.225 + 0.1, 0.4, -(rows * 0.225 + 0.1)],
          [cols * 0.225 + 0.12, 0.2, -(rows * 0.225 + 0.15)],
          [cols * 0.225 + 0.15, 0.02, -(rows * 0.225 + 0.2)],
        ]}
        radius={0.008}
        color="#2a3040"
      />
      {/* Extra data-bus cable along front rail */}
      <Cable
        points={[
          [-cols * 0.225, 0.01, rows * 0.225 + 0.12],
          [0, 0.02, rows * 0.225 + 0.14],
          [cols * 0.225, 0.01, rows * 0.225 + 0.12],
        ]}
        radius={0.006}
        color="#30304a"
      />

      {/* ── Controller box ── */}
      <group position={[cols * 0.225 + 0.15, 0.15, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.12, 0.2, 0.15]} />
          <meshPhysicalMaterial color="#4a5060" roughness={0.5} metalness={0.5} />
        </mesh>
        <mesh position={[0.061, 0, 0]}>
          <planeGeometry args={[0.08, 0.06]} />
          <meshPhysicalMaterial color="#c8c8c0" roughness={0.3} metalness={0.7} />
        </mesh>
        <mesh position={[0.062, 0.07, 0.04]}>
          <sphereGeometry args={[0.006, 6, 6]} />
          <meshBasicMaterial color={emergency ? '#ff3030' : '#40c040'} />
        </mesh>
        <mesh position={[0.062, 0.07, -0.04]}>
          <sphereGeometry args={[0.006, 6, 6]} />
          <meshBasicMaterial color="#c0a030" />
        </mesh>
        {/* DIN-rail terminal block inside ── */}
        {[-0.04, -0.02, 0, 0.02, 0.04].map((y, i) => (
          <mesh key={i} position={[0.055, y - 0.03, 0]}>
            <boxGeometry args={[0.005, 0.015, 0.12]} />
            <meshStandardMaterial color="#3a4050" metalness={0.5} roughness={0.4} />
          </mesh>
        ))}
      </group>

      {/* ── Maintenance handle ── */}
      <mesh position={[-cols * 0.225 - 0.12, 0.6, 0]} rotation={[Math.PI * 0.5, 0, 0]}>
        <torusGeometry args={[0.04, 0.008, 6, 12]} />
        <meshPhysicalMaterial color="#7a7a7a" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

/** Robot shuttle cruising on top rail */
function RobotShuttle({ layers, speed, emergency }: { layers: number; speed: number; emergency: boolean }) {
  const ref = useRef<THREE.Group>(null!);

  useFrame(() => {
    if (!ref.current || emergency) return;
    const time = performance.now() * 0.001;
    const spd = speed / 100;
    ref.current.position.x = Math.sin(time * spd * 1.5) * 1.2;
    ref.current.position.z = Math.cos(time * spd * 0.8) * 0.8;
  });

  return (
    <group ref={ref} position={[0, layers * 0.35 + 0.2, 0]}>
      {/* Body */}
      <mesh castShadow>
        <boxGeometry args={[0.25, 0.06, 0.25]} />
        <meshPhysicalMaterial color="#c8a96e" metalness={0.5} roughness={0.3} clearcoat={0.3} clearcoatRoughness={0.3} />
      </mesh>
      {/* Wheels */}
      {[[-0.1, -0.03, -0.1], [0.1, -0.03, -0.1], [-0.1, -0.03, 0.1], [0.1, -0.03, 0.1]].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]}>
          <cylinderGeometry args={[0.015, 0.015, 0.01, 8]} />
          <meshPhysicalMaterial color="#3a3a3a" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      {/* Antenna */}
      <mesh position={[0.08, 0.06, 0.08]}>
        <cylinderGeometry args={[0.003, 0.003, 0.08, 4]} />
        <meshStandardMaterial color="#4a4a4a" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
}
