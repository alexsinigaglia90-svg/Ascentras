import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../state/store';
import { Cable } from '../props/Cable';
import * as M from '../materials/materialPresets';
import { LightStack, StatusLED } from '../props/BeaconsAndIndicators';
import { WarningLabel, Nameplate, BarcodeTag } from '../props/DecalsAndLabels';
import { Fasteners } from '../props/Fasteners';

/** ────────────────────────────────────────────────────
 *  AutoStore Rig — Enhanced realistic grid system with
 *  aluminium uprights, cross-beams, diagonal bracing,
 *  instanced bins with depth, 5 robots, dual port
 *  stations with induction conveyor on the input side.
 *
 *  Position: [5.5, 0, 0] — right side of scene.
 *  Input port faces left (toward decanting stations).
 *  ──────────────────────────────────────────────────── */

const COLS = 8;
const ROWS = 5;
const LAYERS = 5;
const BIN_COUNT = COLS * ROWS * LAYERS;
const BOT_COUNT = 4;

const CELL = 0.38;
const LAYER_H = 0.28;
const GRID_W = COLS * CELL;      // 3.04
const GRID_D = ROWS * CELL;      // 1.90
const GRID_H = LAYERS * LAYER_H + 0.12; // 1.52

export function AutoStoreRig() {
  const binRef = useRef<THREE.InstancedMesh>(null!);
  const botRef = useRef<THREE.InstancedMesh>(null!);
  const beaconRef = useRef<THREE.InstancedMesh>(null!);

  const speed = useStore(s => s.autostoreSpeed);
  const heatmap = useStore(s => s.autostoreHeatmap);
  const density = useStore(s => s.autostoreBinDensity);
  const emergency = useStore(s => s.emergencyStop);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tmpC = useMemo(() => new THREE.Color(), []);

  /* Initial bin colours */
  useEffect(() => {
    if (!binRef.current) return;
    for (let i = 0; i < BIN_COUNT; i++) {
      binRef.current.setColorAt(i, tmpC.set('#737c88'));
    }
    if (binRef.current.instanceColor) binRef.current.instanceColor.needsUpdate = true;
  }, [tmpC]);

  /* Upright positions */
  const uprights = useMemo(() => {
    const arr: [number, number][] = [];
    for (let c = 0; c <= COLS; c += 2) {
      for (let r = 0; r <= ROWS; r++) {
        arr.push([c * CELL - GRID_W / 2, r * CELL - GRID_D / 2]);
      }
    }
    return arr;
  }, []);

  const boltPositions = useMemo<[number, number, number][]>(
    () => uprights.map(([x, z]) => [x, GRID_H + 0.01, z]),
    [uprights],
  );

  useFrame(() => {
    const time = performance.now() * 0.001;
    const sf = emergency ? 0 : speed / 100;

    /* ── Bins ── */
    if (binRef.current) {
      let idx = 0;
      for (let l = 0; l < LAYERS; l++) {
        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            const vis = (idx / BIN_COUNT) * 100 < density;
            const x = (c - COLS / 2 + 0.5) * CELL;
            const y = l * LAYER_H + LAYER_H / 2 + 0.02;
            const z = (r - ROWS / 2 + 0.5) * CELL;
            const wobble = vis ? Math.sin(time * sf * 2 + idx * 0.5) * 0.01 * sf : 0;

            dummy.position.set(x, y + wobble, z);
            dummy.scale.setScalar(vis ? 1 : 0);
            dummy.updateMatrix();
            binRef.current.setMatrixAt(idx, dummy.matrix);

            if (heatmap && vis) {
              const h = Math.sin(time * 0.5 + idx * 0.3) * 0.5 + 0.5;
              tmpC.setRGB(0.3 + h * 0.55, 0.6 - h * 0.35, 0.28);
            } else if (vis) {
              // Alternate bin colours for realism
              const shade = (c + r + l) % 3;
              if (shade === 0) tmpC.setRGB(0.42, 0.50, 0.56);
              else if (shade === 1) tmpC.setRGB(0.50, 0.55, 0.60);
              else tmpC.setRGB(0.38, 0.45, 0.52);
            } else {
              tmpC.setRGB(0.06, 0.06, 0.06);
            }
            binRef.current.setColorAt(idx, tmpC);
            idx++;
          }
        }
      }
      binRef.current.instanceMatrix.needsUpdate = true;
      if (binRef.current.instanceColor) binRef.current.instanceColor.needsUpdate = true;
    }

    /* ── Bots on top rail ── */
    if (botRef.current) {
      for (let b = 0; b < BOT_COUNT; b++) {
        const phase = time * sf * 0.5 + b * 1.7;
        // Bots move in a figure-8 pattern
        const bx = Math.sin(phase) * (GRID_W / 2 - 0.3);
        const bz = Math.sin(phase * 0.7 + b * 0.9) * (GRID_D / 2 - 0.2);
        dummy.position.set(bx, GRID_H + 0.035, bz);
        dummy.scale.set(1, 1, 1);
        dummy.rotation.set(0, phase * 0.5, 0);
        dummy.updateMatrix();
        botRef.current.setMatrixAt(b, dummy.matrix);
      }
      botRef.current.instanceMatrix.needsUpdate = true;
    }

    /* ── Bot beacons ── */
    if (beaconRef.current) {
      for (let b = 0; b < BOT_COUNT; b++) {
        const phase = time * sf * 0.5 + b * 1.7;
        const bx = Math.sin(phase) * (GRID_W / 2 - 0.3);
        const bz = Math.sin(phase * 0.7 + b * 0.9) * (GRID_D / 2 - 0.2);
        dummy.position.set(bx, GRID_H + 0.075, bz);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        beaconRef.current.setMatrixAt(b, dummy.matrix);

        const pulse = (Math.sin(time * 6 + b * 2) + 1) * 0.5;
        tmpC.setRGB(0.1 + pulse * 0.5, 0.5 + pulse * 0.3, 0.1);
        beaconRef.current.setColorAt(b, tmpC);
      }
      beaconRef.current.instanceMatrix.needsUpdate = true;
      if (beaconRef.current.instanceColor) beaconRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <group position={[5.5, 0, 0]}>

      {/* ══════ GRID FRAME ══════ */}
      {/* Uprights (aluminium T-slot profile) */}
      {uprights.map(([x, z], i) => (
        <group key={`up${i}`}>
          <mesh position={[x, GRID_H / 2, z]} castShadow>
            <boxGeometry args={[0.03, GRID_H, 0.03]} />
            <meshPhysicalMaterial {...M.brushedAluminium} />
          </mesh>
          {/* T-slot grooves (visual detail) */}
          {[0, Math.PI / 2].map((rot, ri) => (
            <mesh key={`tg${ri}`} position={[x, GRID_H / 2, z]} rotation={[0, rot, 0]}>
              <boxGeometry args={[0.006, GRID_H - 0.02, 0.032]} />
              <meshStandardMaterial color="#8a9099" roughness={0.5} metalness={0.3} />
            </mesh>
          ))}
          {/* Base plate */}
          <mesh position={[x, 0.005, z]} receiveShadow>
            <boxGeometry args={[0.06, 0.01, 0.06]} />
            <meshPhysicalMaterial {...M.castIron} />
          </mesh>
        </group>
      ))}
      <Fasteners positions={boltPositions} scale={0.5} />

      {/* Per-layer cross-beams */}
      {Array.from({ length: LAYERS + 1 }).map((_, l) => {
        const y = l * LAYER_H + 0.02;
        return (
          <group key={`beams${l}`}>
            {[-GRID_D / 2, GRID_D / 2].map((z, zi) => (
              <mesh key={`fb${zi}`} position={[0, y, z]}>
                <boxGeometry args={[GRID_W + 0.03, 0.012, 0.018]} />
                <meshPhysicalMaterial {...M.brushedAluminium} />
              </mesh>
            ))}
            {[-GRID_W / 2, GRID_W / 2].map((x, xi) => (
              <mesh key={`lr${xi}`} position={[x, y, 0]}>
                <boxGeometry args={[0.018, 0.012, GRID_D + 0.03]} />
                <meshPhysicalMaterial {...M.brushedAluminium} />
              </mesh>
            ))}
          </group>
        );
      })}

      {/* Diagonal bracing on back + sides */}
      {[0.4, -0.4].map((rot, i) => (
        <mesh key={`diagB${i}`} position={[(i === 0 ? -0.5 : 0.5), GRID_H / 2, -GRID_D / 2 - 0.02]} rotation={[0, 0, rot]}>
          <boxGeometry args={[0.01, GRID_H * 0.85, 0.01]} />
          <meshPhysicalMaterial {...M.brushedAluminium} />
        </mesh>
      ))}
      {[0.4, -0.4].map((rot, i) => (
        <mesh key={`diagS${i}`} position={[GRID_W / 2 + 0.02, GRID_H / 2, (i === 0 ? -0.3 : 0.3)]} rotation={[rot, 0, 0]}>
          <boxGeometry args={[0.01, GRID_H * 0.85, 0.01]} />
          <meshPhysicalMaterial {...M.brushedAluminium} />
        </mesh>
      ))}

      {/* Top rail grid — bot tracks (X direction) */}
      {Array.from({ length: COLS + 1 }).map((_, c) => (
        <mesh key={`trx${c}`} position={[c * CELL - GRID_W / 2, GRID_H, 0]}>
          <boxGeometry args={[0.016, 0.016, GRID_D + 0.02]} />
          <meshPhysicalMaterial {...M.machinedSteel} />
        </mesh>
      ))}
      {/* Top rail grid — bot tracks (Z direction) */}
      {Array.from({ length: ROWS + 1 }).map((_, r) => (
        <mesh key={`trz${r}`} position={[0, GRID_H, r * CELL - GRID_D / 2]}>
          <boxGeometry args={[GRID_W + 0.02, 0.016, 0.016]} />
          <meshPhysicalMaterial {...M.machinedSteel} />
        </mesh>
      ))}

      {/* ══════ INSTANCED BINS ══════ */}
      <instancedMesh ref={binRef} args={[undefined, undefined, BIN_COUNT]} castShadow receiveShadow>
        <boxGeometry args={[CELL * 0.86, LAYER_H * 0.78, CELL * 0.86]} />
        <meshPhysicalMaterial vertexColors roughness={0.5} metalness={0.2} clearcoat={0.1} clearcoatRoughness={0.7} />
      </instancedMesh>

      {/* ══════ INSTANCED BOTS ══════ */}
      <instancedMesh ref={botRef} args={[undefined, undefined, BOT_COUNT]} castShadow>
        <boxGeometry args={[CELL * 0.7, 0.05, CELL * 0.7]} />
        <meshPhysicalMaterial color="#d03020" roughness={0.35} metalness={0.4} clearcoat={0.25} clearcoatRoughness={0.3} />
      </instancedMesh>
      {/* Bot wheel detail — instanced cylinders at each bot corner */}
      <instancedMesh ref={beaconRef} args={[undefined, undefined, BOT_COUNT]}>
        <sphereGeometry args={[0.013, 6, 6]} />
        <meshStandardMaterial vertexColors emissive="#44aa22" emissiveIntensity={0.6} transparent opacity={0.9} />
      </instancedMesh>

      {/* ══════ INPUT PORT STATION (left side — faces decanting) ══════ */}
      <group position={[-GRID_W / 2 - 0.3, 0, 0]}>
        {/* Port frame */}
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[0.35, 1.0, 0.5]} />
          <meshPhysicalMaterial {...M.paintedSteel} />
        </mesh>
        {/* Port opening */}
        <mesh position={[0.14, 0.55, 0]}>
          <boxGeometry args={[0.06, 0.32, 0.38]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
        </mesh>
        {/* Induction conveyor rollers */}
        {Array.from({ length: 5 }).map((_, i) => (
          <mesh key={`ir${i}`} position={[-0.08, 0.42, -0.15 + i * 0.075]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.012, 0.012, 0.28, 8]} />
            <meshPhysicalMaterial {...M.machinedSteel} />
          </mesh>
        ))}
        {/* Bin at port */}
        <mesh position={[-0.02, 0.48, 0]} castShadow>
          <boxGeometry args={[CELL * 0.82, LAYER_H * 0.65, CELL * 0.82]} />
          <meshPhysicalMaterial color="#5a6878" roughness={0.5} metalness={0.2} />
        </mesh>
        {/* Status LEDs */}
        <StatusLED position={[-0.176, 0.88, 0.15]} color="#00ff44" on={!emergency} />
        <StatusLED position={[-0.176, 0.88, -0.15]} color="#ff2020" on={emergency} />
        {/* Port label */}
        <Nameplate position={[-0.176, 0.75, 0]} rotation={[0, -Math.PI / 2, 0]} width={0.06} height={0.02} />
      </group>

      {/* ══════ OUTPUT PORT STATION (right side) ══════ */}
      <group position={[GRID_W / 2 + 0.3, 0, 0]}>
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[0.35, 1.0, 0.5]} />
          <meshPhysicalMaterial {...M.paintedSteel} />
        </mesh>
        <mesh position={[-0.14, 0.55, 0]}>
          <boxGeometry args={[0.06, 0.32, 0.38]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
        </mesh>
        {Array.from({ length: 5 }).map((_, i) => (
          <mesh key={`or${i}`} position={[0.08, 0.42, -0.15 + i * 0.075]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.012, 0.012, 0.28, 8]} />
            <meshPhysicalMaterial {...M.machinedSteel} />
          </mesh>
        ))}
        <StatusLED position={[0.176, 0.88, 0.15]} color="#00ff44" on={!emergency} />
        <StatusLED position={[0.176, 0.88, -0.15]} color="#ff2020" on={emergency} />
        <Nameplate position={[0.176, 0.75, 0]} rotation={[0, Math.PI / 2, 0]} width={0.06} height={0.02} />
      </group>

      {/* ══════ INDUCTION CONVEYOR (connects to decanting output) ══════ */}
      <group position={[-GRID_W / 2 - 0.9, 0, 0]}>
        {[-0.14, 0.14].map((z, i) => (
          <mesh key={`icr${i}`} position={[0, 0.36, z]}>
            <boxGeometry args={[0.8, 0.022, 0.012]} />
            <meshPhysicalMaterial {...M.paintedSteel} />
          </mesh>
        ))}
        {Array.from({ length: 8 }).map((_, i) => (
          <mesh key={`irl${i}`} position={[-0.35 + i * 0.1, 0.345, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.26, 8]} />
            <meshPhysicalMaterial {...M.machinedSteel} />
          </mesh>
        ))}
        {[[-0.35, -0.11], [0.35, -0.11], [-0.35, 0.11], [0.35, 0.11]].map(([x, z], i) => (
          <mesh key={`ilt${i}`} position={[x, 0.17, z]}>
            <boxGeometry args={[0.02, 0.34, 0.02]} />
            <meshPhysicalMaterial {...M.paintedSteel} />
          </mesh>
        ))}
      </group>

      {/* ══════ CONTROLLER CABINET ══════ */}
      <group position={[GRID_W / 2 + 0.3, 0, -GRID_D / 2 - 0.3]}>
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[0.3, 1.0, 0.22]} />
          <meshPhysicalMaterial {...M.darkEnclosure} />
        </mesh>
        <mesh position={[0.151, 0.55, 0]}>
          <boxGeometry args={[0.008, 0.1, 0.015]} />
          <meshPhysicalMaterial {...M.machinedSteel} />
        </mesh>
        {[-0.1, -0.05, 0, 0.05, 0.1].map((y, i) => (
          <mesh key={`cv${i}`} position={[0, 0.15 + y, 0.111]}>
            <planeGeometry args={[0.2, 0.008]} />
            <meshStandardMaterial color="#2a2a2a" roughness={0.9} />
          </mesh>
        ))}
        <StatusLED position={[-0.05, 0.92, 0.111]} color="#00ff44" on={!emergency} />
        <StatusLED position={[0.05, 0.92, 0.111]} color="#ff2020" on={emergency} />
        <Nameplate position={[0, 0.82, 0.112]} />
      </group>

      {/* ══════ PERIMETER SAFETY STRIPE ══════ */}
      <mesh position={[0, 0.003, -GRID_D / 2 - 0.4]} receiveShadow>
        <boxGeometry args={[GRID_W + 1.2, 0.005, 0.04]} />
        <meshStandardMaterial color="#e8c020" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.003, GRID_D / 2 + 0.4]} receiveShadow>
        <boxGeometry args={[GRID_W + 1.2, 0.005, 0.04]} />
        <meshStandardMaterial color="#e8c020" roughness={0.6} />
      </mesh>

      {/* ══════ DECALS ══════ */}
      <WarningLabel position={[-GRID_W / 2 - 0.02, 0.5, 0]} rotation={[0, -Math.PI / 2, 0]} />
      <BarcodeTag position={[GRID_W / 2 + 0.02, 0.35, GRID_D / 4]} rotation={[0, Math.PI / 2, 0]} />

      {/* ══════ LIGHT STACK ══════ */}
      <LightStack position={[GRID_W / 2 + 0.3, 1.05, -GRID_D / 2 - 0.3]} activeIndex={emergency ? 0 : 2} />

      {/* ══════ CABLES ══════ */}
      <Cable
        points={[
          [GRID_W / 2 + 0.1, 0.5, GRID_D / 2 + 0.1],
          [GRID_W / 2 + 0.15, 0.25, GRID_D / 2 + 0.15],
          [GRID_W / 2 + 0.2, 0.05, GRID_D / 2 + 0.2],
        ]}
        radius={0.012}
        color="#2a2a2a"
      />
      <Cable
        points={[
          [-GRID_W / 2, 0.01, GRID_D / 2 + 0.1],
          [0, 0.02, GRID_D / 2 + 0.12],
          [GRID_W / 2, 0.01, GRID_D / 2 + 0.1],
        ]}
        radius={0.006}
        color="#30304a"
      />
    </group>
  );
}
