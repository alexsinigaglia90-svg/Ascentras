import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../../state/store';

const HDRI_PATH = `${import.meta.env.BASE_URL}hdri/empty_warehouse_01_1k.hdr`;

/**
 * Cinematic 3-point lighting with HDR environment, contact shadows,
 * volumetric beam cones, and physically motivated light placement.
 * NO haze, NO milky fog — just clean, rich light.
 */
export function CinematicLighting() {
  const shift = useStore(s => s.shiftMode);
  const emergency = useStore(s => s.emergencyStop);
  const performanceMode = useStore(s => s.performanceMode);

  const mainRef = useRef<THREE.DirectionalLight>(null!);
  const fillRef = useRef<THREE.DirectionalLight>(null!);
  const ambRef = useRef<THREE.AmbientLight>(null!);
  const rimRef = useRef<THREE.SpotLight>(null!);

  useFrame(() => {
    if (!mainRef.current || !ambRef.current) return;
    const isNight = shift === 'night';

    const tAmb = emergency ? 0.15 : isNight ? 0.2 : 0.55;
    ambRef.current.intensity += (tAmb - ambRef.current.intensity) * 0.04;
    ambRef.current.color.lerp(new THREE.Color(isNight ? '#2a3050' : '#f0ece4'), 0.03);

    const tKey = emergency ? 0.5 : isNight ? 0.8 : 2.6;
    mainRef.current.intensity += (tKey - mainRef.current.intensity) * 0.04;

    if (fillRef.current) {
      const tFill = emergency ? 0.2 : isNight ? 0.3 : 1.1;
      fillRef.current.intensity += (tFill - fillRef.current.intensity) * 0.04;
    }

    if (rimRef.current) {
      const tRim = emergency ? 0.1 : isNight ? 0.2 : 0.7;
      rimRef.current.intensity += (tRim - rimRef.current.intensity) * 0.04;
    }
  });

  const isNight = shift === 'night';
  const shadowSize = performanceMode ? 512 : 2048;

  return (
    <>
      {/* ── HDR Environment (Poly Haven CC0 warehouse) ── */}
      <Environment
        files={HDRI_PATH}
        background={false}
        environmentIntensity={isNight ? 0.15 : 0.4}
      />

      {/* ── Ambient base ── */}
      <ambientLight ref={ambRef} intensity={0.55} color="#f0ece4" />

      {/* ── Key light — high right, warm ── */}
      <directionalLight
        ref={mainRef}
        position={[5, 12, 7]}
        intensity={2.6}
        color="#fff6e8"
        castShadow={!performanceMode}
        shadow-mapSize-width={shadowSize}
        shadow-mapSize-height={shadowSize}
        shadow-camera-far={35}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-bias={-0.0003}
        shadow-normalBias={0.02}
        shadow-radius={performanceMode ? 1 : 4}
      />

      {/* ── Fill light — opposite side, cooler ── */}
      <directionalLight
        ref={fillRef}
        position={[-6, 8, 4]}
        intensity={1.1}
        color="#d0d8e8"
        castShadow={!performanceMode}
        shadow-mapSize-width={performanceMode ? 256 : 1024}
        shadow-mapSize-height={performanceMode ? 256 : 1024}
        shadow-camera-far={25}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      />

      {/* ── Rim / back light — warm cinematic edge separation ── */}
      <spotLight
        ref={rimRef}
        position={[0, 6, -8]}
        angle={0.5}
        penumbra={0.8}
        intensity={0.7}
        color="#e8c878"
        distance={20}
        castShadow={false}
      />

      {/* ── Volumetric light beams (faked with transparent cones) ── */}
      {!performanceMode && (
        <>
          <VolumetricBeam position={[-3, 4.5, -1]} color="#f0e8d0" intensity={0.12} />
          <VolumetricBeam position={[0, 4.5, 0]} color="#f0e8d0" intensity={0.1} />
          <VolumetricBeam position={[3, 4.5, 1]} color="#f0e8d0" intensity={0.08} />
        </>
      )}

      {/* ── Machine zone accent lights ── */}
      <pointLight position={[0, 1.2, -0.2]} intensity={emergency ? 0.8 : 0.5} color={emergency ? '#ff2020' : '#70c0a0'} distance={5} decay={2} />
      <pointLight position={[3.2, 2.5, -1.5]} intensity={0.4} color="#7090b0" distance={7} decay={2} />
      <pointLight position={[-2, 1.5, 2]} intensity={0.3} color="#b0a080" distance={6} decay={2} />
      <pointLight position={[-3.5, 2, -1.5]} intensity={0.3} color="#90a0b0" distance={6} decay={2} />
      <pointLight position={[3.5, 2, 2.5]} intensity={0.25} color="#a09080" distance={6} decay={2} />

      {/* ── Overhead warehouse pendants ── */}
      {[-4, -1.3, 1.3, 4].map((x, i) => (
        <group key={i}>
          <spotLight
            position={[x, 4.2, i % 2 === 0 ? -2 : 2]}
            angle={0.6}
            penumbra={0.6}
            intensity={isNight ? 0.15 : 0.4}
            color="#fff0d0"
            distance={8}
            decay={2}
            castShadow={false}
          />
          {/* Physical lamp housing */}
          <mesh position={[x, 4.15, i % 2 === 0 ? -2 : 2]}>
            <cylinderGeometry args={[0.12, 0.18, 0.08, 8]} />
            <meshStandardMaterial color="#3a3a3a" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[x, 4.1, i % 2 === 0 ? -2 : 2]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshBasicMaterial color="#fff8e0" />
          </mesh>
        </group>
      ))}

      {/* ── Contact shadows on the floor ── */}
      {!performanceMode && (
        <ContactShadows
          position={[0, 0.001, 0]}
          scale={18}
          blur={2.0}
          far={4}
          opacity={0.45}
          color="#1a1820"
        />
      )}

      {/* ── Pedestal rim glow strips ── */}
      <RimStrip position={[-8, 0.05, 0]} width={0.05} height={14} color="#c8a868" intensity={0.1} />
      <RimStrip position={[8, 0.05, 0]} width={0.05} height={14} color="#c8a868" intensity={0.1} />
      <RimStrip position={[0, 0.05, -7]} width={16} height={0.05} color="#8090b0" intensity={0.06} />
      <RimStrip position={[0, 0.05, 7]} width={16} height={0.05} color="#8090b0" intensity={0.06} />
    </>
  );
}

function VolumetricBeam({ position, color, intensity }: {
  position: [number, number, number];
  color: string;
  intensity: number;
}) {
  const ref = useRef<THREE.Mesh>(null!);
  const shift = useStore(s => s.shiftMode);

  useFrame(() => {
    if (!ref.current) return;
    const mat = ref.current.material as THREE.MeshBasicMaterial;
    mat.opacity = shift === 'night' ? intensity * 0.3 : intensity;
  });

  return (
    <mesh ref={ref} position={[position[0], position[1] * 0.5, position[2]]}>
      <cylinderGeometry args={[0.05, 0.8, position[1], 12, 1, true]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={intensity}
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

function RimStrip({ position, width, height, color, intensity }: {
  position: [number, number, number];
  width: number;
  height: number;
  color: string;
  intensity: number;
}) {
  return (
    <mesh position={position} rotation={[-Math.PI * 0.5, 0, 0]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={intensity}
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
