import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../state/store';
import { Cable } from '../props/Cable';
import * as M from '../materials/materialPresets';
import { LightStack, StatusLED } from '../props/BeaconsAndIndicators';
import { WarningLabel, Nameplate, BarcodeTag } from '../props/DecalsAndLabels';
import { Fasteners } from '../props/Fasteners';

/** 
 *  AutoStore Rig  Highly detailed grid system with
 *  realistic R5 robots, static bins, working heatmap.
 *
 *  Position: [5.5, 0, 0]  right side of scene.
 *   */

const COLS = 8;
const ROWS = 5;
const LAYERS = 5;
const BIN_COUNT = COLS * ROWS * LAYERS;
const BOT_COUNT = 4;

const CELL = 0.38;
const LAYER_H = 0.28;
const GRID_W = COLS * CELL;
const GRID_D = ROWS * CELL;
const GRID_H = LAYERS * LAYER_H + 0.12;

/*  Precompute static bin access-frequency for heatmap  */
function buildHeatData(): Float32Array {
  const data = new Float32Array(BIN_COUNT);
  for (let i = 0; i < BIN_COUNT; i++) {
    const l = Math.floor(i / (COLS * ROWS));
    const rem = i % (COLS * ROWS);
    const r = Math.floor(rem / COLS);
    const c = rem % COLS;
    // Top layers accessed more; center columns accessed more
    const layerFactor = (l + 1) / LAYERS;
    const centerC = 1 - Math.abs(c - COLS / 2 + 0.5) / (COLS / 2);
    const centerR = 1 - Math.abs(r - ROWS / 2 + 0.5) / (ROWS / 2);
    data[i] = layerFactor * 0.5 + centerC * 0.3 + centerR * 0.2;
  }
  return data;
}

