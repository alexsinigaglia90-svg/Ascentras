import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../state/store';
import { Cable } from '../props/Cable';
import * as M from '../materials/materialPresets';
import { SafetyFence, AccessGate } from '../props/SafetyFence';
import { Fasteners } from '../props/Fasteners';
import { SafetyBeacon, LightStack, StatusLED, LightCurtain } from '../props/BeaconsAndIndicators';
import { WarningLabel, Nameplate } from '../props/DecalsAndLabels';
import { DragChain } from '../props/CablesAndTrays';

/** ────────────────────────────────────────────────────
 *  Depalletizer Rig — FANUC/KUKA-grade 6-axis robot
 *  with real pick-and-place animation cycle, vacuum
 *  gripper + manifold, infeed pallet magazine, outfeed
 *  conveyor, full perimeter safety fence with access
 *  gate + light-curtain, beacon, control cabinet.
 *  ──────────────────────────────────────────────────── */

/* ---------- Animation key-frames (normalised 0→1) ----------
   0.00–0.15  rotate to pallet
   0.15–0.30  descend onto box
   0.30–0.35  grip (suction on)
   0.35–0.50  lift
   0.50–0.65  rotate to outfeed
   0.65–0.80  descend to place
   0.80–0.85  release
   0.85–1.00  return to idle                          */

