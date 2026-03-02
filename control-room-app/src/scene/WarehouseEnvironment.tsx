import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../state/store';
import { Conduit } from './props/Cable';

/** Museum-grade warehouse environment with PBR surfaces */
export function WarehouseEnvironment() {
  const shift = useStore(s => s.shiftMode);
  const emergency = useStore(s => s.emergencyStop);

  return (
    <group>
      {/* ── Polished concrete floor ── */}
      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI * 0.5, 0, 0]} receiveShadow>
        <planeGeometry args={[16, 14]} />
        <meshPhysicalMaterial
          color="#575d66"
          roughness={0.62}
          metalness={0.08}
          clearcoat={0.3}
          clearcoatRoughness={0.38}
          reflectivity={0.35}
          envMapIntensity={0.75}
        />
      </mesh>

      {/* ── Floor expansion joints ── */}
      {[-4, -2, 0, 2, 4].map(x => (
        <mesh key={`vj${x}`} position={[x, 0.002, 0]} rotation={[-Math.PI * 0.5, 0, 0]}>
          <planeGeometry args={[0.03, 14]} />
          <meshStandardMaterial color="#3a3c40" roughness={1} />
        </mesh>
      ))}
      {[-4, -2, 0, 2, 4].map(z => (
        <mesh key={`hj${z}`} position={[0, 0.002, z]} rotation={[-Math.PI * 0.5, 0, 0]}>
          <planeGeometry args={[16, 0.03]} />
          <meshStandardMaterial color="#3a3c40" roughness={1} />
        </mesh>
      ))}

      {/* ── Safety lane markings (yellow) ── */}
      {[-4, 0, 4].map(x => (
        <mesh key={`lane${x}`} position={[x, 0.004, 0]} rotation={[-Math.PI * 0.5, 0, 0]}>
          <planeGeometry args={[0.08, 12]} />
          <meshStandardMaterial
            color="#8a8040"
            emissive="#8a8040"
            emissiveIntensity={0.05}
            transparent
            opacity={0.6}
            roughness={0.9}
          />
        </mesh>
      ))}
      {[-3, 0, 3].map(z => (
        <mesh key={`cross${z}`} position={[0, 0.004, z]} rotation={[-Math.PI * 0.5, 0, 0]}>
          <planeGeometry args={[14, 0.08]} />
          <meshStandardMaterial
            color="#8a8040"
            emissive="#8a8040"
            emissiveIntensity={0.05}
            transparent
            opacity={0.5}
            roughness={0.9}
          />
        </mesh>
      ))}

      {/* ── Hazard chevron strips near machines ── */}
      <HazardStrip position={[-3.5, 0.005, -2.8]} width={1.5} />
      <HazardStrip position={[3, 0.005, -3.0]} width={2.0} />
      <HazardStrip position={[3.5, 0.005, 1.5]} width={1.5} />

      {/* ── Back wall with panel detail ── */}
      <mesh position={[0, 2, -5]} receiveShadow>
        <planeGeometry args={[16, 5]} />
        <meshPhysicalMaterial
          color={shift === 'night' ? '#2a2e35' : '#555d68'}
          roughness={0.72}
          metalness={0.08}
          clearcoat={0.12}
          clearcoatRoughness={0.68}
          envMapIntensity={0.45}
        />
      </mesh>
      {/* Wall panel seams */}
      {[-6, -3, 0, 3, 6].map(x => (
        <mesh key={`ws${x}`} position={[x, 2, -4.98]}>
          <planeGeometry args={[0.02, 5]} />
          <meshStandardMaterial color="#404550" roughness={1} />
        </mesh>
      ))}

      {/* ── Side walls ── */}
      <mesh position={[-7, 2, 0]} rotation={[0, Math.PI * 0.5, 0]} receiveShadow>
        <planeGeometry args={[14, 5]} />
        <meshPhysicalMaterial color="#555d68" roughness={0.74} metalness={0.07} clearcoat={0.08} clearcoatRoughness={0.7} envMapIntensity={0.4} />
      </mesh>
      <mesh position={[7, 2, 0]} rotation={[0, -Math.PI * 0.5, 0]} receiveShadow>
        <planeGeometry args={[14, 5]} />
        <meshPhysicalMaterial color="#555d68" roughness={0.74} metalness={0.07} clearcoat={0.08} clearcoatRoughness={0.7} envMapIntensity={0.4} />
      </mesh>

      {/* ── Steel ceiling beams (I-beam profile) ── */}
      {[-5, -2.5, 0, 2.5, 5].map(x => (
        <group key={`beam${x}`}>
          {/* Web */}
          <mesh position={[x, 4.25, 0]}>
            <boxGeometry args={[0.06, 0.25, 14]} />
            <meshPhysicalMaterial color="#5a6068" metalness={0.7} roughness={0.35} />
          </mesh>
          {/* Top flange */}
          <mesh position={[x, 4.37, 0]}>
            <boxGeometry args={[0.2, 0.03, 14]} />
            <meshPhysicalMaterial color="#5a6068" metalness={0.7} roughness={0.35} />
          </mesh>
          {/* Bottom flange */}
          <mesh position={[x, 4.13, 0]}>
            <boxGeometry args={[0.2, 0.03, 14]} />
            <meshPhysicalMaterial color="#5a6068" metalness={0.7} roughness={0.35} />
          </mesh>
        </group>
      ))}

      {/* ── Cross beams ── */}
      {[-4, 0, 4].map(z => (
        <mesh key={`xbeam${z}`} position={[0, 4.1, z]}>
          <boxGeometry args={[16, 0.12, 0.06]} />
          <meshPhysicalMaterial color="#505868" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}

      {/* ── Safety signs on back wall ── */}
      {[
        { x: -5, label: 'warning', color: '#c8a040' },
        { x: -2, label: 'exit', color: '#40a040' },
        { x: 2, label: 'ppe', color: '#4080c0' },
        { x: 5, label: 'fire', color: '#c04040' },
      ].map(({ x, color }, i) => (
        <group key={i} position={[x, 3.0, -4.95]}>
          {/* Sign backing */}
          <mesh>
            <boxGeometry args={[0.5, 0.35, 0.02]} />
            <meshPhysicalMaterial color="#e8e8e0" roughness={0.5} metalness={0.1} />
          </mesh>
          {/* Sign face */}
          <mesh position={[0, 0, 0.012]}>
            <planeGeometry args={[0.44, 0.29]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.1}
              roughness={0.3}
            />
          </mesh>
          {/* Mounting screws */}
          {[[-0.2, 0.13], [0.2, 0.13], [-0.2, -0.13], [0.2, -0.13]].map(([sx, sy], j) => (
            <mesh key={j} position={[sx, sy, 0.015]}>
              <cylinderGeometry args={[0.012, 0.012, 0.01, 6]} />
              <meshStandardMaterial color="#8a8a8a" metalness={0.9} roughness={0.2} />
            </mesh>
          ))}
        </group>
      ))}

      {/* ── Fire extinguisher on side wall ── */}
      <group position={[-6.95, 0.5, -2]}>
        <mesh position={[0, 0.2, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.4, 8]} />
          <meshPhysicalMaterial color="#c03030" roughness={0.4} metalness={0.3} clearcoat={0.4} clearcoatRoughness={0.3} />
        </mesh>
        <mesh position={[0, 0.42, 0]}>
          <cylinderGeometry args={[0.02, 0.03, 0.06, 6]} />
          <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.3} />
        </mesh>
      </group>

      {/* ── Cable tray on ceiling ── */}
      <mesh position={[0, 4.0, -3]}>
        <boxGeometry args={[12, 0.04, 0.3]} />
        <meshStandardMaterial color="#4a4a50" metalness={0.5} roughness={0.5} />
      </mesh>
      {/* Cables in tray */}
      {[-0.08, 0, 0.08].map((z, i) => (
        <mesh key={i} position={[0, 4.02, -3 + z]}>
          <boxGeometry args={[12, 0.025, 0.04]} />
          <meshStandardMaterial color={['#2a2a2a', '#3a3050', '#2a3a2a'][i]} roughness={0.9} />
        </mesh>
      ))}

      {/* ── Emergency light on back wall ── */}
      <EmergencyLight />

      {/* ── Pedestal / diorama base ── */}
      <mesh position={[0, -0.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[16.5, 0.3, 14.5]} />
        <meshPhysicalMaterial
          color="#2e2a28"
          roughness={0.5}
          metalness={0.35}
          clearcoat={0.2}
          clearcoatRoughness={0.4}
        />
      </mesh>
      {/* Pedestal bevel */}
      <mesh position={[0, -0.32, 0]}>
        <boxGeometry args={[17, 0.05, 15]} />
        <meshPhysicalMaterial
          color="#3e3830"
          roughness={0.4}
          metalness={0.45}
          clearcoat={0.3}
          clearcoatRoughness={0.3}
        />
      </mesh>
      {/* Brass inlay line around pedestal edge */}
      {[
        { pos: [0, -0.28, 7.27] as [number, number, number], size: [17, 0.02, 0.03] as [number, number, number] },
        { pos: [0, -0.28, -7.27] as [number, number, number], size: [17, 0.02, 0.03] as [number, number, number] },
        { pos: [8.27, -0.28, 0] as [number, number, number], size: [0.03, 0.02, 14.5] as [number, number, number] },
        { pos: [-8.27, -0.28, 0] as [number, number, number], size: [0.03, 0.02, 14.5] as [number, number, number] },
      ].map(({ pos, size }, i) => (
        <mesh key={i} position={pos}>
          <boxGeometry args={size} />
          <meshPhysicalMaterial
            color="#b59a5e"
            emissive="#b59a5e"
            emissiveIntensity={0.15}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
      ))}

      {/* ══════════ MICRO-DETAIL ADDITIONS ══════════ */}

      {/* ── Conduit runs along walls (TubeGeometry) ── */}
      {/* Horizontal conduit along back wall */}
      <Conduit
        points={[[-7, 2.5, -4.85], [-3, 2.5, -4.85], [0, 2.5, -4.85], [3, 2.5, -4.85], [7, 2.5, -4.85]]}
        radius={0.03}
        color="#5a6068"
      />
      {/* Vertical drops from conduit to junction boxes */}
      <Conduit
        points={[[-5, 2.5, -4.85], [-5, 1.8, -4.85], [-5, 1.0, -4.85]]}
        radius={0.02}
        color="#5a6068"
      />
      <Conduit
        points={[[5, 2.5, -4.85], [5, 1.8, -4.85], [5, 1.0, -4.85]]}
        radius={0.02}
        color="#5a6068"
      />
      {/* Conduit along left wall — power feed */}
      <Conduit
        points={[[-6.88, 3.2, -4], [-6.88, 3.2, -1], [-6.88, 3.2, 2], [-6.88, 3.2, 5]]}
        radius={0.025}
        color="#5a6068"
      />
      {/* Conduit along right wall — data */}
      <Conduit
        points={[[6.88, 2.8, -4], [6.88, 2.8, -1], [6.88, 2.8, 2], [6.88, 2.8, 5]]}
        radius={0.02}
        color="#6a6a70"
      />

      {/* ── Junction boxes on walls ── */}
      {[
        [-5, 0.9, -4.9] as [number, number, number],
        [5, 0.9, -4.9] as [number, number, number],
        [0, 1.5, -4.9] as [number, number, number],
      ].map((pos, i) => (
        <group key={`jbox${i}`} position={pos}>
          <mesh>
            <boxGeometry args={[0.2, 0.15, 0.06]} />
            <meshPhysicalMaterial color="#5a6068" roughness={0.5} metalness={0.5} />
          </mesh>
          {/* Cover plate */}
          <mesh position={[0, 0, 0.032]}>
            <boxGeometry args={[0.18, 0.13, 0.005]} />
            <meshPhysicalMaterial color="#6a707a" roughness={0.4} metalness={0.6} />
          </mesh>
          {/* Mounting screws */}
          {[[-0.07, 0.05], [0.07, 0.05], [-0.07, -0.05], [0.07, -0.05]].map(([sx, sy], j) => (
            <mesh key={j} position={[sx, sy, 0.036]}>
              <cylinderGeometry args={[0.006, 0.006, 0.004, 6]} />
              <meshStandardMaterial color="#8a8a8a" metalness={0.9} roughness={0.15} />
            </mesh>
          ))}
          {/* Status LED */}
          <mesh position={[0.065, 0.05, 0.036]}>
            <sphereGeometry args={[0.005, 6, 6]} />
            <meshBasicMaterial color="#40a040" />
          </mesh>
        </group>
      ))}

      {/* ── Junction boxes on side walls ── */}
      {[
        { pos: [-6.92, 1.2, 1] as [number, number, number], rot: [0, Math.PI * 0.5, 0] as [number, number, number] },
        { pos: [-6.92, 1.2, -3] as [number, number, number], rot: [0, Math.PI * 0.5, 0] as [number, number, number] },
        { pos: [6.92, 1.2, 0] as [number, number, number], rot: [0, -Math.PI * 0.5, 0] as [number, number, number] },
        { pos: [6.92, 1.2, 3] as [number, number, number], rot: [0, -Math.PI * 0.5, 0] as [number, number, number] },
      ].map(({ pos, rot }, i) => (
        <group key={`sjbox${i}`} position={pos} rotation={rot}>
          <mesh>
            <boxGeometry args={[0.15, 0.15, 0.05]} />
            <meshPhysicalMaterial color="#5a6068" roughness={0.5} metalness={0.5} />
          </mesh>
          <mesh position={[0, 0, 0.026]}>
            <boxGeometry args={[0.13, 0.13, 0.004]} />
            <meshPhysicalMaterial color="#6a707a" roughness={0.4} metalness={0.6} />
          </mesh>
        </group>
      ))}

      {/* ── Floor drain grates ── */}
      {[
        [-4, 0.003, -2] as [number, number, number],
        [0, 0.003, 4] as [number, number, number],
        [4, 0.003, 0] as [number, number, number],
      ].map((pos, i) => (
        <group key={`drain${i}`} position={pos} rotation={[-Math.PI * 0.5, 0, 0]}>
          {/* Drain frame */}
          <mesh>
            <boxGeometry args={[0.25, 0.25, 0.015]} />
            <meshPhysicalMaterial color="#3a3a3a" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Drain slots */}
          {[-0.08, -0.04, 0, 0.04, 0.08].map((offset, j) => (
            <mesh key={j} position={[offset, 0, 0.008]}>
              <boxGeometry args={[0.015, 0.2, 0.002]} />
              <meshStandardMaterial color="#1a1a1a" roughness={1} />
            </mesh>
          ))}
        </group>
      ))}

      {/* ── Ventilation grilles on walls ── */}
      {[
        { pos: [-6.95, 3.5, 3] as [number, number, number], rot: [0, Math.PI * 0.5, 0] as [number, number, number] },
        { pos: [6.95, 3.5, -1] as [number, number, number], rot: [0, -Math.PI * 0.5, 0] as [number, number, number] },
        { pos: [3, 3.8, -4.95] as [number, number, number], rot: [0, 0, 0] as [number, number, number] },
      ].map(({ pos, rot }, i) => (
        <group key={`vent${i}`} position={pos} rotation={rot}>
          {/* Vent frame */}
          <mesh>
            <boxGeometry args={[0.4, 0.25, 0.02]} />
            <meshPhysicalMaterial color="#555d68" roughness={0.5} metalness={0.5} />
          </mesh>
          {/* Vent slats */}
          {[-0.08, -0.04, 0, 0.04, 0.08].map((y, j) => (
            <mesh key={j} position={[0, y, 0.012]} rotation={[0.2, 0, 0]}>
              <boxGeometry args={[0.35, 0.012, 0.005]} />
              <meshPhysicalMaterial color="#4a5060" roughness={0.4} metalness={0.6} />
            </mesh>
          ))}
        </group>
      ))}

      {/* ── Additional cable trays (perpendicular run) ── */}
      <mesh position={[-3, 4.0, 0]}>
        <boxGeometry args={[0.3, 0.04, 10]} />
        <meshStandardMaterial color="#4a4a50" metalness={0.5} roughness={0.5} />
      </mesh>
      {/* Cables in secondary tray */}
      {[-0.05, 0.05].map((x, i) => (
        <mesh key={`ct2${i}`} position={[-3 + x, 4.02, 0]}>
          <boxGeometry args={[0.04, 0.025, 10]} />
          <meshStandardMaterial color={['#2a2a3a', '#3a2a2a'][i]} roughness={0.9} />
        </mesh>
      ))}

      {/* ── Equipment nameplates on floor ── */}
      {[
        { pos: [3, 0.005, -3.2] as [number, number, number], label: 'ZONE-A' },
        { pos: [-3.5, 0.005, -3.2] as [number, number, number], label: 'ZONE-B' },
        { pos: [-2, 0.005, 3.5] as [number, number, number], label: 'ZONE-C' },
        { pos: [3.5, 0.005, 4.0] as [number, number, number], label: 'ZONE-D' },
      ].map(({ pos }, i) => (
        <group key={`nameplate${i}`} position={pos} rotation={[-Math.PI * 0.5, 0, 0]}>
          {/* Plate backing */}
          <mesh>
            <planeGeometry args={[0.35, 0.12]} />
            <meshPhysicalMaterial color="#2a2e38" roughness={0.4} metalness={0.6} clearcoat={0.3} clearcoatRoughness={0.4} />
          </mesh>
          {/* Text area */}
          <mesh position={[0, 0, 0.001]}>
            <planeGeometry args={[0.3, 0.06]} />
            <meshStandardMaterial color="#7090a0" emissive="#7090a0" emissiveIntensity={0.1} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* ── Pipe run along ceiling (compressed air / water) ── */}
      {/* Main horizontal pipe */}
      <mesh position={[4, 3.9, 0]} rotation={[Math.PI * 0.5, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 12, 12]} />
        <meshPhysicalMaterial color="#6a6a70" metalness={0.7} roughness={0.25} />
      </mesh>
      {/* Pipe clamps */}
      {[-4, -1, 2, 5].map(z => (
        <group key={`clamp${z}`} position={[4, 3.9, z]}>
          <mesh rotation={[Math.PI * 0.5, 0, 0]}>
            <torusGeometry args={[0.055, 0.008, 6, 12, Math.PI]} />
            <meshPhysicalMaterial color="#5a5a5a" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Clamp bolt */}
          <mesh position={[0, 0.06, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 0.02, 6]} />
            <meshStandardMaterial color="#7a7a7a" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      ))}
      {/* Secondary pipe (smaller, painted yellow = gas) */}
      <mesh position={[-4, 3.85, 0]} rotation={[Math.PI * 0.5, 0, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 12, 8]} />
        <meshPhysicalMaterial color="#b0a040" metalness={0.4} roughness={0.4} />
      </mesh>

      {/* ── Wall-mounted first aid box ── */}
      <group position={[6.93, 1.5, 2]} rotation={[0, -Math.PI * 0.5, 0]}>
        <mesh>
          <boxGeometry args={[0.3, 0.25, 0.1]} />
          <meshPhysicalMaterial color="#e8e8e0" roughness={0.5} metalness={0.1} />
        </mesh>
        {/* Cross symbol */}
        <mesh position={[0, 0.02, 0.052]}>
          <boxGeometry args={[0.08, 0.18, 0.002]} />
          <meshStandardMaterial color="#40a040" roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.02, 0.052]}>
          <boxGeometry args={[0.18, 0.08, 0.002]} />
          <meshStandardMaterial color="#40a040" roughness={0.3} />
        </mesh>
      </group>

      {/* ── Additional LED strip lights along floor edge ── */}
      {[-6, -3, 0, 3, 6].map(z => (
        <mesh key={`fled${z}`} position={[-6.9, 0.03, z]} rotation={[0, Math.PI * 0.5, 0]}>
          <boxGeometry args={[0.6, 0.01, 0.01]} />
          <meshBasicMaterial color="#304858" />
        </mesh>
      ))}
    </group>
  );
}

