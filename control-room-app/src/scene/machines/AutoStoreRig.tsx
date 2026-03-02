import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../state/store';
import { Cable } from '../props/Cable';
import * as M from '../materials/materialPresets';
import { SafetyBeacon, LightStack, StatusLED } from '../props/BeaconsAndIndicators';
import { WarningLabel, Nameplate, BarcodeTag } from '../props/DecalsAndLabels';
import { Fasteners } from '../props/Fasteners';

/** ────────────────────────────────────────────────────
 *  AutoStore Rig — Aluminium grid frame with uprights,
 *  cross-beams, diagonal bracing. Instanced bins with
 *  depth (lip detail). Multiple bots (instanced chassis,
 *  wheels, beacon). Port station with conveyor interface.
 *  Controller cabinet, cable runs, decals.
 *  ──────────────────────────────────────────────────── */

const cols = 8;
const rows = 6;
const layers = 4;
const binCount = cols * rows * layers;
const botCount = 3;

const CELL = 0.42;
const LAYER_H = 0.32;
const gridW = cols * CELL;
const gridD = rows * CELL;
const gridH = layers * LAYER_H + 0.15;

export function AutoStoreRig() {
  const binMeshRef = useRef<THREE.InstancedMesh>(null!);
  const botMeshRef = useRef<THREE.InstancedMesh>(null!);
  const beaconMeshRef = useRef<THREE.InstancedMesh>(null!);

  const speed = useStore(s => s.autostoreSpeed);
  const heatmap = useStore(s => s.autostoreHeatmap);
  const density = useStore(s => s.autostoreBinDensity);
  const emergency = useStore(s => s.emergencyStop);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tmpC = useMemo(() => new THREE.Color(), []);

  /* Initial bin colours */
  useEffect(() => {
    if (!binMeshRef.current) return;
    for (let i = 0; i < binCount; i++) {
      binMeshRef.current.setColorAt(i, tmpC.set('#737c88'));
    }
    if (binMeshRef.current.instanceColor) binMeshRef.current.instanceColor.needsUpdate = true;
  }, [tmpC]);

  /* Grid post positions (interior + perimeter) */
  const uprights = useMemo(() => {
    const arr: [number, number][] = [];
    for (let c = 0; c <= cols; c += 2) {
      for (let r = 0; r <= rows; r += 2) {
        arr.push([c * CELL - gridW / 2, r * CELL - gridD / 2]);
      }
    }
    return arr;
  }, []);

  /* Bolt caps at all upright tops */
  const boltPositions = useMemo<[number, number, number][]>(
    () => uprights.map(([x, z]) => [x, gridH + 0.01, z]),
    [uprights],
  );

  useFrame(() => {
    const time = performance.now() * 0.001;
    const sf = emergency ? 0 : speed / 100;

    /* ── Bins ── */
    if (binMeshRef.current) {
      let idx = 0;
      for (let l = 0; l < layers; l++) {
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const vis = (idx / binCount) * 100 < density;
            const x = (c - cols / 2 + 0.5) * CELL;
            const y = l * LAYER_H + LAYER_H / 2 + 0.02;
            const z = (r - rows / 2 + 0.5) * CELL;
            const wobble = vis ? Math.sin(time * sf * 2 + idx * 0.5) * 0.015 * sf : 0;

            dummy.position.set(x, y + wobble, z);
            dummy.scale.setScalar(vis ? 1 : 0);
            dummy.updateMatrix();
            binMeshRef.current.setMatrixAt(idx, dummy.matrix);

            if (heatmap && vis) {
              const h = Math.sin(time * 0.5 + idx * 0.3) * 0.5 + 0.5;
              tmpC.setRGB(0.3 + h * 0.55, 0.6 - h * 0.35, 0.28);
            } else if (vis) {
              tmpC.setRGB(0.45, 0.52, 0.58);
            } else {
              tmpC.setRGB(0.08, 0.08, 0.08);
            }
            binMeshRef.current.setColorAt(idx, tmpC);
            idx++;
          }
        }
      }
      binMeshRef.current.instanceMatrix.needsUpdate = true;
      if (binMeshRef.current.instanceColor) binMeshRef.current.instanceColor.needsUpdate = true;
    }

    /* ── Bots on top ── */
    if (botMeshRef.current) {
      for (let b = 0; b < botCount; b++) {
        const phase = time * sf * 0.6 + b * 2.1;
        const bx = Math.sin(phase) * (gridW / 2 - 0.3);
        const bz = Math.cos(phase * 0.7 + b) * (gridD / 2 - 0.3);
        dummy.position.set(bx, gridH + 0.04, bz);
        dummy.scale.set(1, 1, 1);
        dummy.rotation.set(0, phase, 0);
        dummy.updateMatrix();
        botMeshRef.current.setMatrixAt(b, dummy.matrix);
      }
      botMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    /* ── Beacon on each bot ── */
    if (beaconMeshRef.current) {
      for (let b = 0; b < botCount; b++) {
        const phase = time * sf * 0.6 + b * 2.1;
        const bx = Math.sin(phase) * (gridW / 2 - 0.3);
        const bz = Math.cos(phase * 0.7 + b) * (gridD / 2 - 0.3);
        dummy.position.set(bx, gridH + 0.09, bz);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        beaconMeshRef.current.setMatrixAt(b, dummy.matrix);

        const pulse = (Math.sin(time * 6 + b * 2) + 1) * 0.5;
        tmpC.setRGB(0.1 + pulse * 0.5, 0.5 + pulse * 0.3, 0.1);
        beaconMeshRef.current.setColorAt(b, tmpC);
      }
      beaconMeshRef.current.instanceMatrix.needsUpdate = true;
      if (beaconMeshRef.current.instanceColor) beaconMeshRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <group position={[3, 0, -1.5]}>

      {/* ══════════ GRID FRAME ══════════ */}
      {/* Uprights (aluminium profile style) */}
      {uprights.map(([x, z], i) => (
        <group key={`up${i}`}>
          <mesh position={[x, gridH / 2, z]} castShadow>
            <boxGeometry args={[0.035, gridH, 0.035]} />
            <meshPhysicalMaterial {...M.brushedAluminium} />
          </mesh>
          {/* Base plate */}
          <mesh position={[x, 0.005, z]} receiveShadow>
            <boxGeometry args={[0.07, 0.01, 0.07]} />
            <meshPhysicalMaterial {...M.castIron} />
          </mesh>
        </group>
      ))}
      <Fasteners positions={boltPositions} scale={0.5} />

      {/* Cross-beams per layer (X direction) */}
      {Array.from({ length: layers + 1 }).map((_, l) => {
        const y = l * LAYER_H + 0.02;
        return (
          <group key={`xbeams${l}`}>
            {/* Front & back rails */}
            {[-gridD / 2, gridD / 2].map((z, zi) => (
              <mesh key={zi} position={[0, y, z]}>
                <boxGeometry args={[gridW + 0.04, 0.015, 0.02]} />
                <meshPhysicalMaterial {...M.brushedAluminium} />
              </mesh>
            ))}
            {/* Left & right rails */}
            {[-gridW / 2, gridW / 2].map((x, xi) => (
              <mesh key={`zr${xi}`} position={[x, y, 0]}>
                <boxGeometry args={[0.02, 0.015, gridD + 0.04]} />
                <meshPhysicalMaterial {...M.brushedAluminium} />
              </mesh>
            ))}
          </group>
        );
      })}

      {/* Diagonal bracing on back face */}
      {[0.45, -0.45].map((rot, i) => (
        <mesh key={`diag${i}`} position={[0, gridH / 2, -gridD / 2 - 0.02]} rotation={[0, 0, rot]}>
          <boxGeometry args={[0.012, gridH * 0.9, 0.012]} />
          <meshPhysicalMaterial {...M.brushedAluminium} />
        </mesh>
      ))}

      {/* Top rail platform — grid of rails for bots */}
      {Array.from({ length: cols + 1 }).map((_, c) => {
        const x = c * CELL - gridW / 2;
        return (
          <mesh key={`tr${c}`} position={[x, gridH, 0]}>
            <boxGeometry args={[0.018, 0.018, gridD + 0.02]} />
            <meshPhysicalMaterial {...M.machinedSteel} />
          </mesh>
        );
      })}
      {Array.from({ length: rows + 1 }).map((_, r) => {
        const z = r * CELL - gridD / 2;
        return (
          <mesh key={`trc${r}`} position={[0, gridH, z]}>
            <boxGeometry args={[gridW + 0.02, 0.018, 0.018]} />
            <meshPhysicalMaterial {...M.machinedSteel} />
          </mesh>
        );
      })}

      {/* ══════════ INSTANCED BINS ══════════ */}
      <instancedMesh ref={binMeshRef} args={[undefined, undefined, binCount]} castShadow receiveShadow>
        <boxGeometry args={[CELL * 0.88, LAYER_H * 0.82, CELL * 0.88]} />
        <meshPhysicalMaterial vertexColors roughness={0.5} metalness={0.2} clearcoat={0.1} clearcoatRoughness={0.7} />
      </instancedMesh>

      {/* ══════════ INSTANCED BOTS ══════════ */}
      <instancedMesh ref={botMeshRef} args={[undefined, undefined, botCount]} castShadow>
        <boxGeometry args={[CELL * 0.75, 0.055, CELL * 0.75]} />
        <meshPhysicalMaterial color="#e03020" roughness={0.35} metalness={0.4} clearcoat={0.25} clearcoatRoughness={0.3} />
      </instancedMesh>
      {/* Bot beacons (instanced spheres) */}
      <instancedMesh ref={beaconMeshRef} args={[undefined, undefined, botCount]}>
        <sphereGeometry args={[0.015, 6, 6]} />
        <meshStandardMaterial vertexColors emissive="#44aa22" emissiveIntensity={0.6} transparent opacity={0.9} />
      </instancedMesh>

      {/* ══════════ PORT STATION ══════════ */}
      <group position={[gridW / 2 + 0.25, 0, 0]}>
        {/* Port frame */}
        <mesh position={[0, 0.45, 0]} castShadow>
          <boxGeometry args={[0.35, 0.9, 0.5]} />
          <meshPhysicalMaterial {...M.paintedSteel} />
        </mesh>
        {/* Port opening (dark cavity) */}
        <mesh position={[-0.15, 0.55, 0]}>
          <boxGeometry args={[0.06, 0.35, 0.4]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
        </mesh>
        {/* Conveyor rollers at port exit */}
        {Array.from({ length: 5 }).map((_, i) => (
          <mesh key={`pr${i}`} position={[0.05, 0.42, -0.15 + i * 0.075]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.012, 0.012, 0.3, 8]} />
            <meshPhysicalMaterial {...M.machinedSteel} />
          </mesh>
        ))}
        {/* Port status LEDs */}
        <StatusLED position={[0.176, 0.8, 0.15]} color="#00ff44" on={!emergency} />
        <StatusLED position={[0.176, 0.8, -0.15]} color="#ff2020" on={emergency} />
        {/* Bin arriving at port */}
        <mesh position={[0.05, 0.48, 0]} castShadow>
          <boxGeometry args={[CELL * 0.85, LAYER_H * 0.7, CELL * 0.85]} />
          <meshPhysicalMaterial color="#5a6878" roughness={0.5} metalness={0.2} />
        </mesh>
      </group>

      {/* ══════════ CONTROLLER CABINET ══════════ */}
      <group position={[gridW / 2 + 0.25, 0, -gridD / 2 - 0.3]}>
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[0.3, 1.0, 0.22]} />
          <meshPhysicalMaterial {...M.darkEnclosure} />
        </mesh>
        {/* Door handle */}
        <mesh position={[0.151, 0.55, 0]}>
          <boxGeometry args={[0.008, 0.1, 0.015]} />
          <meshPhysicalMaterial {...M.machinedSteel} />
        </mesh>
        {/* Ventilation */}
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

      {/* ══════════ DECALS ══════════ */}
      <WarningLabel position={[-gridW / 2 - 0.02, 0.5, 0]} rotation={[0, -Math.PI / 2, 0]} />
      <BarcodeTag position={[gridW / 2 + 0.02, 0.35, gridD / 4]} rotation={[0, Math.PI / 2, 0]} />

      {/* ══════════ LIGHT STACK ══════════ */}
      <LightStack position={[gridW / 2 + 0.25, 1.05, -gridD / 2 - 0.3]} activeIndex={emergency ? 0 : 2} />

      {/* ══════════ CABLE RUNS ══════════ */}
      <Cable
        points={[
          [gridW / 2 + 0.1, 0.5, gridD / 2 + 0.1],
          [gridW / 2 + 0.15, 0.25, gridD / 2 + 0.15],
          [gridW / 2 + 0.2, 0.05, gridD / 2 + 0.2],
        ]}
        radius={0.012}
        color="#2a2a2a"
      />
      <Cable
        points={[
          [-gridW / 2, 0.01, gridD / 2 + 0.1],
          [0, 0.02, gridD / 2 + 0.12],
          [gridW / 2, 0.01, gridD / 2 + 0.1],
        ]}
        radius={0.006}
        color="#30304a"
      />
    </group>
  );
}