/*  Single detailed R5 robot (non-instanced for full detail)  */
function AutoStoreBot({ index, gridW, gridD, gridH, cell, speedFactor, emergency }: {
  index: number; gridW: number; gridD: number; gridH: number;
  cell: number; speedFactor: number; emergency: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const wheelFLRef = useRef<THREE.Mesh>(null!);
  const wheelFRRef = useRef<THREE.Mesh>(null!);
  const wheelRLRef = useRef<THREE.Mesh>(null!);
  const wheelRRRef = useRef<THREE.Mesh>(null!);
  const lidarRef = useRef<THREE.Mesh>(null!);
  const ledRef = useRef<THREE.MeshStandardMaterial>(null!);
  const gripperRef = useRef<THREE.Group>(null!);

  const basePhase = index * 1.7;
  const chassisW = cell * 0.72;
  const chassisD = cell * 0.72;
  const chassisH = 0.045;
  const wheelR = 0.014;

  useFrame(() => {
    if (!groupRef.current) return;
    const time = performance.now() * 0.001;
    const sf = emergency ? 0 : speedFactor;
    const phase = time * sf * 0.5 + basePhase;

    // Figure-8 movement on rails
    const bx = Math.sin(phase) * (gridW / 2 - 0.3);
    const bz = Math.sin(phase * 0.7 + index * 0.9) * (gridD / 2 - 0.2);

    // Snap to rail grid
    const snappedX = Math.round(bx / cell) * cell;
    const snappedZ = Math.round(bz / cell) * cell;
    const lerpF = 0.08;
    groupRef.current.position.x += (snappedX - groupRef.current.position.x) * lerpF;
    groupRef.current.position.z += (snappedZ - groupRef.current.position.z) * lerpF;
    groupRef.current.position.y = gridH + 0.01;

    // Orient toward movement direction
    const dx = snappedX - groupRef.current.position.x;
    const dz = snappedZ - groupRef.current.position.z;
    if (Math.abs(dx) > 0.001 || Math.abs(dz) > 0.001) {
      const targetRot = Math.atan2(dx, dz);
      groupRef.current.rotation.y += (targetRot - groupRef.current.rotation.y) * 0.05;
    }

    // Spin wheels
    const wheelSpeed = sf * 8;
    if (wheelFLRef.current) wheelFLRef.current.rotation.x += wheelSpeed * 0.016;
    if (wheelFRRef.current) wheelFRRef.current.rotation.x += wheelSpeed * 0.016;
    if (wheelRLRef.current) wheelRLRef.current.rotation.x += wheelSpeed * 0.016;
    if (wheelRRRef.current) wheelRRRef.current.rotation.x += wheelSpeed * 0.016;

    // Spin LIDAR
    if (lidarRef.current) lidarRef.current.rotation.y += 0.15 * sf;

    // Pulse LED
    if (ledRef.current) {
      const pulse = (Math.sin(time * 5 + index * 2) + 1) * 0.5;
      const c = emergency ? new THREE.Color(1, 0.1, 0.1) : new THREE.Color(0.1 + pulse * 0.3, 0.7 + pulse * 0.3, 0.1);
      ledRef.current.color.copy(c);
      ledRef.current.emissive.copy(c);
      ledRef.current.emissiveIntensity = 0.6 + pulse * 0.4;
    }

    // Gripper oscillation (simulating bin grab)
    if (gripperRef.current) {
      const grabCycle = Math.sin(time * 0.3 + index * 2);
      const openAmount = grabCycle > 0.7 ? 0.012 : 0;
      gripperRef.current.children.forEach((child, ci) => {
        if (child instanceof THREE.Mesh) {
          child.position.x = ci === 0 ? -0.03 - openAmount : 0.03 + openAmount;
        }
      });
    }
  });

  const botColor = ['#cc2020', '#cc2020', '#cc2020', '#cc2020'][index];
  const wheelPositions: [number, number, number][] = [
    [-chassisW / 2 + 0.008, -chassisH / 2 - wheelR * 0.5, -chassisD / 2 + 0.02],
    [chassisW / 2 - 0.008, -chassisH / 2 - wheelR * 0.5, -chassisD / 2 + 0.02],
    [-chassisW / 2 + 0.008, -chassisH / 2 - wheelR * 0.5, chassisD / 2 - 0.02],
    [chassisW / 2 - 0.008, -chassisH / 2 - wheelR * 0.5, chassisD / 2 - 0.02],
  ];
  const wheelRefs = [wheelFLRef, wheelFRRef, wheelRLRef, wheelRRRef];

  return (
    <group ref={groupRef} position={[0, gridH + 0.01, 0]}>
      {/*  Main chassis body  */}
      <mesh castShadow>
        <boxGeometry args={[chassisW, chassisH, chassisD]} />
        <meshPhysicalMaterial
          color={botColor} roughness={0.3} metalness={0.5}
          clearcoat={0.3} clearcoatRoughness={0.2}
        />
      </mesh>

      {/*  Top cover plate (slightly smaller, darker)  */}
      <mesh position={[0, chassisH / 2 + 0.003, 0]}>
        <boxGeometry args={[chassisW - 0.02, 0.006, chassisD - 0.02]} />
        <meshPhysicalMaterial color="#1a1a1e" roughness={0.5} metalness={0.4} />
      </mesh>

      {/*  Side panels with ventilation slots  */}
      {[-1, 1].map(side => (
        <group key={`panel${side}`}>
          {/* Panel frame */}
          <mesh position={[side * chassisW / 2, 0, 0]}>
            <boxGeometry args={[0.003, chassisH + 0.004, chassisD - 0.01]} />
            <meshPhysicalMaterial color="#2a2a2e" roughness={0.4} metalness={0.5} />
          </mesh>
          {/* Vent slots */}
          {[-0.04, -0.02, 0, 0.02, 0.04].map((zOff, vi) => (
            <mesh key={`vent${vi}`} position={[side * (chassisW / 2 + 0.001), 0, zOff]}>
              <boxGeometry args={[0.005, 0.008, 0.012]} />
              <meshStandardMaterial color="#0a0a0a" roughness={0.9} />
            </mesh>
          ))}
        </group>
      ))}

      {/*  Drive wheels (4x) with rubber tires  */}
      {wheelPositions.map((pos, wi) => (
        <group key={`wheel${wi}`} position={pos}>
          {/* Wheel hub */}
          <mesh ref={wheelRefs[wi]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[wheelR, wheelR, 0.008, 12]} />
            <meshPhysicalMaterial color="#303030" roughness={0.3} metalness={0.7} />
          </mesh>
          {/* Rubber tire */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[wheelR - 0.002, 0.003, 6, 12]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.9} metalness={0} />
          </mesh>
        </group>
      ))}

      {/*  Rail guide wheels (8x, 2 per side for X and Z rails)  */}
      {[
        [-chassisW / 2, 0, -0.06], [-chassisW / 2, 0, 0.06],
        [chassisW / 2, 0, -0.06], [chassisW / 2, 0, 0.06],
        [-0.06, 0, -chassisD / 2], [0.06, 0, -chassisD / 2],
        [-0.06, 0, chassisD / 2], [0.06, 0, chassisD / 2],
      ].map((pos, gi) => (
        <mesh key={`guide${gi}`} position={pos as [number, number, number]}>
          <sphereGeometry args={[0.005, 6, 6]} />
          <meshPhysicalMaterial {...M.machinedSteel} />
        </mesh>
      ))}

      {/*  LIDAR dome (rotating)  */}
      <mesh ref={lidarRef} position={[0, chassisH / 2 + 0.016, 0]}>
        <cylinderGeometry args={[0.018, 0.022, 0.014, 16]} />
        <meshPhysicalMaterial
          color="#1a1a22" roughness={0.2} metalness={0.6}
          clearcoat={0.8} clearcoatRoughness={0.1}
        />
      </mesh>
      {/* LIDAR window band */}
      <mesh position={[0, chassisH / 2 + 0.016, 0]}>
        <torusGeometry args={[0.02, 0.003, 4, 16]} />
        <meshStandardMaterial color="#111128" roughness={0.1} metalness={0.3} transparent opacity={0.7} />
      </mesh>

      {/*  Status LED strip (front)  */}
      {[-0.03, -0.01, 0.01, 0.03].map((xOff, li) => (
        <mesh key={`led${li}`} position={[xOff, chassisH / 2 + 0.004, -chassisD / 2 + 0.002]}>
          <boxGeometry args={[0.008, 0.004, 0.003]} />
          <meshStandardMaterial
            ref={li === 1 ? ledRef : undefined}
            color={emergency ? '#ff2020' : '#22cc44'}
            emissive={emergency ? '#ff2020' : '#22cc44'}
            emissiveIntensity={0.8}
            transparent opacity={0.95}
          />
        </mesh>
      ))}

      {/*  Rear status indicator  */}
      <mesh position={[0, chassisH / 2 + 0.004, chassisD / 2 - 0.002]}>
        <boxGeometry args={[0.04, 0.004, 0.003]} />
        <meshStandardMaterial
          color="#ffaa00" emissive="#ffaa00" emissiveIntensity={0.4}
          transparent opacity={0.8}
        />
      </mesh>

      {/*  Camera / sensor eye (front center)  */}
      <mesh position={[0, 0.005, -chassisD / 2 - 0.002]}>
        <boxGeometry args={[0.016, 0.012, 0.004]} />
        <meshPhysicalMaterial color="#0a0a10" roughness={0.1} metalness={0.8} clearcoat={1} />
      </mesh>
      {/* Camera lens */}
      <mesh position={[0, 0.005, -chassisD / 2 - 0.004]}>
        <circleGeometry args={[0.004, 12]} />
        <meshStandardMaterial color="#1122aa" emissive="#1122aa" emissiveIntensity={0.3} />
      </mesh>

      {/*  Gripper mechanism (underneath)  */}
      <group ref={gripperRef} position={[0, -chassisH / 2 - 0.005, 0]}>
        {/* Gripper frame */}
        <mesh>
          <boxGeometry args={[chassisW * 0.7, 0.006, chassisD * 0.7]} />
          <meshPhysicalMaterial color="#2a2a30" roughness={0.4} metalness={0.6} />
        </mesh>
        {/* Gripper fingers (2 sides) */}
        {[-1, 1].map(side => (
          <mesh key={`grip${side}`} position={[side * 0.03, -0.01, 0]}>
            <boxGeometry args={[0.006, 0.02, chassisD * 0.5]} />
            <meshPhysicalMaterial {...M.machinedSteel} />
          </mesh>
        ))}
        {/* Gripper lift cable guides */}
        {[[-0.04, 0, -0.04], [0.04, 0, -0.04], [-0.04, 0, 0.04], [0.04, 0, 0.04]].map((p, ci) => (
          <mesh key={`cg${ci}`} position={p as [number, number, number]}>
            <cylinderGeometry args={[0.003, 0.003, 0.008, 6]} />
            <meshPhysicalMaterial {...M.chrome} />
          </mesh>
        ))}
      </group>

      {/*  Lift belt spools (4 corners, visible on sides)  */}
      {[
        [-chassisW / 2 + 0.015, -0.01, -chassisD / 2 + 0.015],
        [chassisW / 2 - 0.015, -0.01, -chassisD / 2 + 0.015],
        [-chassisW / 2 + 0.015, -0.01, chassisD / 2 - 0.015],
        [chassisW / 2 - 0.015, -0.01, chassisD / 2 - 0.015],
      ].map((pos, si) => (
        <mesh key={`spool${si}`} position={pos as [number, number, number]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.006, 0.006, 0.008, 8]} />
          <meshPhysicalMaterial color="#555560" roughness={0.35} metalness={0.7} />
        </mesh>
      ))}

      {/*  Identification number  */}
      <Nameplate
        position={[0, chassisH / 2 + 0.01, -chassisD / 2 + 0.02]}
        rotation={[-Math.PI * 0.3, 0, 0]}
        width={0.03} height={0.008}
      />
    </group>
  );
}


