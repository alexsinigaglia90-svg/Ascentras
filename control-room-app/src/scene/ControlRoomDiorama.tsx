import { useRef, useEffect, lazy, Suspense, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../state/store';
import { WarehouseEnvironment } from './WarehouseEnvironment';
import { ControlDesk } from './ControlDesk';
import { CinematicLighting } from './lighting/CinematicLighting';
import { CinematicPost } from './post/CinematicPost';

/* Lazy-load heavy machine rigs — they are complex geometry builders */
const AutoStoreRig = lazy(() => import('./machines/AutoStoreRig').then(m => ({ default: m.AutoStoreRig })));
const ConveyorRig = lazy(() => import('./machines/ConveyorRig').then(m => ({ default: m.ConveyorRig })));
const DepalletizerRig = lazy(() => import('./machines/DepalletizerRig').then(m => ({ default: m.DepalletizerRig })));
const PalletizerRig = lazy(() => import('./machines/PalletizerRig').then(m => ({ default: m.PalletizerRig })));
const DecantingStations = lazy(() => import('./machines/DecantingStations').then(m => ({ default: m.DecantingStations })));
const AMRFleet = lazy(() => import('./machines/AMRFleet').then(m => ({ default: m.AMRFleet })));
const IndustrialDetails = lazy(() => import('./props/IndustrialDetails').then(m => ({ default: m.IndustrialDetails })));
const DustParticles = lazy(() => import('./DustParticles').then(m => ({ default: m.DustParticles })));

/* ── Camera positions (updated for flowing layout) ── */
const cameraPositions: Record<string, { pos: [number, number, number]; target: [number, number, number] }> = {
  overview:        { pos: [0, 6, 10],      target: [0.5, 0.6, 0] },
  autostore:       { pos: [6.5, 3, 2],     target: [5.5, 0.8, 0] },
  depalletizer:    { pos: [-4, 2.5, 2.5],  target: [-5.2, 0.8, 0] },
  palletizer:      { pos: [7, 2.5, 4.5],   target: [6, 0.8, 2.5] },
  conveyors:       { pos: [0, 2, 3],       target: [-1, 0.3, 0] },
  decanting:       { pos: [3.5, 2.5, 3],   target: [3, 0.5, 0] },
  safety:          { pos: [0, 3.5, 3],     target: [0, 1, 0] },
  'cr-manager':    { pos: [0, 3, 5],       target: [0.5, 0.8, 0] },
  'flow-controller':{ pos: [-1, 2, 4],     target: [-1, 0.3, 0] },
  'wms-coordinator':{ pos: [5, 2.5, 2.5],  target: [5.5, 0.8, 0] },
  'incident-lead': { pos: [0, 3, 3],       target: [0, 1, 0] },
  'perf-analyst':  { pos: [1.5, 2.5, 4],   target: [1, 0.8, 0] },
  'amr-fleet':     { pos: [-5, 2, -3],     target: [-4, 0.3, -1] },
};

/* ── Camera with parallax + drift ── */
function CameraController() {
  const { camera, gl } = useThree();
  const controlsRef = useRef<any>(null);
  const target = useStore(s => s.cameraTarget);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    gl.domElement.addEventListener('mousemove', handler);
    return () => gl.domElement.removeEventListener('mousemove', handler);
  }, [gl.domElement]);

  useFrame(() => {
    const config = cameraPositions[target] || cameraPositions.overview;
    const [tx, ty, tz] = config.pos;

    const parallaxX = mouseRef.current.x * 0.15;
    const parallaxY = -mouseRef.current.y * 0.08;

    const time = performance.now() * 0.0001;
    const driftX = Math.sin(time * 0.7) * 0.03;
    const driftY = Math.cos(time * 0.5) * 0.015;

    camera.position.x += ((tx + parallaxX + driftX) - camera.position.x) * 0.025;
    camera.position.y += ((ty + parallaxY + driftY) - camera.position.y) * 0.025;
    camera.position.z += (tz - camera.position.z) * 0.025;

    if (controlsRef.current) {
      const [lx, ly, lz] = config.target;
      controlsRef.current.target.x += (lx - controlsRef.current.target.x) * 0.025;
      controlsRef.current.target.y += (ly - controlsRef.current.target.y) * 0.025;
      controlsRef.current.target.z += (lz - controlsRef.current.target.z) * 0.025;
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      minDistance={2}
      maxDistance={24}
      minPolarAngle={0.1}
      maxPolarAngle={Math.PI * 0.55}
      dampingFactor={0.04}
      enableDamping
      panSpeed={0.5}
      rotateSpeed={0.6}
    />
  );
}

/* ── Simulation tick ── */
function SimTicker() {
  const tick = useStore(s => s.tick);
  const frameCount = useRef(0);

  useFrame(() => {
    frameCount.current++;
    if (frameCount.current % 3 === 0) tick();
  });

  return null;
}

function SceneLoadingFallback() {
  return (
    <group>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14, 10]} />
        <meshStandardMaterial color="#5f646d" roughness={0.9} metalness={0.05} />
      </mesh>

      {[[-2.2, 0.4, -1], [0, 0.4, 0], [2.2, 0.4, 1]].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]} castShadow>
          <boxGeometry args={[1.2, 0.8, 0.8]} />
          <meshStandardMaterial color="#7b8595" roughness={0.7} metalness={0.15} />
        </mesh>
      ))}
    </group>
  );
}