/**  Yellow/black hazard chevron floor strip */
function HazardStrip({ position, width }: { position: [number, number, number]; width: number }) {
  return (
    <mesh position={position} rotation={[-Math.PI * 0.5, 0, 0]}>
      <planeGeometry args={[width, 0.12]} />
      <meshStandardMaterial
        color="#c8a020"
        emissive="#c8a020"
        emissiveIntensity={0.03}
        transparent
        opacity={0.7}
        roughness={0.8}
      />
    </mesh>
  );
}

function EmergencyLight() {
  const ref = useRef<THREE.Mesh>(null!);
  const glowRef = useRef<THREE.PointLight>(null!);
  const emergency = useStore(s => s.emergencyStop);

  useFrame(() => {
    if (!ref.current) return;
    const mat = ref.current.material as THREE.MeshStandardMaterial;
    const pulse = Math.sin(performance.now() * 0.006);
    if (emergency) {
      mat.emissiveIntensity = pulse > 0 ? 2.0 : 0.1;
      mat.emissive.set('#ff2020');
      mat.color.set(pulse > 0 ? '#ff2020' : '#400000');
      if (glowRef.current) {
        glowRef.current.intensity = pulse > 0 ? 1.5 : 0;
      }
    } else {
      mat.emissiveIntensity = 0.1;
      mat.emissive.set('#203020');
      mat.color.set('#304030');
      if (glowRef.current) {
        glowRef.current.intensity = 0;
      }
    }
  });

  return (
    <group position={[0, 3.8, -4.9]}>
      {/* Housing */}
      <mesh>
        <boxGeometry args={[0.35, 0.15, 0.06]} />
        <meshStandardMaterial color="#3a3a3a" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Lens */}
      <mesh ref={ref} position={[0, 0, 0.03]}>
        <boxGeometry args={[0.28, 0.1, 0.01]} />
        <meshStandardMaterial
          color="#304030"
          emissive="#203020"
          emissiveIntensity={0.1}
          transparent
          opacity={0.9}
          roughness={0.2}
        />
      </mesh>
      {/* Emergency glow light */}
      <pointLight ref={glowRef} position={[0, 0, 0.2]} color="#ff2020" intensity={0} distance={8} decay={2} />
    </group>
  );
}
