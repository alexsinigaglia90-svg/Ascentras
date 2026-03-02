import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../state/store';
import { Cable } from './props/Cable';
import * as M from './materials/materialPresets';

/** Museum-grade control desk with PBR materials, glass screens, micro-detail */
export function ControlDesk() {
  const emergency = useStore(s => s.emergencyStop);
  const shift = useStore(s => s.shiftMode);
  const screenRef = useRef<THREE.Mesh>(null!);

  useFrame(() => {
    if (!screenRef.current) return;
    const mat = screenRef.current.material as THREE.MeshPhysicalMaterial;
    if (emergency) {
      mat.emissiveIntensity = Math.sin(performance.now() * 0.008) > 0 ? 1.2 : 0.1;
      mat.emissive.set('#ff2020');
    } else {
      mat.emissiveIntensity = 0.5 + Math.sin(performance.now() * 0.002) * 0.08;
      mat.emissive.set(shift === 'night' ? '#1a3050' : '#2a5a3a');
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* ── Main desk surface ── */}
      <mesh position={[0, 0.45, -0.3]} castShadow receiveShadow>
        <boxGeometry args={[2.8, 0.06, 1.0]} />
        <meshPhysicalMaterial {...M.laminate} />
      </mesh>
      {/* Desk front edge — brushed aluminum strip */}
      <mesh position={[0, 0.455, 0.18]}>
        <boxGeometry args={[2.8, 0.015, 0.04]} />
        <meshPhysicalMaterial {...M.brushedAluminium} />
      </mesh>
      {/* Desk legs */}
      {[[-1.3, 0.22, -0.1], [1.3, 0.22, -0.1], [-1.3, 0.22, -0.65], [1.3, 0.22, -0.65]].map(([x, y, z], i) => (
        <mesh key={`leg${i}`} position={[x, y, z]}>
          <boxGeometry args={[0.04, 0.44, 0.04]} />
          <meshPhysicalMaterial {...M.machinedSteel} />
        </mesh>
      ))}

      {/* ── Main monitor ── */}
      <group position={[0, 0.95, -0.5]}>
        {/* Bezel */}
        <mesh castShadow>
          <boxGeometry args={[1.2, 0.7, 0.04]} />
          <meshPhysicalMaterial {...M.darkEnclosure} />
        </mesh>
        {/* Glass screen */}
        <mesh ref={screenRef} position={[0, 0, 0.025]}>
          <planeGeometry args={[1.1, 0.6]} />
          <meshPhysicalMaterial
            {...M.screenGlass}
            emissive="#2a5a3a"
            emissiveIntensity={0.5}
          />
        </mesh>
        {/* Screen content scanlines (subtle detail) */}
        <mesh position={[0, 0, 0.027]}>
          <planeGeometry args={[1.1, 0.6]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.015}
            depthWrite={false}
          />
        </mesh>
        {/* Monitor stand */}
        <mesh position={[0, -0.45, -0.02]} castShadow>
          <boxGeometry args={[0.15, 0.2, 0.08]} />
          <meshPhysicalMaterial {...M.darkEnclosure} />
        </mesh>
        {/* Stand base */}
        <mesh position={[0, -0.55, -0.02]}>
          <boxGeometry args={[0.3, 0.015, 0.15]} />
          <meshPhysicalMaterial {...M.darkEnclosure} />
        </mesh>
        {/* Power LED on bezel */}
        <mesh position={[0.5, -0.32, 0.025]}>
          <sphereGeometry args={[0.008, 6, 6]} />
          <meshBasicMaterial color={emergency ? '#ff2020' : '#40c060'} />
        </mesh>
        {/* Brand label on bezel bottom */}
        <mesh position={[0, -0.32, 0.025]}>
          <planeGeometry args={[0.15, 0.02]} />
          <meshStandardMaterial color="#4a4a4a" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>

      {/* ── Side monitors — angled ── */}
      {[-0.9, 0.9].map((x, i) => (
        <group key={i} position={[x, 0.85, -0.45]} rotation={[0, x > 0 ? -0.2 : 0.2, 0]}>
          {/* Bezel */}
          <mesh castShadow>
            <boxGeometry args={[0.65, 0.45, 0.03]} />
            <meshPhysicalMaterial {...M.darkEnclosure} />
          </mesh>
          {/* Glass screen */}
          <mesh position={[0, 0, 0.02]}>
            <planeGeometry args={[0.58, 0.38]} />
            <meshPhysicalMaterial
              {...M.screenGlass}
              emissive={emergency ? '#501010' : '#1a4530'}
              emissiveIntensity={0.4}
            />
          </mesh>
          {/* Power LED */}
          <mesh position={[0.28, -0.2, 0.02]}>
            <sphereGeometry args={[0.006, 6, 6]} />
            <meshBasicMaterial color={emergency ? '#ff2020' : '#3080c0'} />
          </mesh>
        </group>
      ))}

      {/* ── Keyboard with key rows ── */}
      <mesh position={[0, 0.48, 0.0]} castShadow>
        <boxGeometry args={[0.55, 0.018, 0.2]} />
        <meshPhysicalMaterial {...M.blackPlastic} />
      </mesh>
      {/* Key rows (subtle texture) */}
      {[0.06, 0.02, -0.02, -0.06].map((z, row) => (
        <mesh key={row} position={[0, 0.49, z]}>
          <boxGeometry args={[0.48, 0.004, 0.03]} />
          <meshStandardMaterial color="#353535" roughness={0.7} metalness={0.2} />
        </mesh>
      ))}

      {/* ── Mouse ── */}
      <group position={[0.45, 0.48, 0.0]}>
        <mesh castShadow>
          <boxGeometry args={[0.07, 0.025, 0.11]} />
          <meshPhysicalMaterial {...M.blackPlastic} />
        </mesh>
        {/* Scroll wheel */}
        <mesh position={[0, 0.014, -0.02]}>
          <cylinderGeometry args={[0.005, 0.005, 0.015, 8]} />
          <meshStandardMaterial color="#505050" metalness={0.5} roughness={0.4} />
        </mesh>
        {/* Mouse pad */}
        <mesh position={[0, -0.006, 0]}>
          <boxGeometry args={[0.2, 0.004, 0.22]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.95} metalness={0} />
        </mesh>
      </group>

      {/* ── Coffee mug ── */}
      <group position={[-1.1, 0.48, 0.1]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.04, 0.035, 0.09, 12]} />
          <meshPhysicalMaterial
            color="#6a5a48"
            roughness={0.7}
            metalness={0.05}
            clearcoat={0.5}
            clearcoatRoughness={0.4}
          />
        </mesh>
        {/* Coffee inside */}
        <mesh position={[0, 0.03, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.01, 12]} />
          <meshStandardMaterial color="#1a1008" roughness={0.3} metalness={0.1} />
        </mesh>
        {/* Handle */}
        <mesh position={[0.045, 0, 0]} rotation={[0, 0, Math.PI * 0.5]}>
          <torusGeometry args={[0.025, 0.007, 8, 12, Math.PI]} />
          <meshPhysicalMaterial color="#6a5a48" roughness={0.7} metalness={0.05} />
        </mesh>
      </group>

      {/* ── Clipboard with paper ── */}
      <group position={[1.15, 0.475, 0.05]} rotation={[0, -0.3, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.18, 0.012, 0.25]} />
          <meshPhysicalMaterial color="#7a6a50" roughness={0.8} metalness={0.05} clearcoat={0.15} clearcoatRoughness={0.6} />
        </mesh>
        {/* Paper */}
        <mesh position={[0, 0.007, -0.01]}>
          <planeGeometry args={[0.16, 0.22]} />
          <meshStandardMaterial color="#f0ece0" roughness={0.95} />
        </mesh>
        {/* Clip */}
        <mesh position={[0, 0.012, 0.115]}>
          <boxGeometry args={[0.1, 0.008, 0.02]} />
          <meshPhysicalMaterial color="#a0a0a0" metalness={0.9} roughness={0.15} />
        </mesh>
      </group>

      {/* ── Sticky notes ── */}
      {[
        { pos: [-0.55, 0.475, 0.12] as [number, number, number], color: '#c8c460', rot: 0.1 },
        { pos: [-0.48, 0.476, 0.08] as [number, number, number], color: '#60a8c8', rot: -0.15 },
        { pos: [-0.42, 0.477, 0.14] as [number, number, number], color: '#c890a0', rot: 0.05 },
      ].map(({ pos, color, rot }, i) => (
        <mesh key={i} position={pos} rotation={[0, rot, 0]}>
          <boxGeometry args={[0.07, 0.002, 0.07]} />
          <meshStandardMaterial color={color} roughness={0.9} />
        </mesh>
      ))}

      {/* ── Desk fan ── */}
      <FanProp position={[1.2, 0.55, -0.3]} />

      {/* ── LED indicators on desk front ── */}
      {[-1.0, -0.5, 0, 0.5, 1.0].map((x, i) => (
        <IndicatorLED key={i} position={[x, 0.465, 0.2]} index={i} />
      ))}

      {/* ── Cable management — TubeGeometry curved cables ── */}
      {/* Main cable bundle from monitors down behind desk */}
      <Cable
        points={[[0, 0.5, -0.5], [0, 0.35, -0.65], [0, 0.15, -0.8], [0, 0.02, -0.85]]}
        radius={0.025}
        color="#1a1a1a"
      />
      {/* Individual monitor cables (power, HDMI, DP) */}
      <Cable
        points={[[-0.06, 0.5, -0.5], [-0.08, 0.3, -0.6], [-0.1, 0.1, -0.75], [-0.12, 0.02, -0.88]]}
        radius={0.008}
        color="#2a2a4a"
      />
      <Cable
        points={[[0, 0.5, -0.5], [0.02, 0.28, -0.62], [0, 0.08, -0.78], [0.03, 0.02, -0.88]]}
        radius={0.008}
        color="#2a4a2a"
      />
      <Cable
        points={[[0.06, 0.5, -0.5], [0.1, 0.32, -0.58], [0.12, 0.12, -0.72], [0.15, 0.02, -0.85]]}
        radius={0.008}
        color="#4a2a2a"
      />
      {/* Side monitor cables */}
      <Cable
        points={[[-0.9, 0.6, -0.45], [-0.85, 0.35, -0.6], [-0.6, 0.1, -0.78], [-0.3, 0.02, -0.88]]}
        radius={0.007}
        color="#2a2a3a"
      />
      <Cable
        points={[[0.9, 0.6, -0.45], [0.85, 0.35, -0.6], [0.6, 0.1, -0.78], [0.3, 0.02, -0.88]]}
        radius={0.007}
        color="#2a2a3a"
      />
      {/* Keyboard/mouse USB cables */}
      <Cable
        points={[[0, 0.48, -0.1], [0, 0.46, -0.35], [0.05, 0.4, -0.6], [0.05, 0.02, -0.82]]}
        radius={0.005}
        color="#3a3a3a"
      />
      <Cable
        points={[[0.45, 0.48, -0.1], [0.42, 0.46, -0.3], [0.35, 0.42, -0.55], [0.2, 0.02, -0.82]]}
        radius={0.004}
        color="#3a3a3a"
      />
      {/* Cable clip on desk edge */}
      <mesh position={[0, 0.44, -0.78]}>
        <boxGeometry args={[0.06, 0.03, 0.02]} />
        <meshStandardMaterial color="#5a5a5a" metalness={0.6} roughness={0.3} />
      </mesh>

      {/* ── Desk-mounted power strip ── */}
      <group position={[0.8, 0.44, -0.78]}>
        <mesh>
          <boxGeometry args={[0.25, 0.03, 0.05]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.7} metalness={0.2} />
        </mesh>
        {/* Outlet indicators */}
        {[-0.08, -0.03, 0.02, 0.07].map((x, i) => (
          <mesh key={i} position={[x, 0.016, 0]}>
            <boxGeometry args={[0.015, 0.003, 0.02]} />
            <meshBasicMaterial color={i < 3 ? '#30a030' : '#505050'} />
          </mesh>
        ))}
      </group>

      {/* ── Office chair (more detail) ── */}
      <group position={[0, 0, 0.8]}>
        {/* Seat */}
        <mesh position={[0, 0.3, 0]} castShadow>
          <boxGeometry args={[0.5, 0.06, 0.45]} />
          <meshPhysicalMaterial
            color="#3a3530"
            roughness={0.7}
            metalness={0.05}
            clearcoat={0.1}
            clearcoatRoughness={0.8}
          />
        </mesh>
        {/* Back rest */}
        <mesh position={[0, 0.58, -0.2]} castShadow>
          <boxGeometry args={[0.48, 0.55, 0.05]} />
          <meshPhysicalMaterial color="#3a3530" roughness={0.7} metalness={0.05} />
        </mesh>
        {/* Headrest */}
        <mesh position={[0, 0.88, -0.2]}>
          <boxGeometry args={[0.3, 0.1, 0.04]} />
          <meshPhysicalMaterial color="#3a3530" roughness={0.7} />
        </mesh>
        {/* Armrests */}
        {[-0.28, 0.28].map((x, i) => (
          <group key={i}>
            <mesh position={[x, 0.42, -0.05]}>
              <boxGeometry args={[0.04, 0.2, 0.04]} />
              <meshStandardMaterial color="#2a2a2a" metalness={0.6} roughness={0.3} />
            </mesh>
            <mesh position={[x, 0.52, 0.02]}>
              <boxGeometry args={[0.06, 0.02, 0.2]} />
              <meshStandardMaterial color="#3a3a3a" roughness={0.6} metalness={0.3} />
            </mesh>
          </group>
        ))}
        {/* Gas cylinder */}
        <mesh position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.025, 0.03, 0.28, 8]} />
          <meshPhysicalMaterial color="#2a2a2a" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Star base */}
        {[0, 72, 144, 216, 288].map(angle => {
          const rad = (angle * Math.PI) / 180;
          return (
            <mesh key={angle} position={[Math.cos(rad) * 0.15, 0.02, Math.sin(rad) * 0.15]} rotation={[0, -rad, Math.PI * 0.5]}>
              <boxGeometry args={[0.02, 0.15, 0.03]} />
              <meshPhysicalMaterial color="#2a2a2a" metalness={0.7} roughness={0.3} />
            </mesh>
          );
        })}
        {/* Casters */}
        {[0, 72, 144, 216, 288].map(angle => {
          const rad = (angle * Math.PI) / 180;
          return (
            <mesh key={`c${angle}`} position={[Math.cos(rad) * 0.22, 0.015, Math.sin(rad) * 0.22]}>
              <sphereGeometry args={[0.015, 6, 6]} />
              <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.4} />
            </mesh>
          );
        })}
      </group>

      {/* ── Warning label on desk side ── */}
      <mesh position={[1.38, 0.42, -0.05]}>
        <planeGeometry args={[0.15, 0.08]} />
        <meshStandardMaterial
          color="#c8a020"
          emissive="#c8a020"
          emissiveIntensity={0.05}
          roughness={0.5}
        />
      </mesh>
    </group>
  );
}