/* ══════════════════════════════════════════════════════
 *  ControlRoomDiorama – main Canvas with cinematic
 *  renderer, pushed-back fog, clean scene composition.
 *  ══════════════════════════════════════════════════════ */
export function ControlRoomDiorama() {
  const performanceMode = useStore(s => s.performanceMode);
  const ultraVisualMode = useStore(s => s.ultraVisualMode);
  const shift = useStore(s => s.shiftMode);
  const [adaptivePerf, setAdaptivePerf] = useState(false);

  useEffect(() => {
    const nav = navigator as Navigator & { deviceMemory?: number };
    const lowCore = typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency <= 4;
    const lowMemory = typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 4;
    const preferReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
    setAdaptivePerf(lowCore || lowMemory || preferReducedMotion);
  }, []);

  const quality = useMemo<'safe' | 'balanced' | 'cinematic' | 'ultra'>(() => {
    if (performanceMode || adaptivePerf) return 'safe';
    if (ultraVisualMode) return 'ultra';
    return shift === 'night' ? 'balanced' : 'cinematic';
  }, [performanceMode, adaptivePerf, ultraVisualMode, shift]);

  const effectivePerformance = quality === 'safe';
  const dprSetting: 1 | [number, number] = quality === 'safe' ? 1 : quality === 'balanced' ? [1, 1.25] : quality === 'ultra' ? [1.25, 2] : [1, 1.5];
  const shadowEnabled = !effectivePerformance;
  const antialiasEnabled = !effectivePerformance;
  const exposure = shift === 'night'
    ? (quality === 'safe' ? 0.8 : quality === 'balanced' ? 0.92 : quality === 'ultra' ? 1.08 : 1.04)
    : quality === 'ultra' ? 1.7 : quality === 'cinematic' ? 1.62 : 1.4;

  return (
    <Canvas
      camera={{ position: [0, 6, 10], fov: quality === 'cinematic' || quality === 'ultra' ? 42 : 45, near: 0.1, far: 140 }}
      shadows={shadowEnabled}
      dpr={dprSetting}
      gl={{
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: exposure,
        outputColorSpace: THREE.SRGBColorSpace,
        physicallyCorrectLights: true,
        antialias: antialiasEnabled,
        powerPreference: 'high-performance',
        alpha: false,
        stencil: false,
        depth: true,
      }}
      style={{ position: 'absolute', inset: 0 }}
      frameloop="demand"
      onCreated={({ gl, invalidate }) => {
        /* Switch to continuous rendering after first frame */
        gl.setAnimationLoop(() => { invalidate(); });
      }}
    >
      <color attach="background" args={[shift === 'night' ? '#131824' : '#dbe2ea']} />
      <fog attach="fog" args={[shift === 'night' ? '#171f31' : '#cfd6df', quality === 'ultra' ? 22 : quality === 'cinematic' ? 20 : 22, quality === 'ultra' ? 70 : quality === 'cinematic' ? 62 : 50]} />

      <CameraController />
      <SimTicker />

      {/* Lighting */}
      <CinematicLighting performanceOverride={effectivePerformance} quality={quality} />

      {/* Environment shell */}
      <WarehouseEnvironment />

      {/* Operator station */}
      <ControlDesk />

      {/* Machines — lazy-loaded for faster initial paint */}
      <Suspense fallback={<SceneLoadingFallback />}>
        <DepalletizerRig />
        <ConveyorRig />
        <DecantingStations />
        <AutoStoreRig />
        <PalletizerRig />
        <AMRFleet />
        <IndustrialDetails />
        {!effectivePerformance && <DustParticles />}
      </Suspense>

      {/* Postprocessing – NO DOF, NO ChromaticAberration */}
      <CinematicPost quality={quality} />
    </Canvas>
  );
}
