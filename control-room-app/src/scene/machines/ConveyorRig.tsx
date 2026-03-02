import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../state/store';
import { Cable } from '../props/Cable';
import * as M from '../materials/materialPresets';
import { SafetyBeacon, StatusLED, LightStack } from '../props/BeaconsAndIndicators';
import { WarningLabel, Nameplate, BarcodeTag } from '../props/DecalsAndLabels';
import { Fasteners } from '../props/Fasteners';

/** ────────────────────────────────────────────────────
 *  Conveyor Rig — Roller conveyor with instanced
 *  rollers, steel side rails, support legs with cross
 *  members, drive motor housings, photoelectric sensors,
 *  divert mechanism (pneumatic pusher), packages with
 *  believable movement, cable tray, e-stop, decals.
 *  ──────────────────────────────────────────────────── */

const ROLLER_COUNT = 40;
const ROLLER_SPACING = 0.16;
const BELT_LEN = ROLLER_COUNT * ROLLER_SPACING;
const BELT_WIDTH = 0.45;

export function ConveyorRig() {
  const groupRef = useRef<THREE.Group>(null!);
  const rollerMeshRef = useRef<THREE.InstancedMesh>(null!);

  const running = useStore(s => s.conveyorRunning);
  const jam = useStore(s => s.conveyorJam);
  const divert = useStore(s => s.conveyorDivert);
  const emergency = useStore(s => s.emergencyStop);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(() => {
    if (!rollerMeshRef.current) return;
    const time = performance.now() * 0.001;
    const active = running && !jam && !emergency;

    for (let i = 0; i < ROLLER_COUNT; i++) {
      const x = (i - ROLLER_COUNT / 2) * ROLLER_SPACING;
      const jitter = jam ? Math.sin(time * 15 + i) * 0.005 : 0;
      dummy.position.set(x, 0, 0);
      dummy.rotation.set(active ? time * 8 : 0, 0, 0); // spin rollers
      dummy.position.y = jitter;
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      rollerMeshRef.current.setMatrixAt(i, dummy.matrix);
    }
    rollerMeshRef.current.instanceMatrix.needsUpdate = true;
  });

  // Leg positions along belt
  const legXs = useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i < 6; i++) arr.push(-BELT_LEN / 2 + 0.5 + i * (BELT_LEN - 1) / 5);
    return arr;
  }, []);

  return (
    <group ref={groupRef} position={[-2, 0.35, 2]}>

      {/* ══════════ SIDE RAILS ══════════ */}
      {[-BELT_WIDTH - 0.02, BELT_WIDTH + 0.02].map((z, i) => (
        <group key={`rail${i}`}>
          {/* Main rail C-channel */}
          <mesh position={[0, 0.03, z]} castShadow>
            <boxGeometry args={[BELT_LEN + 0.1, 0.05, 0.025]} />
            <meshPhysicalMaterial {...M.paintedSteel} />
          </mesh>
          {/* Top lip */}
          <mesh position={[0, 0.058, z + (i === 0 ? 0.015 : -0.015)]}>
            <boxGeometry args={[BELT_LEN + 0.1, 0.008, 0.015]} />
            <meshPhysicalMaterial {...M.machinedSteel} />
          </mesh>
        </group>
      ))}

      {/* ══════════ INSTANCED ROLLERS ══════════ */}
      <instancedMesh ref={rollerMeshRef} args={[undefined, undefined, ROLLER_COUNT]} castShadow>
        <cylinderGeometry args={[0.016, 0.016, BELT_WIDTH * 2, 8]} />
        <meshPhysicalMaterial {...M.machinedSteel} />
      </instancedMesh>

      {/* ══════════ SUPPORT LEGS + CROSS MEMBERS ══════════ */}
      {legXs.map((x, i) => (
        <group key={`leg${i}`}>
          {/* Front + back legs */}
          {[-BELT_WIDTH - 0.03, BELT_WIDTH + 0.03].map((z, zi) => (
            <group key={`lp${zi}`}>
              <mesh position={[x, -0.18, z]} castShadow>
                <boxGeometry args={[0.03, 0.36, 0.03]} />
                <meshPhysicalMaterial {...M.paintedSteel} />
              </mesh>
              {/* Adjustable foot pad */}
              <mesh position={[x, -0.365, z]}>
                <cylinderGeometry args={[0.022, 0.028, 0.008, 8]} />
                <meshPhysicalMaterial {...M.castIron} />
              </mesh>
            </group>
          ))}
          {/* Cross member */}
          <mesh position={[x, -0.28, 0]}>
            <boxGeometry args={[0.02, 0.02, BELT_WIDTH * 2 + 0.06]} />
            <meshPhysicalMaterial {...M.paintedSteel} />
          </mesh>
          {/* Diagonal brace (every other leg) */}
          {i % 2 === 0 && (
            <mesh position={[x, -0.18, 0]} rotation={[0.35, 0, 0]}>
              <boxGeometry args={[0.012, 0.3, 0.012]} />
              <meshPhysicalMaterial {...M.paintedSteel} />
            </mesh>
          )}
        </group>
      ))}

      {/* ══════════ END ROLLERS (larger) ══════════ */}
      {[-BELT_LEN / 2 - 0.02, BELT_LEN / 2 + 0.02].map((x, i) => (
        <mesh key={`end${i}`} position={[x, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, BELT_WIDTH * 2, 12]} />
          <meshPhysicalMaterial {...M.machinedSteel} />
        </mesh>
      ))}

      {/* ══════════ DRIVE MOTOR (head end) ══════════ */}
      <group position={[-BELT_LEN / 2 - 0.12, -0.06, 0]}>
        {/* Motor body */}
        <mesh castShadow>
          <boxGeometry args={[0.16, 0.14, 0.18]} />
          <meshPhysicalMaterial {...M.paintedSteel} />
        </mesh>
        {/* Cooling fins */}
        {Array.from({ length: 6 }).map((_, i) => (
          <mesh key={`fin${i}`} position={[-0.081, -0.05 + i * 0.02, 0]}>
            <boxGeometry args={[0.003, 0.008, 0.16]} />
            <meshStandardMaterial color="#3a4050" metalness={0.5} roughness={0.4} />
          </mesh>
        ))}
        {/* Drive shaft coupling */}
        <mesh position={[0.08, 0.03, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.018, 0.018, 0.04, 8]} />
          <meshPhysicalMaterial {...M.machinedSteel} />
        </mesh>
        {/* Shaft guard */}
        <mesh position={[0.1, 0.03, 0]}>
          <boxGeometry args={[0.04, 0.06, 0.06]} />
          <meshPhysicalMaterial color="#c8a020" roughness={0.4} metalness={0.4} transparent opacity={0.5} />
        </mesh>
        {/* Motor nameplate */}
        <Nameplate position={[0, 0.02, 0.091]} rotation={[0, 0, 0]} width={0.06} height={0.02} />
        {/* Status LED */}
        <StatusLED position={[0.081, 0.05, 0.06]} color="#00ff44" on={running && !emergency} />
        <StatusLED position={[0.081, 0.05, -0.06]} color="#ff2020" on={jam} />
      </group>

      {/* ══════════ TAIL MOTOR/TENSIONER ══════════ */}
      <group position={[BELT_LEN / 2 + 0.08, -0.04, 0]}>
        <mesh>
          <boxGeometry args={[0.08, 0.06, 0.12]} />
          <meshPhysicalMaterial {...M.paintedSteel} />
        </mesh>
        {/* Tension adjustment screw */}
        <mesh position={[0, 0, 0.065]}>
          <cylinderGeometry args={[0.006, 0.006, 0.04, 6]} />
          <meshPhysicalMaterial {...M.machinedSteel} />
        </mesh>
      </group>

      {/* ══════════ PHOTOELECTRIC SENSORS ══════════ */}
      {[-2, 0, 2, BELT_LEN / 2 - 0.5].map((x, i) => (
        <group key={`pe${i}`}>
          {/* Emitter */}
          <mesh position={[x, 0.08, -BELT_WIDTH - 0.05]}>
            <boxGeometry args={[0.035, 0.035, 0.025]} />
            <meshPhysicalMaterial {...M.blackPlastic} />
          </mesh>
          <StatusLED position={[x, 0.08, -BELT_WIDTH - 0.065]} color="#ff4444" on={running && !emergency} size={0.004} />
          {/* Bracket */}
          <mesh position={[x, 0.06, -BELT_WIDTH - 0.035]}>
            <boxGeometry args={[0.04, 0.008, 0.015]} />
            <meshPhysicalMaterial {...M.machinedSteel} />
          </mesh>
          {/* Receiver (opposite side) */}
          <mesh position={[x, 0.08, BELT_WIDTH + 0.05]}>
            <boxGeometry args={[0.025, 0.025, 0.02]} />
            <meshPhysicalMaterial {...M.blackPlastic} />
          </mesh>
        </group>
      ))}

      {/* ══════════ DIVERT MECHANISM ══════════ */}
      <group position={[1.5, 0, 0]}>
        {/* Pusher plate */}
        <group rotation={[0, divert ? 0.2 : 0, 0]}>
          <mesh position={[0, 0.06, divert ? 0.3 : -BELT_WIDTH - 0.04]} castShadow>
            <boxGeometry args={[0.5, 0.12, 0.03]} />
            <meshPhysicalMaterial color={divert ? '#e0a020' : '#5a6370'} roughness={0.4} metalness={0.5} />
          </mesh>
        </group>
        {/* Pneumatic cylinder */}
        <mesh position={[0, 0.03, -BELT_WIDTH - 0.1]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.12, 8]} />
          <meshPhysicalMaterial {...M.machinedSteel} />
        </mesh>
        {/* Piston rod */}
        <mesh position={[0, 0.03, -BELT_WIDTH - 0.04 + (divert ? 0.2 : 0)]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.006, 0.006, 0.08, 6]} />
          <meshPhysicalMaterial {...M.chrome} />
        </mesh>
        {/* Divert chute */}
        {divert && (
          <mesh position={[0.15, -0.05, BELT_WIDTH + 0.2]} rotation={[0, -0.3, 0.1]}>
            <boxGeometry args={[0.4, 0.06, 0.25]} />
            <meshPhysicalMaterial {...M.paintedSteel} />
          </mesh>
        )}
      </group>

      {/* ══════════ E-STOP ON FRAME ══════════ */}
      <group position={[BELT_LEN / 2 - 0.3, 0.1, -BELT_WIDTH - 0.06]}>
        <mesh>
          <boxGeometry args={[0.04, 0.04, 0.015]} />
          <meshPhysicalMaterial {...M.safetyYellow} />
        </mesh>
        <mesh position={[0, 0, -0.01]}>
          <cylinderGeometry args={[0.015, 0.015, 0.012, 10]} />
          <meshPhysicalMaterial {...M.safetyRed} />
        </mesh>
      </group>

      {/* ══════════ CABLE TRAY UNDER BELT ══════════ */}
      <group position={[0, -0.12, 0]}>
        <mesh>
          <boxGeometry args={[BELT_LEN * 0.85, 0.015, 0.25]} />
          <meshPhysicalMaterial {...M.paintedSteel} />
        </mesh>
        {[-0.125, 0.125].map((z, i) => (
          <mesh key={`tw${i}`} position={[0, 0.015, z]}>
            <boxGeometry args={[BELT_LEN * 0.85, 0.03, 0.008]} />
            <meshPhysicalMaterial {...M.paintedSteel} />
          </mesh>
        ))}
      </group>

      {/* ══════════ CABLE RUNS ══════════ */}
      <Cable
        points={[[-BELT_LEN / 2 - 0.1, -0.35, -BELT_WIDTH - 0.05], [-BELT_LEN / 2 - 0.1, -0.1, -BELT_WIDTH - 0.06], [-BELT_LEN / 2 - 0.1, 0.05, -BELT_WIDTH - 0.05]]}
        radius={0.01}
        color="#2a2a2a"
      />
      <Cable
        points={[[-2, 0.06, -BELT_WIDTH - 0.06], [0, 0.065, -BELT_WIDTH - 0.06], [2, 0.06, -BELT_WIDTH - 0.06]]}
        radius={0.004}
        color="#3a3050"
      />

      {/* ══════════ GUARD RAIL (back side) ══════════ */}
      <mesh position={[0, 0.1, BELT_WIDTH + 0.08]}>
        <boxGeometry args={[BELT_LEN * 0.9, 0.06, 0.012]} />
        <meshPhysicalMaterial {...M.safetyYellow} />
      </mesh>

      {/* ══════════ LIGHT STACK ══════════ */}
      <LightStack
        position={[-BELT_LEN / 2 - 0.12, 0.12, BELT_WIDTH + 0.1]}
        activeIndex={jam ? 0 : running && !emergency ? 2 : 1}
      />

      {/* ══════════ DECALS ══════════ */}
      <WarningLabel position={[-BELT_LEN / 2 + 0.3, 0.04, -BELT_WIDTH - 0.04]} rotation={[0, Math.PI / 2 + Math.PI, 0]} />
      <BarcodeTag position={[BELT_LEN / 2 - 0.2, -0.02, -BELT_WIDTH - 0.04]} rotation={[0, -Math.PI / 2, 0]} />

      {/* ══════════ PACKAGES ON BELT ══════════ */}
      {running && !emergency && !jam && [0, 1.8, 3.6, 5.2].map((offset, i) => (
        <PackageBox key={i} offset={offset} index={i} beltLen={BELT_LEN} />
      ))}
    </group>
  );
}

function PackageBox({ offset, index, beltLen }: { offset: number; index: number; beltLen: number }) {
  const ref = useRef<THREE.Mesh>(null!);

  useFrame(() => {
    if (!ref.current) return;
    const time = performance.now() * 0.001;
    ref.current.position.x = ((time * 1.2 + offset) % beltLen) - beltLen / 2;
  });

  const sizes: [number, number, number][] = [
    [0.22, 0.16, 0.2],
    [0.18, 0.18, 0.18],
    [0.25, 0.14, 0.22],
    [0.2, 0.2, 0.16],
  ];
  const sz = sizes[index % sizes.length];

  return (
    <mesh ref={ref} position={[0, 0.02 + sz[1] / 2, 0]} castShadow>
      <boxGeometry args={sz} />
      <meshPhysicalMaterial {...M.cardboard} />
    </mesh>
  );
}
