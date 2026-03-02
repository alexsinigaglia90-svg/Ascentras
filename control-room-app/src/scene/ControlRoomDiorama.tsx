import { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, SoftShadows } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../state/store';
import { WarehouseEnvironment } from './WarehouseEnvironment';
import { ControlDesk } from './ControlDesk';
import { AutoStoreRig } from './machines/AutoStoreRig';
import { ConveyorRig } from './machines/ConveyorRig';
import { DepalletizerRig } from './machines/DepalletizerRig';
import { PalletizerRig } from './machines/PalletizerRig';
import { DecantingStations } from './machines/DecantingStations';
import { IndustrialDetails } from './props/IndustrialDetails';
import { DustParticles } from './DustParticles';
import { CinematicLighting } from './lighting/CinematicLighting';
import { CinematicPost } from './post/CinematicPost';

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
      enablePan={false}
      enableZoom={true}
      minDistance={3}
      maxDistance={16}
      minPolarAngle={0.3}
      maxPolarAngle={Math.PI * 0.45}
      dampingFactor={0.05}
      enableDamping
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

/* ══════════════════════════════════════════════════════
 *  ControlRoomDiorama – main Canvas with cinematic
 *  renderer, pushed-back fog, clean scene composition.
 *  ══════════════════════════════════════════════════════ */
export function ControlRoomDiorama() {
  const performanceMode = useStore(s => s.performanceMode);
  const shift = useStore(s => s.shiftMode);

  return (
    <Canvas
      camera={{ position: [0, 6, 10], fov: 45, near: 0.1, far: 100 }}
      shadows={!performanceMode}
      dpr={performanceMode ? 1 : [1, 1.5]}
      gl={{
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: shift === 'night' ? 0.85 : 1.6,
        outputColorSpace: THREE.SRGBColorSpace,
        antialias: !performanceMode,
        powerPreference: 'high-performance',
      }}
      style={{ position: 'absolute', inset: 0 }}
    >
      {/* Fog pushed back from 14→22 to eliminate haze on the scene  */}
      <fog attach="fog" args={[shift === 'night' ? '#1a1e28' : '#3a3e48', 22, 45]} />

      {!performanceMode && <SoftShadows size={25} samples={16} focus={0.5} />}

      <CameraController />
      <SimTicker />

      {/* Lighting */}
      <CinematicLighting />

      {/* Environment shell */}
      <WarehouseEnvironment />

      {/* Operator station */}
      <ControlDesk />

      {/* Machines — flowing operation: Depal → Conv → Decanting → AutoStore */}
      <DepalletizerRig />
      <ConveyorRig />
      <DecantingStations />
      <AutoStoreRig />
      <PalletizerRig />

      {/* Shared industrial detail layer */}
      <IndustrialDetails />

      {/* Atmospheric particles */}
      {!performanceMode && <DustParticles />}

      {/* Postprocessing – NO DOF, NO ChromaticAberration */}
      <CinematicPost />
    </Canvas>
  );
}
