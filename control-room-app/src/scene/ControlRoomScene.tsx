import { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, SoftShadows } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../state/store';
import { WarehouseEnvironment } from './WarehouseEnvironment';
import { ControlDesk } from './ControlDesk';
import { AutoStoreGrid } from './AutoStoreGrid';
import { ConveyorBelt } from './ConveyorBelt';
import { Depalletizer } from './Depalletizer';
import { Palletizer } from './Palletizer';
import { DustParticles } from './DustParticles';
import { SceneLighting } from './SceneLighting';
import { PostProcessing } from './PostProcessing';

/* Camera positions for focus targets */
const cameraPositions: Record<string, { pos: [number, number, number]; target: [number, number, number] }> = {
  overview: { pos: [0, 5.5, 8], target: [0, 0.8, 0] },
  autostore: { pos: [4.5, 3, 0.5], target: [3, 0.8, -1.5] },
  depalletizer: { pos: [-2.5, 2.5, 0], target: [-3.5, 0.8, -1.5] },
  palletizer: { pos: [4, 2.5, 4], target: [3.5, 0.8, 2.5] },
  conveyors: { pos: [-1, 2, 4], target: [-2, 0.3, 2] },
  safety: { pos: [0, 3, 2], target: [0, 1, 0] },
  'cr-manager': { pos: [-0.5, 2.5, 2.5], target: [0, 0.8, 0] },
  'flow-controller': { pos: [-2, 2, 3.5], target: [-2, 0.3, 2] },
  'wms-coordinator': { pos: [3.5, 2.5, 1], target: [3, 0.8, -1.5] },
  'incident-lead': { pos: [0, 2.5, 1.5], target: [0, 1, 0] },
  'perf-analyst': { pos: [1, 2, 2], target: [0, 0.8, 0] },
};

function CameraController() {
  const { camera, gl } = useThree();
  const controlsRef = useRef<any>(null);
  const target = useStore(s => s.cameraTarget);
  const mouseRef = useRef({ x: 0, y: 0 });

  // Mouse parallax
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    gl.domElement.addEventListener('mousemove', handler);
    return () => gl.domElement.removeEventListener('mousemove', handler);
  }, [gl.domElement]);

  useFrame((_, delta) => {
    const config = cameraPositions[target] || cameraPositions.overview;
    const [tx, ty, tz] = config.pos;

    // Subtle parallax offset based on mouse
    const parallaxX = mouseRef.current.x * 0.15;
    const parallaxY = -mouseRef.current.y * 0.08;

    // Gentle ambient drift
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

/** Simulation ticker */
function SimTicker() {
  const tick = useStore(s => s.tick);
  const frameCount = useRef(0);

  useFrame(() => {
    frameCount.current++;
    // Tick every 3 frames for perf
    if (frameCount.current % 3 === 0) {
      tick();
    }
  });

  return null;
}

export function ControlRoomScene() {
  const performanceMode = useStore(s => s.performanceMode);
  const shift = useStore(s => s.shiftMode);

  return (
    <Canvas
      camera={{ position: [0, 5.5, 8], fov: 45, near: 0.1, far: 100 }}
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
      <fog attach="fog" args={[shift === 'night' ? '#1a1e28' : '#3a3e48', 14, 35]} />

      {/* PCSS soft shadows — penumbra size varies with distance */}
      {!performanceMode && <SoftShadows size={25} samples={16} focus={0.5} />}

      <CameraController />
      <SimTicker />
      <SceneLighting />
      <WarehouseEnvironment />
      <ControlDesk />
      <AutoStoreGrid />
      <ConveyorBelt />
      <Depalletizer />
      <Palletizer />
      {!performanceMode && <DustParticles />}
      <PostProcessing />
    </Canvas>
  );
}
