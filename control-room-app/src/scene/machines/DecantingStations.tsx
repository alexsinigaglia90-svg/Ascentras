import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as M from '../materials/materialPresets';
import { Cable } from '../props/Cable';
import { StatusLED, LightStack } from '../props/BeaconsAndIndicators';
import { WarningLabel, Nameplate } from '../props/DecalsAndLabels';
import { useStore } from '../../state/store';

/** ────────────────────────────────────────────────────
 *  Decanting / Unpacking Stations — 2 workstations
 *  where operators unpack boxes arriving from the main
 *  conveyor. Each station has:
 *    - Branch roller conveyor from main line
 *    - Work table
 *    - Operator figure (simple humanoid)
 *    - Boxes in various states of unpacking
 *    - Output conveyor leading toward AutoStore
 *
 *  Position: [3, 0, 0] — right of main conveyor.
 *  Input connects to main conveyor right end at x ≈ 2.
 *  Output feeds toward AutoStore at x ≈ 5.
 *  ──────────────────────────────────────────────────── */

const STATION_SPACING = 1.6;

function OperatorFigure({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Legs */}
      <mesh position={[-0.04, 0.22, 0]} castShadow>
        <boxGeometry args={[0.06, 0.44, 0.06]} />
        <meshStandardMaterial color="#2a3a60" roughness={0.7} />
      </mesh>
      <mesh position={[0.04, 0.22, 0]} castShadow>
        <boxGeometry args={[0.06, 0.44, 0.06]} />
        <meshStandardMaterial color="#2a3a60" roughness={0.7} />
      </mesh>
      {/* Torso */}
      <mesh position={[0, 0.56, 0]} castShadow>
        <boxGeometry args={[0.2, 0.28, 0.12]} />
        <meshStandardMaterial color="#e07020" roughness={0.6} />
      </mesh>
      {/* Hi-vis vest strips */}
      <mesh position={[0, 0.52, 0.061]}>
        <boxGeometry args={[0.18, 0.03, 0.002]} />
        <meshStandardMaterial color="#ccff00" emissive="#aadd00" emissiveIntensity={0.15} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.60, 0.061]}>
        <boxGeometry args={[0.18, 0.03, 0.002]} />
        <meshStandardMaterial color="#ccff00" emissive="#aadd00" emissiveIntensity={0.15} roughness={0.5} />
      </mesh>
      {/* Arms */}
      <mesh position={[-0.14, 0.52, 0.04]} rotation={[0.4, 0, 0.15]} castShadow>
        <boxGeometry args={[0.05, 0.26, 0.05]} />
        <meshStandardMaterial color="#e07020" roughness={0.6} />
      </mesh>
      <mesh position={[0.14, 0.52, 0.04]} rotation={[0.4, 0, -0.15]} castShadow>
        <boxGeometry args={[0.05, 0.26, 0.05]} />
        <meshStandardMaterial color="#e07020" roughness={0.6} />
      </mesh>
      {/* Hands */}
      <mesh position={[-0.16, 0.38, 0.1]}>
        <sphereGeometry args={[0.022, 6, 6]} />
        <meshStandardMaterial color="#d4a574" roughness={0.7} />
      </mesh>
      <mesh position={[0.16, 0.38, 0.1]}>
        <sphereGeometry args={[0.022, 6, 6]} />
        <meshStandardMaterial color="#d4a574" roughness={0.7} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.76, 0]} castShadow>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="#d4a574" roughness={0.6} />
      </mesh>
      {/* Hard hat */}
      <mesh position={[0, 0.82, 0]} castShadow>
        <sphereGeometry args={[0.065, 8, 4, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        <meshStandardMaterial color="#e8e020" roughness={0.4} metalness={0.1} />
      </mesh>
      {/* Boots */}
      <mesh position={[-0.04, 0.02, 0.02]}>
        <boxGeometry args={[0.07, 0.04, 0.1]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.9} />
      </mesh>
      <mesh position={[0.04, 0.02, 0.02]}>
        <boxGeometry args={[0.07, 0.04, 0.1]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.9} />
      </mesh>
    </group>
  );
}

