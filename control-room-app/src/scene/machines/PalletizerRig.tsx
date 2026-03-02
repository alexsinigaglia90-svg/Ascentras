import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../state/store';
import { Cable } from '../props/Cable';
import * as M from '../materials/materialPresets';
import { SafetyFence, AccessGate } from '../props/SafetyFence';
import { SafetyBeacon, LightStack, StatusLED, LightCurtain } from '../props/BeaconsAndIndicators';
import { WarningLabel, Nameplate } from '../props/DecalsAndLabels';
import { DragChain } from '../props/CablesAndTrays';
import { Fasteners } from '../props/Fasteners';

/** ────────────────────────────────────────────────────
 *  Palletizer Rig — Aluminium-extrusion gantry frame
 *  with corner gussets, linear-rail X/Y axes, vertical
 *  Z actuator, pusher head, infeed/outfeed conveyors
 *  with stop gates + sensors, pallet with visible stacking
 *  sequence. Full safety guarding + interlock gate, light
 *  stack, pneumatic unit, control panel, cable runs.
 *  ──────────────────────────────────────────────────── */

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function ease(t: number) { return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2; }

export function PalletizerRig() {
  const headRef = useRef<THREE.Group>(null!);
  const pusherRef = useRef<THREE.Mesh>(null!);

  const running = useStore(s => s.palletizerRunning);
  const pattern = useStore(s => s.palletizerPattern);
  const emergency = useStore(s => s.emergencyStop);

  useFrame(() => {
    if (!headRef.current) return;
    const time = performance.now() * 0.001;
    const active = running && !emergency;

    if (active) {
      const cycle = (time * 0.5) % 1;
      const e = ease(cycle < 0.5 ? cycle * 2 : 2 - cycle * 2);

      if (pattern === 'A') {
        // Pattern A: side-to-side + forward stacking
        headRef.current.position.x = lerp(-0.3, 0.3, e);
        headRef.current.position.z = Math.sin(time * 1.2) * 0.15;
      } else {
        // Pattern B: circular stacking pattern
        headRef.current.position.x = Math.cos(time * 1.5) * 0.25;
        headRef.current.position.z = Math.sin(time * 1.5) * 0.18;
      }
      // Vertical lift cycle
      const vCycle = (time * 0.8) % 1;
      headRef.current.position.y = 1.3 + Math.abs(Math.sin(vCycle * Math.PI)) * 0.25;

      // Pusher action
      if (pusherRef.current) {
        const pushPhase = (time * 1.5) % 1;
        pusherRef.current.position.y = pushPhase < 0.3 ? lerp(0, -0.15, pushPhase / 0.3) : lerp(-0.15, 0, (pushPhase - 0.3) / 0.7);
      }
    }
  });

  const FW = 1.4;   // frame width
  const FD = 1.0;   // frame depth
  const FH = 1.9;   // frame height

  /* Gusset bracket at top joints */
  const gussets: [number, number, number][] = [
    [-FW / 2, FH - 0.06, -FD / 2], [FW / 2, FH - 0.06, -FD / 2],
    [-FW / 2, FH - 0.06, FD / 2], [FW / 2, FH - 0.06, FD / 2],
  ];

  return (
    <group position={[3.5, 0, 2.5]}>

      {/* ══════════ ALUMINIUM EXTRUSION FRAME ══════════ */}
      {/* Uprights */}
      {[[-FW / 2, -FD / 2], [FW / 2, -FD / 2], [-FW / 2, FD / 2], [FW / 2, FD / 2]].map(([x, z], i) => (
        <group key={`up${i}`}>
          <mesh position={[x, FH / 2, z]} castShadow>
            <boxGeometry args={[0.045, FH, 0.045]} />
            <meshPhysicalMaterial {...M.brushedAluminium} />
          </mesh>
          {/* T-slot detail line */}
          <mesh position={[x + 0.024, FH / 2, z]}>
            <boxGeometry args={[0.003, FH - 0.1, 0.015]} />
            <meshPhysicalMaterial color="#888" roughness={0.5} metalness={0.6} />
          </mesh>
          {/* Foot plate + levelling pad */}
          <mesh position={[x, 0.005, z]} receiveShadow>
            <boxGeometry args={[0.1, 0.01, 0.1]} />
            <meshPhysicalMaterial {...M.castIron} />
          </mesh>
          <mesh position={[x, 0.015, z]}>
            <cylinderGeometry args={[0.015, 0.02, 0.01, 8]} />
            <meshPhysicalMaterial {...M.machinedSteel} />
          </mesh>
        </group>
      ))}

      {/* Top beams (X direction) */}
      {[-FD / 2, FD / 2].map((z, i) => (
        <mesh key={`tbx${i}`} position={[0, FH, z]}>
          <boxGeometry args={[FW + 0.05, 0.045, 0.045]} />
          <meshPhysicalMaterial {...M.brushedAluminium} />
        </mesh>
      ))}
      {/* Top beams (Z direction) */}
      {[-FW / 2, FW / 2].map((x, i) => (
        <mesh key={`tbz${i}`} position={[x, FH, 0]}>
          <boxGeometry args={[0.045, 0.045, FD + 0.05]} />
          <meshPhysicalMaterial {...M.brushedAluminium} />
        </mesh>
      ))}

      {/* Corner gusset brackets */}
      {gussets.map(([x, y, z], i) => (
        <mesh key={`gus${i}`} position={[x, y, z]} castShadow>
          <boxGeometry args={[0.08, 0.12, 0.08]} />
          <meshPhysicalMaterial {...M.brushedAluminium} />
        </mesh>
      ))}
      {/* Mid-height cross braces (back face) */}
      <mesh position={[0, FH * 0.5, -FD / 2]}>
        <boxGeometry args={[FW, 0.03, 0.03]} />
        <meshPhysicalMaterial {...M.brushedAluminium} />
      </mesh>

      {/* ══════════ LINEAR RAILS (X-axis on top) ══════════ */}
      {[-0.2, 0.2].map((z, i) => (
        <group key={`xrail${i}`}>
          {/* Rail */}
          <mesh position={[0, FH - 0.04, z]}>
            <boxGeometry args={[FW - 0.1, 0.012, 0.025]} />
            <meshPhysicalMaterial {...M.chrome} />
          </mesh>
          {/* Bearing blocks */}
          {[-0.3, 0, 0.3].map((bx, bi) => (
            <mesh key={bi} position={[bx, FH - 0.05, z]}>
              <boxGeometry args={[0.05, 0.018, 0.04]} />
              <meshPhysicalMaterial {...M.machinedSteel} />
            </mesh>
          ))}
        </group>
      ))}

      {/* ══════════ GANTRY HEAD ══════════ */}
      <group ref={headRef} position={[0, 1.4, 0]}>
        {/* X-carriage plate */}
        <mesh castShadow>
          <boxGeometry args={[0.35, 0.04, 0.5]} />
          <meshPhysicalMaterial {...M.brushedAluminium} />
        </mesh>
        {/* Z-axis actuator (vertical) */}
        <mesh position={[0, -0.15, 0]}>
          <cylinderGeometry args={[0.018, 0.018, 0.3, 8]} />
          <meshPhysicalMaterial {...M.chrome} />
        </mesh>
        {/* Z guide rail */}
        <mesh position={[0.03, -0.15, 0]}>
          <boxGeometry args={[0.008, 0.28, 0.008]} />
          <meshPhysicalMaterial {...M.machinedSteel} />
        </mesh>
        {/* Pusher / gripper head */}
        <mesh ref={pusherRef} position={[0, -0.3, 0]} castShadow>
          <boxGeometry args={[0.28, 0.04, 0.22]} />
          <meshPhysicalMaterial color="#e08020" roughness={0.35} metalness={0.45} clearcoat={0.2} clearcoatRoughness={0.4} />
        </mesh>
        {/* Suction / grip pads */}
        {[[-0.08, -0.05], [0.08, -0.05], [-0.08, 0.05], [0.08, 0.05]].map(([x, z], i) => (
          <mesh key={`pad${i}`} position={[x, -0.34, z]}>
            <cylinderGeometry args={[0.015, 0.018, 0.01, 8]} />
            <meshPhysicalMaterial {...M.rubber} />
          </mesh>
        ))}
      </group>

      {/* Drag chain from carriage to frame */}
      <DragChain from={[0.55, FH - 0.02, 0.25]} to={[0, FH - 0.06, 0.25]} segmentCount={14} />

      {/* ══════════ OUTPUT PALLET ══════════ */}
      <group position={[0, 0, 0]}>
        {/* Pallet */}
        <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.8, 0.015, 0.6]} />
          <meshPhysicalMaterial {...M.palletWood} />
        </mesh>
        {[-0.25, 0, 0.25].map((z, i) => (
          <mesh key={`ps${i}`} position={[0, 0.025, z]}>
            <boxGeometry args={[0.8, 0.04, 0.06]} />
            <meshPhysicalMaterial {...M.palletWood} />
          </mesh>
        ))}

        {/* Stacked boxes (visible layer pattern) */}
        {running && !emergency && (
          <>
            {/* Layer 1 — pattern A or B */}
            {(pattern === 'A'
              ? [[-0.18, -0.12], [0.18, -0.12], [-0.18, 0.12], [0.18, 0.12]]
              : [[-0.15, 0], [0.15, 0], [0, -0.15], [0, 0.15]]
            ).map(([x, z], i) => (
              <mesh key={`l1_${i}`} position={[x, 0.18, z]} castShadow>
                <boxGeometry args={[0.28, 0.18, 0.22]} />
                <meshPhysicalMaterial {...M.cardboard} />
              </mesh>
            ))}
            {/* Layer 2 (offset) */}
            {[[-0.1, -0.08], [0.1, -0.08], [-0.1, 0.08], [0.1, 0.08]].map(([x, z], i) => (
              <mesh key={`l2_${i}`} position={[x, 0.37, z]} castShadow>
                <boxGeometry args={[0.26, 0.18, 0.20]} />
                <meshPhysicalMaterial color="#8a7a60" roughness={0.8} metalness={0.03} />
              </mesh>
            ))}
          </>
        )}
      </group>

      {/* ══════════ INFEED CONVEYOR ══════════ */}
      <group position={[-FW / 2 - 0.4, 0, 0]}>
        {/* Rails */}
        {[-0.15, 0.15].map((z, i) => (
          <mesh key={`ifr${i}`} position={[0, 0.34, z]}>
            <boxGeometry args={[0.6, 0.025, 0.012]} />
            <meshPhysicalMaterial {...M.paintedSteel} />
          </mesh>
        ))}
        {/* Rollers */}
        {Array.from({ length: 6 }).map((_, i) => (
          <mesh key={`ifrl${i}`} position={[-0.25 + i * 0.1, 0.32, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.28, 8]} />
            <meshPhysicalMaterial {...M.machinedSteel} />
          </mesh>
        ))}
        {/* Support legs */}
        {[[-0.2, -0.12], [0.2, -0.12], [-0.2, 0.12], [0.2, 0.12]].map(([x, z], i) => (
          <mesh key={`ifl${i}`} position={[x, 0.16, z]}>
            <boxGeometry args={[0.02, 0.32, 0.02]} />
            <meshPhysicalMaterial {...M.paintedSteel} />
          </mesh>
        ))}
        {/* Stop gate */}
        <mesh position={[0.25, 0.38, 0]}>
          <boxGeometry args={[0.02, 0.08, 0.28]} />
          <meshPhysicalMaterial {...M.safetyYellow} />
        </mesh>
        {/* Photo sensor */}
        <StatusLED position={[0.22, 0.42, -0.16]} color="#ff2020" on={running} size={0.006} />
        {/* Incoming box */}
        <mesh position={[-0.05, 0.42, 0]} castShadow>
          <boxGeometry args={[0.22, 0.16, 0.18]} />
          <meshPhysicalMaterial {...M.cardboard} />
        </mesh>
      </group>

      {/* ══════════ OUTFEED CONVEYOR ══════════ */}
      <group position={[FW / 2 + 0.4, 0, 0]}>
        {[-0.15, 0.15].map((z, i) => (
          <mesh key={`ofr${i}`} position={[0, 0.34, z]}>
            <boxGeometry args={[0.5, 0.025, 0.012]} />
            <meshPhysicalMaterial {...M.paintedSteel} />
          </mesh>
        ))}
        {Array.from({ length: 5 }).map((_, i) => (
          <mesh key={`ofrl${i}`} position={[-0.2 + i * 0.1, 0.32, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.28, 8]} />
            <meshPhysicalMaterial {...M.machinedSteel} />
          </mesh>
        ))}
        {[[-0.15, -0.12], [0.15, -0.12], [-0.15, 0.12], [0.15, 0.12]].map(([x, z], i) => (
          <mesh key={`ofl${i}`} position={[x, 0.16, z]}>
            <boxGeometry args={[0.02, 0.32, 0.02]} />
            <meshPhysicalMaterial {...M.paintedSteel} />
          </mesh>
        ))}
      </group>

      {/* ══════════ SAFETY GUARDING ══════════ */}
      <SafetyFence
        corners={[
          [-FW / 2 - 0.15, -FD / 2 - 0.15],
          [-FW / 2 - 0.15, FD / 2 + 0.15],
          [FW / 2 + 0.15, FD / 2 + 0.15],
          [FW / 2 + 0.15, -FD / 2 - 0.15],
        ]}
      />
      <SafetyFence
        corners={[
          [FW / 2 + 0.15, -FD / 2 - 0.15],
          [-FW / 2 - 0.15, -FD / 2 - 0.15],
        ]}
      />
      <AccessGate position={[0, 0, FD / 2 + 0.15]} width={0.6} height={0.85} />
      <LightCurtain position={[-FW / 2 - 0.15, 0, 0]} rotation={[0, Math.PI / 2, 0]} height={0.8} gap={0.08} />

      {/* ══════════ CONTROL PANEL ══════════ */}
      <group position={[FW / 2 + 0.1, 0.85, FD / 2 + 0.2]}>
        <mesh castShadow>
          <boxGeometry args={[0.18, 0.35, 0.08]} />
          <meshPhysicalMaterial {...M.darkEnclosure} />
        </mesh>
        {/* Screen */}
        <mesh position={[0, 0.06, 0.041]}>
          <planeGeometry args={[0.12, 0.1]} />
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
          <mesh key={`btn${i}`} position={[x, -0.1, 0.041]}>
            <cylinderGeometry args={[0.012, 0.012, 0.008, 8]} />
            <meshPhysicalMaterial color={i === 0 ? '#40a040' : '#c04040'} roughness={0.3} metalness={0.3} />
          </mesh>
        ))}
        <Nameplate position={[0, 0.14, 0.041]} width={0.07} height={0.018} />
      </group>

      {/* ══════════ PNEUMATIC UNIT ══════════ */}
      <group position={[-FW / 2 - 0.08, 0.12, FD / 2 - 0.1]}>
        <mesh castShadow>
          <boxGeometry args={[0.1, 0.08, 0.06]} />
          <meshPhysicalMaterial {...M.paintedSteel} />
        </mesh>
        {[-0.025, 0, 0.025].map((x, i) => (
          <mesh key={`pv${i}`} position={[x, 0.045, 0]}>
            <cylinderGeometry args={[0.007, 0.007, 0.015, 6]} />
            <meshPhysicalMaterial {...M.brass} />
          </mesh>
        ))}
        {/* Air filter */}
        <mesh position={[0, 0.12, 0]}>
          <cylinderGeometry args={[0.018, 0.018, 0.08, 8]} />
          <meshPhysicalMaterial {...M.paintedSteel} />
        </mesh>
        <mesh position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.022, 0.022, 0.015, 8]} />
          <meshPhysicalMaterial color="#90a0b0" roughness={0.5} metalness={0.3} transparent opacity={0.7} />
        </mesh>
      </group>

      {/* ══════════ LIGHT STACK & BEACON ══════════ */}
      <LightStack position={[FW / 2 + 0.1, 1.25, FD / 2 + 0.2]} activeIndex={running && !emergency ? 2 : emergency ? 0 : 1} />
      <SafetyBeacon
        position={[-FW / 2 - 0.15, 0.95, -FD / 2 - 0.15]}
        color={emergency ? '#ff2020' : '#ff8800'}
        speed={emergency ? 4 : 1.5}
      />

      {/* ══════════ DECALS ══════════ */}
      <WarningLabel position={[FW / 2 + 0.02, 0.5, -FD / 2]} rotation={[0, 0, 0]} />
      <WarningLabel position={[-FW / 2 - 0.02, 0.35, 0]} rotation={[0, -Math.PI / 2, 0]} color="#ff3030" width={0.08} height={0.05} />

      {/* ══════════ CABLE RUNS ══════════ */}
      <Cable
        points={[[FW / 2 + 0.1, 0.7, FD / 2 + 0.25], [FW / 2 + 0.15, 0.4, FD / 2 + 0.3], [FW / 2 + 0.18, 0.05, FD / 2 + 0.35]]}
        radius={0.01}
        color="#2a2a2a"
      />
      <Cable
        points={[[FW / 2 + 0.1, 1.0, FD / 2 + 0.2], [FW / 2 * 0.5, 1.5, FD / 2 * 0.5], [0, FH - 0.05, 0.15]]}
        radius={0.006}
        color="#2a3a4a"
      />
    </group>
  );
}
