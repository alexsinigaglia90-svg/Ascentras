import { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../state/store';
import { StylizedWarehouse } from './StylizedWarehouse';
import { StylizedMachines } from './StylizedMachines';
import { LightingSetup } from './LightingSetup';
import { AMRFleet } from './machines/AMRFleet';

const cameraPositions: Record<string, { pos: [number, number, number]; target: [number, number, number] }> = {
  overview: { pos: [0, 6.8, 11], target: [0, 0.9, 0] },
  autostore: { pos: [6.3, 3, 2], target: [5.5, 0.8, 0] },
  depalletizer: { pos: [-5.6, 2.6, 2.3], target: [-5.1, 0.6, -1.2] },
  palletizer: { pos: [7.2, 2.7, 4.3], target: [6, 0.7, 2.4] },
  conveyors: { pos: [0, 2.4, 4.1], target: [0, 0.4, 0] },
  decanting: { pos: [3.4, 2.4, 3.4], target: [3.1, 0.6, 0] },
  safety: { pos: [0, 3.2, 2.8], target: [0, 0.8, 0] },
  'cr-manager': { pos: [0.5, 2.8, 5], target: [0.2, 0.7, -2.8] },
  'flow-controller': { pos: [-0.6, 2.1, 4], target: [0, 0.6, 0.2] },
  'wms-coordinator': { pos: [4.8, 2.4, 2.8], target: [3.2, 0.6, 0.8] },
  'incident-lead': { pos: [0, 3.2, 3.1], target: [0, 0.8, 0] },
  'perf-analyst': { pos: [1.4, 2.6, 4], target: [0.8, 0.8, 0.3] },
  'amr-fleet': { pos: [-5.2, 2.2, -3.7], target: [-5.7, 0.5, -2.4] },
};

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

    const parallaxX = mouseRef.current.x * 0.12;
    const parallaxY = -mouseRef.current.y * 0.06;
    const time = performance.now() * 0.0001;
    const driftX = Math.sin(time * 0.65) * 0.02;
    const driftY = Math.cos(time * 0.45) * 0.012;

    camera.position.x += ((tx + parallaxX + driftX) - camera.position.x) * 0.03;
    camera.position.y += ((ty + parallaxY + driftY) - camera.position.y) * 0.03;
    camera.position.z += (tz - camera.position.z) * 0.03;

    if (controlsRef.current) {
      const [lx, ly, lz] = config.target;
      controlsRef.current.target.x += (lx - controlsRef.current.target.x) * 0.03;
      controlsRef.current.target.y += (ly - controlsRef.current.target.y) * 0.03;
      controlsRef.current.target.z += (lz - controlsRef.current.target.z) * 0.03;
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan
      enableZoom
      minDistance={2}
      maxDistance={24}
      minPolarAngle={0.15}
      maxPolarAngle={Math.PI * 0.55}
      dampingFactor={0.05}
      enableDamping
      panSpeed={0.5}
      rotateSpeed={0.6}
    />
  );
}

function SimTicker() {
  const tick = useStore(s => s.tick);
  const frameCount = useRef(0);

  useFrame(() => {
    frameCount.current++;
    if (frameCount.current % 3 === 0) tick();
  });

  return null;
}

export function ControlRoomDiorama() {
  const performanceMode = useStore(s => s.performanceMode);
  const shift = useStore(s => s.shiftMode);

  return (
    <Canvas
      camera={{ position: [0, 6.8, 11], fov: 42, near: 0.1, far: 100 }}
      shadows={!performanceMode}
      dpr={performanceMode ? 1 : [1, 1.5]}
      gl={{
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: shift === 'night' ? 0.92 : 1.2,
        outputColorSpace: THREE.SRGBColorSpace,
        antialias: !performanceMode,
        powerPreference: 'high-performance',
        alpha: false,
        stencil: false,
        depth: true,
      }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <fog attach="fog" args={[shift === 'night' ? '#cad7f4' : '#eef4fb', 16, 38]} />

      <CameraController />
      <SimTicker />

      <LightingSetup />
      <StylizedWarehouse />
      <StylizedMachines />

      <AMRFleet />

      {/* fail-safe: keep scene visible even if post FX causes a blank frame on some GPUs */}
      {false && <CinematicPost />}
    </Canvas>
  );
}