function WorkStation({ offset, mirror }: { offset: number; mirror: boolean }) {
  const mz = mirror ? -1 : 1;
  const zBase = offset * mz;

  return (
    <group position={[0, 0, zBase]}>

      {/* ── Branch conveyor from main line ── */}
      <group position={[-0.6, 0, 0]}>
        {/* Side rails */}
        {[-0.13 * mz, 0.13 * mz].map((z, i) => (
          <mesh key={`br${i}`} position={[0, 0.36, z]}>
            <boxGeometry args={[0.6, 0.02, 0.012]} />
            <meshPhysicalMaterial {...M.paintedSteel} />
          </mesh>
        ))}
        {/* Rollers */}
        {Array.from({ length: 6 }).map((_, i) => (
          <mesh key={`brl${i}`} position={[-0.25 + i * 0.1, 0.345, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.24, 8]} />
            <meshPhysicalMaterial {...M.machinedSteel} />
          </mesh>
        ))}
        {/* Legs */}
        {[[-0.25, -0.1 * mz], [0.25, -0.1 * mz], [-0.25, 0.1 * mz], [0.25, 0.1 * mz]].map(([x, z], i) => (
          <mesh key={`blt${i}`} position={[x, 0.17, z]}>
            <boxGeometry args={[0.02, 0.34, 0.02]} />
            <meshPhysicalMaterial {...M.paintedSteel} />
          </mesh>
        ))}
      </group>

      {/* ── Work table ── */}
      <group position={[0.1, 0, 0]}>
        {/* Table top */}
        <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.8, 0.03, 0.5]} />
          <meshStandardMaterial color="#8a9aaa" roughness={0.5} metalness={0.3} />
        </mesh>
        {/* Table legs */}
        {[[-0.35, -0.2], [0.35, -0.2], [-0.35, 0.2], [0.35, 0.2]].map(([x, z], i) => (
          <mesh key={`tl${i}`} position={[x, 0.21, z]}>
            <boxGeometry args={[0.025, 0.42, 0.025]} />
            <meshPhysicalMaterial {...M.machinedSteel} />
          </mesh>
        ))}
        {/* Lower shelf */}
        <mesh position={[0, 0.12, 0]} receiveShadow>
          <boxGeometry args={[0.7, 0.015, 0.4]} />
          <meshStandardMaterial color="#6a7a8a" roughness={0.6} metalness={0.2} />
        </mesh>

        {/* Closed box (incoming) */}
        <mesh position={[-0.2, 0.51, 0.05]} castShadow>
          <boxGeometry args={[0.2, 0.14, 0.18]} />
          <meshPhysicalMaterial {...M.cardboard} />
        </mesh>
        {/* Open box (being unpacked) — bottom + side flaps */}
        <group position={[0.1, 0.44, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.2, 0.04, 0.18]} />
            <meshPhysicalMaterial {...M.cardboard} />
          </mesh>
          {/* Left flap (folded open) */}
          <mesh position={[-0.1, 0.04, 0]} rotation={[0, 0, -0.8]}>
            <boxGeometry args={[0.08, 0.003, 0.17]} />
            <meshPhysicalMaterial {...M.cardboard} />
          </mesh>
          {/* Right flap */}
          <mesh position={[0.1, 0.04, 0]} rotation={[0, 0, 0.8]}>
            <boxGeometry args={[0.08, 0.003, 0.17]} />
            <meshPhysicalMaterial {...M.cardboard} />
          </mesh>
          {/* Items inside (small colored boxes) */}
          <mesh position={[-0.04, 0.04, -0.03]}>
            <boxGeometry args={[0.06, 0.05, 0.06]} />
            <meshStandardMaterial color="#4488cc" roughness={0.5} />
          </mesh>
          <mesh position={[0.04, 0.04, 0.03]}>
            <boxGeometry args={[0.05, 0.05, 0.05]} />
            <meshStandardMaterial color="#44cc66" roughness={0.5} />
          </mesh>
        </group>

        {/* Unpacked items — small product boxes */}
        <mesh position={[0.28, 0.47, -0.12]} castShadow>
          <boxGeometry args={[0.06, 0.06, 0.06]} />
          <meshStandardMaterial color="#cc4444" roughness={0.5} />
        </mesh>
        <mesh position={[0.28, 0.47, 0.0]} castShadow>
          <boxGeometry args={[0.05, 0.05, 0.05]} />
          <meshStandardMaterial color="#4488cc" roughness={0.5} />
        </mesh>
        <mesh position={[0.28, 0.47, 0.1]} castShadow>
          <boxGeometry args={[0.055, 0.055, 0.055]} />
          <meshStandardMaterial color="#44cc66" roughness={0.5} />
        </mesh>

        {/* Name tag / barcode on station */}
        <Nameplate position={[0.401, 0.42, 0]} rotation={[0, Math.PI / 2, 0]} width={0.04} height={0.015} />
      </group>

      {/* ── Operator ── */}
      <OperatorFigure position={[0.1, 0, 0.35 * mz]} />

      {/* ── Output conveyor toward AutoStore ── */}
      <group position={[0.8, 0, 0]}>
        {[-0.1 * mz, 0.1 * mz].map((z, i) => (
          <mesh key={`or${i}`} position={[0, 0.36, z]}>
            <boxGeometry args={[0.5, 0.02, 0.012]} />
            <meshPhysicalMaterial {...M.paintedSteel} />
          </mesh>
        ))}
        {Array.from({ length: 5 }).map((_, i) => (
          <mesh key={`orl${i}`} position={[-0.2 + i * 0.1, 0.345, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.01, 0.01, 0.18, 8]} />
            <meshPhysicalMaterial {...M.machinedSteel} />
          </mesh>
        ))}
        {[[-0.2, -0.08 * mz], [0.2, -0.08 * mz], [-0.2, 0.08 * mz], [0.2, 0.08 * mz]].map(([x, z], i) => (
          <mesh key={`olt${i}`} position={[x, 0.17, z]}>
            <boxGeometry args={[0.018, 0.34, 0.018]} />
            <meshPhysicalMaterial {...M.paintedSteel} />
          </mesh>
        ))}
        {/* Product box on output */}
        <mesh position={[0, 0.39, 0]} castShadow>
          <boxGeometry args={[0.08, 0.06, 0.08]} />
          <meshStandardMaterial color="#4488cc" roughness={0.5} />
        </mesh>
      </group>

      {/* ── Anti-fatigue mat ── */}
      <mesh position={[0.1, 0.005, 0.35 * mz]} receiveShadow>
        <boxGeometry args={[0.7, 0.01, 0.4]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.95} />
      </mesh>
    </group>
  );
}