function animPhase(t: number) {
  const p = t % 1;
  if (p < 0.15) return { phase: 'rotateToSource', f: p / 0.15 };
  if (p < 0.30) return { phase: 'descend', f: (p - 0.15) / 0.15 };
  if (p < 0.35) return { phase: 'grip', f: (p - 0.30) / 0.05 };
  if (p < 0.50) return { phase: 'lift', f: (p - 0.35) / 0.15 };
  if (p < 0.65) return { phase: 'rotateToPlace', f: (p - 0.50) / 0.15 };
  if (p < 0.80) return { phase: 'place', f: (p - 0.65) / 0.15 };
  if (p < 0.85) return { phase: 'release', f: (p - 0.80) / 0.05 };
  return { phase: 'returnIdle', f: (p - 0.85) / 0.15 };
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function ease(t: number) { return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2; }

/* ===== COMPONENT ===== */
export function DepalletizerRig() {
  const j1Ref = useRef<THREE.Group>(null!);   // base yaw
  const j2Ref = useRef<THREE.Group>(null!);   // shoulder pitch
  const j3Ref = useRef<THREE.Group>(null!);   // elbow pitch
  const j5Ref = useRef<THREE.Group>(null!);   // wrist pitch
  const gripRef = useRef<THREE.Group>(null!);

  const running = useStore(s => s.depalletizerRunning);
  const speed = useStore(s => s.depalletizerSpeed);
  const fault = useStore(s => s.depalletizerFault);
  const emergency = useStore(s => s.emergencyStop);

  // Bolt positions for base ring
  const baseBolts = useMemo(() => {
    const arr: [number, number, number][] = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      arr.push([Math.cos(a) * 0.38, 0.17, Math.sin(a) * 0.38]);
    }
    return arr;
  }, []);

  useFrame(() => {
    const active = running && !fault && !emergency;
    const time = performance.now() * 0.001;
    const cycleSpeed = (speed / 100) * 0.4;  // slower = more realistic
    const t = active ? (time * cycleSpeed) % 1.0 : 0;

    // key poses (radians)
    const srcYaw = -0.5;   // toward pallet
    const dstYaw = 0.5;    // toward outfeed
    const downShoulder = 0.35;
    const upShoulder = -0.15;
    const downElbow = -0.55;
    const upElbow = -0.2;

    if (!j1Ref.current) return;

    if (!active) {
      // idle / parked
      j1Ref.current.rotation.y *= 0.95;
      if (j2Ref.current) j2Ref.current.rotation.z *= 0.95;
      if (j3Ref.current) j3Ref.current.rotation.z *= 0.95;
      if (j5Ref.current) j5Ref.current.rotation.z *= 0.95;
      return;
    }

    const { phase, f } = animPhase(t);
    const e = ease(f);

    switch (phase) {
      case 'rotateToSource':
        j1Ref.current.rotation.y = lerp(0, srcYaw, e);
        if (j2Ref.current) j2Ref.current.rotation.z = lerp(upShoulder, upShoulder, e);
        if (j3Ref.current) j3Ref.current.rotation.z = upElbow;
        break;
      case 'descend':
        j1Ref.current.rotation.y = srcYaw;
        if (j2Ref.current) j2Ref.current.rotation.z = lerp(upShoulder, downShoulder, e);
        if (j3Ref.current) j3Ref.current.rotation.z = lerp(upElbow, downElbow, e);
        break;
      case 'grip':
        break;
      case 'lift':
        if (j2Ref.current) j2Ref.current.rotation.z = lerp(downShoulder, upShoulder, e);
        if (j3Ref.current) j3Ref.current.rotation.z = lerp(downElbow, upElbow, e);
        break;
      case 'rotateToPlace':
        j1Ref.current.rotation.y = lerp(srcYaw, dstYaw, e);
        break;
      case 'place':
        if (j2Ref.current) j2Ref.current.rotation.z = lerp(upShoulder, downShoulder * 0.8, e);
        if (j3Ref.current) j3Ref.current.rotation.z = lerp(upElbow, downElbow * 0.7, e);
        break;
      case 'release':
        break;
      case 'returnIdle':
        j1Ref.current.rotation.y = lerp(dstYaw, 0, e);
        if (j2Ref.current) j2Ref.current.rotation.z = lerp(downShoulder * 0.8, upShoulder, e);
        if (j3Ref.current) j3Ref.current.rotation.z = lerp(downElbow * 0.7, upElbow, e);
        break;
    }

    // Fault vibrate
    if (fault && j1Ref.current) {
      j1Ref.current.rotation.z = Math.sin(time * 18) * 0.02;
    } else if (j1Ref.current) {
      j1Ref.current.rotation.z = 0;
    }
  });

  const armColor = fault ? '#7a2828' : '#e8a020';  // FANUC yellow or red-fault

  return (
    <group position={[-3.5, 0, -1.5]}>

      {/* ══════════ ROBOT BASE ══════════ */}
      {/* Floor anchor plate */}
      <mesh position={[0, 0.005, 0]} receiveShadow>
        <boxGeometry args={[0.7, 0.01, 0.7]} />
        <meshPhysicalMaterial {...M.castIron} />
      </mesh>
      {/* Pedestal */}
      <mesh position={[0, 0.09, 0]} castShadow>
        <cylinderGeometry args={[0.26, 0.32, 0.16, 16]} />
        <meshPhysicalMaterial {...M.paintedSteel} />
      </mesh>
      {/* Base housing */}
      <mesh position={[0, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.26, 0.1, 16]} />
        <meshPhysicalMaterial color={armColor} roughness={0.35} metalness={0.45} clearcoat={0.2} clearcoatRoughness={0.4} />
      </mesh>
      {/* Base bolts */}
      <Fasteners positions={baseBolts} />
      {/* FANUC logo plate */}
      <Nameplate position={[0.22, 0.22, 0.15]} rotation={[0, 0.6, 0]} width={0.05} height={0.02} />

      {/* ══════════ J1 — BASE ROTATION ══════════ */}
      <group ref={j1Ref} position={[0, 0.27, 0]}>
        {/* J1 turret */}
        <mesh castShadow>
          <cylinderGeometry args={[0.18, 0.2, 0.08, 12]} />
          <meshPhysicalMaterial color={armColor} roughness={0.35} metalness={0.45} clearcoat={0.2} clearcoatRoughness={0.4} />
        </mesh>

        {/* ══════════ J2 — SHOULDER ══════════ */}
        <group ref={j2Ref} position={[0, 0.06, 0]}>
          {/* Shoulder motor housing */}
          <mesh position={[0, 0.06, 0]} castShadow>
            <cylinderGeometry args={[0.09, 0.09, 0.12, 10]} />
            <meshPhysicalMaterial color={armColor} roughness={0.35} metalness={0.45} clearcoat={0.2} clearcoatRoughness={0.4} />
          </mesh>
          {/* Shoulder cover plates (left/right) */}
          {[-0.09, 0.09].map((x, i) => (
            <mesh key={`shp${i}`} position={[x, 0.06, 0]}>
              <cylinderGeometry args={[0.04, 0.04, 0.13, 8]} />
              <meshPhysicalMaterial {...M.machinedSteel} />
            </mesh>
          ))}

          {/* Lower arm (L-link) */}
          <mesh position={[0, 0.42, 0.02]} castShadow>
            <boxGeometry args={[0.1, 0.6, 0.08]} />
            <meshPhysicalMaterial color={armColor} roughness={0.35} metalness={0.45} clearcoat={0.2} clearcoatRoughness={0.4} />
          </mesh>
          {/* Arm rib / stiffener */}
          <mesh position={[0, 0.42, 0.065]}>
            <boxGeometry args={[0.06, 0.5, 0.005]} />
            <meshPhysicalMaterial {...M.machinedSteel} />
          </mesh>

          {/* Cable routing along lower arm */}
          <Cable
            points={[[-0.06, 0.12, 0.05], [-0.07, 0.3, 0.06], [-0.055, 0.5, 0.05], [-0.06, 0.68, 0.055]]}
            radius={0.007}
            color="#2a2a2a"
          />
          <Cable
            points={[[0.06, 0.13, 0.05], [0.055, 0.35, 0.06], [0.06, 0.55, 0.055], [0.055, 0.68, 0.055]]}
            radius={0.005}
            color="#2a3a5a"
          />

          {/* ══════════ J3 — ELBOW ══════════ */}
          <group ref={j3Ref} position={[0, 0.72, 0]}>
            {/* Elbow motor housing */}
            <mesh castShadow>
              <cylinderGeometry args={[0.065, 0.065, 0.09, 10]} />
              <meshPhysicalMaterial color={armColor} roughness={0.35} metalness={0.45} clearcoat={0.2} clearcoatRoughness={0.4} />
            </mesh>
            {/* Elbow cover discs */}
            {[-0.065, 0.065].map((x, i) => (
              <mesh key={`elb${i}`} position={[x, 0, 0]}>
                <cylinderGeometry args={[0.03, 0.03, 0.1, 8]} />
                <meshPhysicalMaterial {...M.machinedSteel} />
              </mesh>
            ))}

            {/* Upper arm */}
            <mesh position={[0, 0.28, 0.015]} castShadow>
              <boxGeometry args={[0.08, 0.45, 0.07]} />
              <meshPhysicalMaterial color={armColor} roughness={0.35} metalness={0.45} clearcoat={0.2} clearcoatRoughness={0.4} />
            </mesh>

            {/* ══════════ J4/J5 — WRIST ══════════ */}
            <group ref={j5Ref} position={[0, 0.52, 0]}>
              {/* Wrist cylinder */}
              <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.04, 0.04, 0.1, 10]} />
                <meshPhysicalMaterial color={armColor} roughness={0.35} metalness={0.45} clearcoat={0.2} clearcoatRoughness={0.4} />
              </mesh>
              {/* J6 flange disc */}
              <mesh position={[0, -0.04, 0]}>
                <cylinderGeometry args={[0.05, 0.05, 0.015, 12]} />
                <meshPhysicalMaterial {...M.machinedSteel} />
              </mesh>

              {/* ══════════ VACUUM GRIPPER ══════════ */}
              <group ref={gripRef} position={[0, -0.06, 0]}>
                {/* Manifold block */}
                <mesh castShadow>
                  <boxGeometry args={[0.2, 0.03, 0.15]} />
                  <meshPhysicalMaterial {...M.brushedAluminium} />
                </mesh>
                {/* Vacuum hose fittings */}
                {[-0.06, 0, 0.06].map((z, i) => (
                  <mesh key={`vf${i}`} position={[0.1, 0.01, z]}>
                    <cylinderGeometry args={[0.006, 0.006, 0.02, 6]} />
                    <meshPhysicalMaterial {...M.brass} />
                  </mesh>
                ))}
                {/* Suction cups — 2×3 grid */}
                {[[-0.06, -0.05], [0, -0.05], [0.06, -0.05], [-0.06, 0.05], [0, 0.05], [0.06, 0.05]].map(([x, z], i) => (
                  <group key={`cup${i}`} position={[x, -0.025, z]}>
                    <mesh>
                      <cylinderGeometry args={[0.018, 0.022, 0.015, 8]} />
                      <meshPhysicalMaterial {...M.rubber} />
                    </mesh>
                    <mesh position={[0, -0.012, 0]}>
                      <cylinderGeometry args={[0.022, 0.015, 0.008, 8]} />
                      <meshPhysicalMaterial {...M.rubber} />
                    </mesh>
                  </group>
                ))}
                {/* Air hose from manifold */}
                <Cable
                  points={[[0.1, 0.02, 0], [0.12, 0.08, 0.02], [0.1, 0.18, 0.01]]}
                  radius={0.006}
                  color="#304a6a"
                />
              </group>
            </group>

            {/* Drag chain along upper arm */}
            <DragChain from={[0.05, 0.05, 0.05]} to={[0.04, 0.45, 0.05]} segmentCount={10} />
          </group>
        </group>
      </group>

      {/* ══════════ INFEED — PALLET MAGAZINE ══════════ */}
      <group position={[-0.9, 0, 0]}>
        {/* Pallet stack (3 pallets) */}
        {[0, 0.11, 0.22].map((y, i) => (
          <group key={`pal${i}`}>
            <mesh position={[0, y + 0.05, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.65, 0.015, 0.55]} />
              <meshPhysicalMaterial {...M.palletWood} />
            </mesh>
            {[-0.2, 0, 0.2].map((z, j) => (
              <mesh key={`bb${j}`} position={[0, y + 0.02, z]}>
                <boxGeometry args={[0.65, 0.012, 0.08]} />
                <meshPhysicalMaterial {...M.palletWood} />
              </mesh>
            ))}
            {[-0.22, 0, 0.22].map((x, j) => (
              <mesh key={`st${j}`} position={[x, y + 0.035, 0]}>
                <boxGeometry args={[0.08, 0.06, 0.55]} />
                <meshPhysicalMaterial {...M.palletWood} />
              </mesh>
            ))}
          </group>
        ))}
        {/* Boxes on top pallet */}
        {[[-0.15, 0.34, -0.12], [0.1, 0.34, -0.1], [-0.08, 0.34, 0.12], [0.12, 0.34, 0.1]].map(([x, y, z], i) => (
          <mesh key={`cbox${i}`} position={[x, y, z]} castShadow>
            <boxGeometry args={[0.2, 0.14, 0.18]} />
            <meshPhysicalMaterial {...M.cardboard} />
          </mesh>
        ))}
      </group>

      {/* ══════════ OUTFEED CONVEYOR SECTION ══════════ */}
      <group position={[0.9, 0, 0.2]}>
        {[-0.18, 0.18].map((z, i) => (
          <mesh key={`rail${i}`} position={[0, 0.38, z]}>
            <boxGeometry args={[0.8, 0.03, 0.015]} />
            <meshPhysicalMaterial {...M.paintedSteel} />
          </mesh>
        ))}
        {Array.from({ length: 8 }).map((_, i) => {
          const x = -0.35 + i * 0.1;
          return (
            <mesh key={`rl${i}`} position={[x, 0.36, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.015, 0.015, 0.34, 8]} />
              <meshPhysicalMaterial {...M.machinedSteel} />
            </mesh>
          );
        })}
        {[[-0.3, -0.15], [0.3, -0.15], [-0.3, 0.15], [0.3, 0.15]].map(([x, z], i) => (
          <mesh key={`leg${i}`} position={[x, 0.18, z]}>
            <boxGeometry args={[0.025, 0.36, 0.025]} />
            <meshPhysicalMaterial {...M.paintedSteel} />
          </mesh>
        ))}
        <mesh position={[0, 0.44, 0]} castShadow>
          <boxGeometry args={[0.18, 0.12, 0.16]} />
          <meshPhysicalMaterial {...M.cardboard} />
        </mesh>
      </group>

      {/* ══════════ SAFETY PERIMETER ══════════ */}
      <SafetyFence
        corners={[
          [-1.5, -1.0],
          [-1.5, 1.0],
          [1.6, 1.0],
          [1.6, -1.0],
        ]}
      />
      <SafetyFence
        corners={[
          [1.6, -1.0],
          [-1.5, -1.0],
        ]}
      />
      <AccessGate position={[0, 0, 1.0]} rotation={[0, 0, 0]} width={0.7} height={0.9} />
      <LightCurtain position={[0.4, 0, 1.0]} rotation={[0, 0, 0]} height={0.85} gap={0.08} />

      {/* ══════════ CONTROL CABINET ══════════ */}
      <group position={[1.3, 0, -0.6]}>
        <mesh position={[0, 0.45, 0]} castShadow>
          <boxGeometry args={[0.35, 0.9, 0.22]} />
          <meshPhysicalMaterial {...M.darkEnclosure} />
        </mesh>
        <mesh position={[0.176, 0.5, 0]}>
          <boxGeometry args={[0.008, 0.1, 0.015]} />
          <meshPhysicalMaterial {...M.machinedSteel} />
        </mesh>
        <mesh position={[0, 0.45, 0.111]}>
          <boxGeometry args={[0.003, 0.85, 0.003]} />
          <meshPhysicalMaterial color="#222" roughness={0.8} metalness={0.1} />
        </mesh>
        {[-0.05, 0, 0.05, 0.1, 0.15].map((y, i) => (
          <mesh key={`vs${i}`} position={[0, 0.15 + y, 0.111]}>
            <planeGeometry args={[0.22, 0.008]} />
            <meshStandardMaterial color="#2a2a2a" roughness={0.9} />
          </mesh>
        ))}
        <StatusLED position={[-0.06, 0.82, 0.111]} color="#00ff44" on={running && !fault} />
        <StatusLED position={[0, 0.82, 0.111]} color="#ff8800" on={!running && !fault} />
        <StatusLED position={[0.06, 0.82, 0.111]} color="#ff2020" on={fault} />
        <Nameplate position={[0, 0.7, 0.112]} rotation={[0, 0, 0]} />
        <mesh position={[0.1, 0.6, 0.115]}>
          <cylinderGeometry args={[0.018, 0.018, 0.015, 12]} />
          <meshPhysicalMaterial {...M.safetyRed} />
        </mesh>
      </group>

      {/* ══════════ BEACON & LIGHT STACK ══════════ */}
      <SafetyBeacon
        position={[-1.5, 0.95, -1.0]}
        color={fault ? '#ff2020' : running ? '#ff8800' : '#888888'}
        speed={fault ? 4 : 1.5}
      />
      <LightStack position={[1.3, 0.95, -0.6]} activeIndex={fault ? 0 : running ? 2 : 1} />

      {/* ══════════ WARNING LABELS ══════════ */}
      <WarningLabel position={[-1.48, 0.5, -0.5]} rotation={[0, Math.PI / 2, 0]} />
      <WarningLabel position={[0, 0.5, -0.98]} rotation={[0, 0, 0]} color="#ff3030" width={0.08} height={0.05} />
    </group>
  );
}