export function AutoStoreRig() {
  const binRef = useRef<THREE.InstancedMesh>(null!);

  const speed = useStore(s => s.autostoreSpeed);
  const heatmap = useStore(s => s.autostoreHeatmap);
  const density = useStore(s => s.autostoreBinDensity);
  const emergency = useStore(s => s.emergencyStop);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tmpC = useMemo(() => new THREE.Color(), []);
  const heatData = useMemo(() => buildHeatData(), []);

  /* Per-bin access counters for dynamic heatmap */
  const accessCounters = useMemo(() => {
    const arr = new Float32Array(BIN_COUNT);
    for (let i = 0; i < BIN_COUNT; i++) arr[i] = heatData[i];
    return arr;
  }, [heatData]);

  const speedFactor = emergency ? 0 : speed / 100;

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

  /*  Initial bin placement (static)  */
  useEffect(() => {
    if (!binRef.current) return;
    let idx = 0;
    for (let l = 0; l < LAYERS; l++) {
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const x = (c - COLS / 2 + 0.5) * CELL;
          const y = l * LAYER_H + LAYER_H / 2 + 0.02;
          const z = (r - ROWS / 2 + 0.5) * CELL;
          dummy.position.set(x, y, z);
          dummy.rotation.set(0, 0, 0);
          dummy.scale.setScalar(1);
          dummy.updateMatrix();
          binRef.current.setMatrixAt(idx, dummy.matrix);
          idx++;
        }
      }
    }
    binRef.current.instanceMatrix.needsUpdate = true;
  }, [dummy]);

  /*  Update bin visibility + heatmap colours  */
  useFrame(() => {
    if (!binRef.current) return;
    const time = performance.now() * 0.001;

    let idx = 0;
    for (let l = 0; l < LAYERS; l++) {
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const vis = (idx / BIN_COUNT) * 100 < density;

          // Update scale only (position is static from init)
          const x = (c - COLS / 2 + 0.5) * CELL;
          const y = l * LAYER_H + LAYER_H / 2 + 0.02;
          const z = (r - ROWS / 2 + 0.5) * CELL;
          dummy.position.set(x, y, z);
          dummy.rotation.set(0, 0, 0); // Never rotate bins
          dummy.scale.setScalar(vis ? 1 : 0.001);
          dummy.updateMatrix();
          binRef.current.setMatrixAt(idx, dummy.matrix);

          if (heatmap && vis) {
            // Dynamic heatmap: slow drift to simulate changing access patterns
            const baseHeat = accessCounters[idx];
            const drift = Math.sin(time * 0.2 + idx * 0.15) * 0.15;
            const heat = Math.max(0, Math.min(1, baseHeat + drift));

            // Color gradient: blue (cold/low access) -> green -> yellow -> red (hot/high access)
            if (heat < 0.25) {
              tmpC.setRGB(0.1, 0.2 + heat * 2, 0.6 - heat);
            } else if (heat < 0.5) {
              const t = (heat - 0.25) * 4;
              tmpC.setRGB(0.1 + t * 0.3, 0.7, 0.35 - t * 0.35);
            } else if (heat < 0.75) {
              const t = (heat - 0.5) * 4;
              tmpC.setRGB(0.4 + t * 0.5, 0.7 - t * 0.2, 0.05);
            } else {
              const t = (heat - 0.75) * 4;
              tmpC.setRGB(0.9 + t * 0.1, 0.5 - t * 0.4, 0.05);
            }
          } else if (vis) {
            // Normal: alternating grey bin colours
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
  });

  return (
    <group position={[5.5, 0, 0]}>

      {/*  GRID FRAME  */}
      {uprights.map(([x, z], i) => (
        <group key={`up${i}`}>
          <mesh position={[x, GRID_H / 2, z]} castShadow>
            <boxGeometry args={[0.03, GRID_H, 0.03]} />
            <meshPhysicalMaterial {...M.brushedAluminium} />
          </mesh>
          {[0, Math.PI / 2].map((rot, ri) => (
            <mesh key={`tg${ri}`} position={[x, GRID_H / 2, z]} rotation={[0, rot, 0]}>
              <boxGeometry args={[0.006, GRID_H - 0.02, 0.032]} />
              <meshStandardMaterial color="#8a9099" roughness={0.5} metalness={0.3} />
            </mesh>
          ))}
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

      {/* Diagonal bracing */}
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

      {/* Top rail grid  X direction */}
      {Array.from({ length: COLS + 1 }).map((_, c) => (
        <mesh key={`trx${c}`} position={[c * CELL - GRID_W / 2, GRID_H, 0]}>
          <boxGeometry args={[0.016, 0.016, GRID_D + 0.02]} />
          <meshPhysicalMaterial {...M.machinedSteel} />
        </mesh>
      ))}
      {/* Top rail grid  Z direction */}
      {Array.from({ length: ROWS + 1 }).map((_, r) => (
        <mesh key={`trz${r}`} position={[0, GRID_H, r * CELL - GRID_D / 2]}>
          <boxGeometry args={[GRID_W + 0.02, 0.016, 0.016]} />
          <meshPhysicalMaterial {...M.machinedSteel} />
        </mesh>
      ))}

      {/*  INSTANCED BINS (static, no rotation)  */}
      <instancedMesh ref={binRef} args={[undefined, undefined, BIN_COUNT]} castShadow receiveShadow>
        <boxGeometry args={[CELL * 0.86, LAYER_H * 0.78, CELL * 0.86]} />
        <meshPhysicalMaterial vertexColors roughness={0.5} metalness={0.2} clearcoat={0.1} clearcoatRoughness={0.7} />
      </instancedMesh>

      {/*  DETAILED R5 ROBOTS  */}
      {Array.from({ length: BOT_COUNT }).map((_, i) => (
        <AutoStoreBot
          key={`bot${i}`}
          index={i}
          gridW={GRID_W}
          gridD={GRID_D}
          gridH={GRID_H}
          cell={CELL}
          speedFactor={speedFactor}
          emergency={emergency}
        />
      ))}

      {/*  INPUT PORT STATION  */}
      <group position={[-GRID_W / 2 - 0.3, 0, 0]}>
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[0.35, 1.0, 0.5]} />
          <meshPhysicalMaterial {...M.paintedSteel} />
        </mesh>
        <mesh position={[0.14, 0.55, 0]}>
          <boxGeometry args={[0.06, 0.32, 0.38]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
        </mesh>
        {Array.from({ length: 5 }).map((_, i) => (
          <mesh key={`ir${i}`} position={[-0.08, 0.42, -0.15 + i * 0.075]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.012, 0.012, 0.28, 8]} />
            <meshPhysicalMaterial {...M.machinedSteel} />
          </mesh>
        ))}
        <mesh position={[-0.02, 0.48, 0]} castShadow>
          <boxGeometry args={[CELL * 0.82, LAYER_H * 0.65, CELL * 0.82]} />
          <meshPhysicalMaterial color="#5a6878" roughness={0.5} metalness={0.2} />
        </mesh>
        <StatusLED position={[-0.176, 0.88, 0.15]} color="#00ff44" on={!emergency} />
        <StatusLED position={[-0.176, 0.88, -0.15]} color="#ff2020" on={emergency} />
        <Nameplate position={[-0.176, 0.75, 0]} rotation={[0, -Math.PI / 2, 0]} width={0.06} height={0.02} />
      </group>

      {/*  OUTPUT PORT STATION  */}
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

      {/*  INDUCTION CONVEYOR  */}
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

      {/*  CONTROLLER CABINET  */}
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

      {/*  PERIMETER SAFETY STRIPE  */}
      <mesh position={[0, 0.003, -GRID_D / 2 - 0.4]} receiveShadow>
        <boxGeometry args={[GRID_W + 1.2, 0.005, 0.04]} />
        <meshStandardMaterial color="#e8c020" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.003, GRID_D / 2 + 0.4]} receiveShadow>
        <boxGeometry args={[GRID_W + 1.2, 0.005, 0.04]} />
        <meshStandardMaterial color="#e8c020" roughness={0.6} />
      </mesh>

      {/*  DECALS  */}
      <WarningLabel position={[-GRID_W / 2 - 0.02, 0.5, 0]} rotation={[0, -Math.PI / 2, 0]} />
      <BarcodeTag position={[GRID_W / 2 + 0.02, 0.35, GRID_D / 4]} rotation={[0, Math.PI / 2, 0]} />

      {/*  LIGHT STACK  */}
      <LightStack position={[GRID_W / 2 + 0.3, 1.05, -GRID_D / 2 - 0.3]} activeIndex={emergency ? 0 : 2} />

      {/*  CABLES  */}
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