export function DecantingStations() {
  const emergency = useStore(s => s.emergencyStop);
  const conveyorRunning = useStore(s => s.conveyorRunning);
  const active = conveyorRunning && !emergency;

  return (
    <group position={[3, 0, 0]}>

      {/* ── Feed conveyor from main line ── */}
      <group position={[-0.8, 0, 0]}>
        {[-0.16, 0.16].map((z, i) => (
          <mesh key={`fr${i}`} position={[0, 0.36, z]}>
            <boxGeometry args={[0.8, 0.025, 0.015]} />
            <meshPhysicalMaterial {...M.paintedSteel} />
          </mesh>
        ))}
        {Array.from({ length: 8 }).map((_, i) => (
          <mesh key={`frl${i}`} position={[-0.35 + i * 0.1, 0.345, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.013, 0.013, 0.3, 8]} />
            <meshPhysicalMaterial {...M.machinedSteel} />
          </mesh>
        ))}
        {[[-0.35, -0.13], [0.35, -0.13], [-0.35, 0.13], [0.35, 0.13]].map(([x, z], i) => (
          <mesh key={`flt${i}`} position={[x, 0.17, z]}>
            <boxGeometry args={[0.02, 0.34, 0.02]} />
            <meshPhysicalMaterial {...M.paintedSteel} />
          </mesh>
        ))}
      </group>

      {/* ── Station 1 (front) ── */}
      <WorkStation offset={0.9} mirror={false} />

      {/* ── Station 2 (back) ── */}
      <WorkStation offset={0.9} mirror={true} />

      {/* ── Merge conveyor toward AutoStore ── */}
      <group position={[1.4, 0, 0]}>
        {[-0.16, 0.16].map((z, i) => (
          <mesh key={`mr${i}`} position={[0, 0.36, z]}>
            <boxGeometry args={[0.6, 0.025, 0.015]} />
            <meshPhysicalMaterial {...M.paintedSteel} />
          </mesh>
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <mesh key={`mrl${i}`} position={[-0.25 + i * 0.1, 0.345, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.013, 0.013, 0.3, 8]} />
            <meshPhysicalMaterial {...M.machinedSteel} />
          </mesh>
        ))}
        {[[-0.25, -0.13], [0.25, -0.13], [-0.25, 0.13], [0.25, 0.13]].map(([x, z], i) => (
          <mesh key={`mlt${i}`} position={[x, 0.17, z]}>
            <boxGeometry args={[0.02, 0.34, 0.02]} />
            <meshPhysicalMaterial {...M.paintedSteel} />
          </mesh>
        ))}
      </group>

      {/* ── Light stack ── */}
      <LightStack position={[-0.8, 0.5, 0.3]} activeIndex={active ? 2 : 1} />

      {/* ── Station number labels ── */}
      <Nameplate position={[-0.4, 0.4, 0.9]} rotation={[0, 0, 0]} width={0.06} height={0.02} />
      <Nameplate position={[-0.4, 0.4, -0.9]} rotation={[0, Math.PI, 0]} width={0.06} height={0.02} />

      {/* ── Cable run along floor ── */}
      <Cable
        points={[[-1.0, 0.01, 0.3], [0, 0.01, 0.3], [1.0, 0.01, 0.3]]}
        radius={0.008}
        color="#2a2a2a"
      />

      {/* ── Warning label ── */}
      <WarningLabel position={[-1.1, 0.3, 0]} rotation={[0, -Math.PI / 2, 0]} />
    </group>
  );
}