function FanProp({ position }: { position: [number, number, number] }) {
  const bladeRef = useRef<THREE.Mesh>(null!);

  useFrame(() => {
    if (bladeRef.current) {
      bladeRef.current.rotation.z += 0.08;
    }
  });

  return (
    <group position={position}>
      {/* Housing */}
      <mesh castShadow>
        <cylinderGeometry args={[0.06, 0.08, 0.04, 12]} />
        <meshPhysicalMaterial color="#4a4a4a" metalness={0.6} roughness={0.35} />
      </mesh>
      {/* Guard ring */}
      <mesh position={[0, 0.02, 0.04]} rotation={[Math.PI * 0.5, 0, 0]}>
        <torusGeometry args={[0.055, 0.004, 8, 16]} />
        <meshStandardMaterial color="#5a5a5a" metalness={0.7} roughness={0.25} />
      </mesh>
      {/* Blades */}
      <mesh ref={bladeRef} position={[0, 0.02, 0.04]} rotation={[Math.PI * 0.5, 0, 0]}>
        <circleGeometry args={[0.05, 3]} />
        <meshStandardMaterial color="#6a6a6a" side={THREE.DoubleSide} transparent opacity={0.5} metalness={0.4} roughness={0.4} />
      </mesh>
    </group>
  );
}

function IndicatorLED({ position, index }: { position: [number, number, number]; index: number }) {
  const ref = useRef<THREE.Mesh>(null!);
  const emergency = useStore(s => s.emergencyStop);

  useFrame(() => {
    if (!ref.current) return;
    const mat = ref.current.material as THREE.MeshBasicMaterial;
    const time = performance.now() * 0.001;
    if (emergency) {
      mat.color.set(Math.sin(time * 4 + index) > 0 ? '#ff2020' : '#300000');
    } else {
      const brightness = 0.3 + Math.sin(time * 0.5 + index * 1.2) * 0.2;
      mat.color.setRGB(0.2, 0.4 + brightness * 0.4, 0.3);
    }
  });

  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.015, 6, 6]} />
      <meshBasicMaterial color="#2a6a3a" />
    </mesh>
  );
}
