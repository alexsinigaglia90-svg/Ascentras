import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../state/store';
import { Cable } from '../props/Cable';
import * as M from '../materials/materialPresets';
import { StatusLED, LightStack } from '../props/BeaconsAndIndicators';
import { WarningLabel, Nameplate, BarcodeTag } from '../props/DecalsAndLabels';

/** ────────────────────────────────────────────────────
 *  Main Conveyor — Gravity roller conveyor running
 *  along X-axis. Rollers are STATIC (gravity-fed).
 *  Boxes slide along the rollers when running.
 *  Positioned to receive boxes from the Depalletizer
 *  transfer conveyor and feed into Decanting stations.
 *  ──────────────────────────────────────────────────── */

const ROLLER_COUNT = 50;
const ROLLER_SPACING = 0.12;
const BELT_LEN = ROLLER_COUNT * ROLLER_SPACING;  // 6.0
const BELT_W = 0.35;
const BOX_COUNT = 6;

export function ConveyorRig() {
  const groupRef = useRef<THREE.Group>(null!);
  const rollerRef = useRef<THREE.InstancedMesh>(null!);

  const running = useStore(s => s.conveyorRunning);
  const jam = useStore(s => s.conveyorJam);
  const emergency = useStore(s => s.emergencyStop);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  /* Place rollers ONCE — they never spin. Rotate so cylinders lie
     flat across the conveyor (Z-axis) instead of standing up (Y-axis). */
  useEffect(() => {
    if (!rollerRef.current) return;
    for (let i = 0; i < ROLLER_COUNT; i++) {
      const x = (i - ROLLER_COUNT / 2) * ROLLER_SPACING;
      dummy.position.set(x, 0, 0);
      dummy.rotation.set(Math.PI / 2, 0, 0);   // lie flat across conveyor
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      rollerRef.current.setMatrixAt(i, dummy.matrix);
    }
    rollerRef.current.instanceMatrix.needsUpdate = true;
  }, [dummy]);

  /* Leg X positions */
  const legXs = useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i < 8; i++) arr.push(-BELT_LEN / 2 + 0.3 + i * (BELT_LEN - 0.6) / 7);
    return arr;
  }, []);

  const active = running && !jam && !emergency;

  return (
    <group ref={groupRef} position={[-1, 0.35, 0]}>

      {/* ══════ SIDE RAILS (C-channel) ══════ */}
      {[-BELT_W - 0.015, BELT_W + 0.015].map((z, i) => (
        <group key={`rail${i}`}>
          <mesh position={[0, 0.02, z]} castShadow>
            <boxGeometry args={[BELT_LEN + 0.08, 0.04, 0.02]} />
            <meshPhysicalMaterial {...M.paintedSteel} />
          </mesh>
          <mesh position={[0, 0.042, z + (i === 0 ? 0.012 : -0.012)]}>
            <boxGeometry args={[BELT_LEN + 0.08, 0.006, 0.012]} />
            <meshPhysicalMaterial {...M.machinedSteel} />
          </mesh>
        </group>
      ))}

      {/* ══════ STATIC ROLLERS (instanced, no animation) ══════ */}
      <instancedMesh ref={rollerRef} args={[undefined, undefined, ROLLER_COUNT]} castShadow receiveShadow>
        <cylinderGeometry args={[0.014, 0.014, BELT_W * 2, 8]} />
        <meshPhysicalMaterial {...M.machinedSteel} />
      </instancedMesh>

      {/* ══════ END ROLLERS (larger diameter) ══════ */}
      {[-BELT_LEN / 2, BELT_LEN / 2].map((x, i) => (
        <mesh key={`end${i}`} position={[x, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.025, 0.025, BELT_W * 2, 12]} />
          <meshPhysicalMaterial {...M.machinedSteel} />
        </mesh>
      ))}

      {/* ══════ SUPPORT LEGS + CROSS MEMBERS ══════ */}
      {legXs.map((x, i) => (
        <group key={`leg${i}`}>
          {[-BELT_W - 0.02, BELT_W + 0.02].map((z, zi) => (
            <group key={zi}>
              <mesh position={[x, -0.18, z]} castShadow>
                <boxGeometry args={[0.025, 0.36, 0.025]} />
                <meshPhysicalMaterial {...M.paintedSteel} />
              </mesh>
              <mesh position={[x, -0.365, z]}>
                <cylinderGeometry args={[0.018, 0.024, 0.006, 8]} />
                <meshPhysicalMaterial {...M.castIron} />
              </mesh>
            </group>
          ))}
          <mesh position={[x, -0.26, 0]}>
            <boxGeometry args={[0.015, 0.015, BELT_W * 2 + 0.04]} />
            <meshPhysicalMaterial {...M.paintedSteel} />
          </mesh>
        </group>
      ))}

      {/* ══════ DRIVE MOTOR (head end) ══════ */}
      <group position={[-BELT_LEN / 2 - 0.1, -0.05, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.14, 0.12, 0.16]} />
          <meshPhysicalMaterial {...M.paintedSteel} />
        </mesh>
        {Array.from({ length: 5 }).map((_, i) => (
          <mesh key={i} position={[-0.071, -0.04 + i * 0.018, 0]}>
            <boxGeometry args={[0.003, 0.006, 0.14]} />
            <meshStandardMaterial color="#3a4050" metalness={0.5} roughness={0.4} />
          </mesh>
        ))}
        <mesh position={[0.07, 0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.015, 0.015, 0.03, 8]} />
          <meshPhysicalMaterial {...M.machinedSteel} />
        </mesh>
        <Nameplate position={[0, 0.01, 0.081]} width={0.05} height={0.018} />
        <StatusLED position={[0.071, 0.04, 0.05]} color="#00ff44" on={active} />
        <StatusLED position={[0.071, 0.04, -0.05]} color="#ff2020" on={jam} />
      </group>

      {/* ══════ PHOTOELECTRIC SENSORS ══════ */}
      {[-2.2, -0.8, 0.8, 2.2].map((x, i) => (
        <group key={`pe${i}`}>
          <mesh position={[x, 0.06, -BELT_W - 0.04]}>
            <boxGeometry args={[0.03, 0.03, 0.02]} />
            <meshPhysicalMaterial {...M.blackPlastic} />
          </mesh>
          <StatusLED position={[x, 0.06, -BELT_W - 0.052]} color="#ff4444" on={active} size={0.003} />
          <mesh position={[x, 0.06, BELT_W + 0.04]}>
            <boxGeometry args={[0.02, 0.02, 0.015]} />
            <meshPhysicalMaterial {...M.blackPlastic} />
          </mesh>
        </group>
      ))}

      {/* ══════ E-STOP ══════ */}
      <group position={[BELT_LEN / 2 - 0.3, 0.08, -BELT_W - 0.04]}>
        <mesh>
          <boxGeometry args={[0.035, 0.035, 0.012]} />
          <meshPhysicalMaterial {...M.safetyYellow} />
        </mesh>
        <mesh position={[0, 0, -0.008]}>
          <cylinderGeometry args={[0.012, 0.012, 0.01, 10]} />
          <meshPhysicalMaterial {...M.safetyRed} />
        </mesh>
      </group>

      {/* ══════ CABLE TRAY ══════ */}
      <group position={[0, -0.1, 0]}>
        <mesh>
          <boxGeometry args={[BELT_LEN * 0.8, 0.012, 0.2]} />
          <meshPhysicalMaterial {...M.paintedSteel} />
        </mesh>
        {[-0.1, 0.1].map((z, i) => (
          <mesh key={i} position={[0, 0.012, z]}>
            <boxGeometry args={[BELT_LEN * 0.8, 0.024, 0.006]} />
            <meshPhysicalMaterial {...M.paintedSteel} />
          </mesh>
        ))}
      </group>

      {/* ══════ CABLES ══════ */}
      <Cable points={[[-BELT_LEN / 2 - 0.08, -0.33, -BELT_W - 0.04], [-BELT_LEN / 2 - 0.08, -0.08, -BELT_W - 0.04], [-BELT_LEN / 2 - 0.08, 0.04, -BELT_W - 0.04]]} radius={0.008} color="#2a2a2a" />
      <Cable points={[[-1.8, 0.05, -BELT_W - 0.05], [0, 0.05, -BELT_W - 0.05], [1.8, 0.05, -BELT_W - 0.05]]} radius={0.004} color="#3a3050" />

      {/* ══════ GUARD RAIL (back side) ══════ */}
      <mesh position={[0, 0.08, BELT_W + 0.06]}>
        <boxGeometry args={[BELT_LEN * 0.85, 0.05, 0.01]} />
        <meshPhysicalMaterial {...M.safetyYellow} />
      </mesh>

      {/* ══════ LIGHT STACK ══════ */}
      <LightStack position={[-BELT_LEN / 2 - 0.1, 0.1, BELT_W + 0.08]} activeIndex={jam ? 0 : active ? 2 : 1} />

      {/* ══════ DECALS ══════ */}
      <WarningLabel position={[-BELT_LEN / 2 + 0.3, 0.03, -BELT_W - 0.03]} rotation={[0, -Math.PI / 2, 0]} />
      <BarcodeTag position={[BELT_LEN / 2 - 0.2, -0.01, -BELT_W - 0.03]} rotation={[0, -Math.PI / 2, 0]} />

      {/* ══════ SLIDING BOXES (no roller spin, boxes glide) ══════ */}
      {active && Array.from({ length: BOX_COUNT }).map((_, i) => (
        <SlidingBox key={i} index={i} beltLen={BELT_LEN} />
      ))}
    </group>
  );
}

/* Box that slides along static rollers */
function SlidingBox({ index, beltLen }: { index: number; beltLen: number }) {
  const ref = useRef<THREE.Mesh>(null!);
  const sizes: [number, number, number][] = [
    [0.2, 0.14, 0.18], [0.16, 0.16, 0.16], [0.22, 0.12, 0.2],
    [0.18, 0.18, 0.15], [0.2, 0.14, 0.17], [0.17, 0.15, 0.19],
  ];
  const sz = sizes[index % sizes.length];
  const offset = index * (beltLen / BOX_COUNT);

  useFrame(() => {
    if (!ref.current) return;
    const t = performance.now() * 0.001;
    ref.current.position.x = ((t * 0.8 + offset) % beltLen) - beltLen / 2;
  });

  return (
    <mesh ref={ref} position={[0, 0.02 + sz[1] / 2, 0]} castShadow>
      <boxGeometry args={sz} />
      <meshPhysicalMaterial {...M.cardboard} />
    </mesh>
  );
}
