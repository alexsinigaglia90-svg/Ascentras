import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../../state/store';

const HDRI_PATH = `${import.meta.env.BASE_URL}hdri/empty_warehouse_01_1k.hdr`;

/**
 * Deep cinematic lighting with ray-tracing quality feel.
 * Multiple bounce-simulating fills, breathing volumetric beams,
 * accent highlights for every machine zone, and floor glow.
 */
export function CinematicLighting({
  performanceOverride,
  quality = 'cinematic',
}: {
  performanceOverride?: boolean;
  quality?: 'safe' | 'balanced' | 'cinematic';
}) {
  const shift = useStore(s => s.shiftMode);
  const emergency = useStore(s => s.emergencyStop);
  const performanceMode = useStore(s => s.performanceMode);
  const effectivePerformance = performanceOverride ?? performanceMode;
  const balanced = quality === 'balanced';
  const cinematic = quality === 'cinematic';

  const mainRef = useRef<THREE.DirectionalLight>(null!);
  const fillRef = useRef<THREE.DirectionalLight>(null!);
  const bounceFillRef = useRef<THREE.DirectionalLight>(null!);
  const ambRef = useRef<THREE.AmbientLight>(null!);
  const rimRef = useRef<THREE.SpotLight>(null!);
  const accentRefs = useRef<THREE.PointLight[]>([]);

  useFrame(({ clock }) => {
    if (!mainRef.current || !ambRef.current) return;
    const isNight = shift === 'night';
    const t = clock.getElapsedTime();

    // Ambient — deeper night, warmer day
    const tAmb = emergency ? 0.12 : isNight ? 0.15 : 0.45;
    ambRef.current.intensity += (tAmb - ambRef.current.intensity) * 0.04;
    ambRef.current.color.lerp(new THREE.Color(isNight ? '#1a2040' : '#ede8df'), 0.03);

    // Key light — warm, slightly animated intensity for "living" feel
    const breathe = Math.sin(t * 0.4) * 0.06;
    const tKey = emergency ? 0.4 : isNight ? 0.6 : 2.8 + breathe;
    mainRef.current.intensity += (tKey - mainRef.current.intensity) * 0.04;

    // Fill
    if (fillRef.current) {
      const tFill = emergency ? 0.15 : isNight ? 0.2 : 1.3;
      fillRef.current.intensity += (tFill - fillRef.current.intensity) * 0.04;
    }

    // Bounce fill — simulates indirect bounce from floor
    if (bounceFillRef.current) {
      const tBounce = emergency ? 0.05 : isNight ? 0.08 : 0.5;
      bounceFillRef.current.intensity += (tBounce - bounceFillRef.current.intensity) * 0.04;
    }

    // Rim
    if (rimRef.current) {
      const tRim = emergency ? 0.08 : isNight ? 0.15 : 0.9;
      rimRef.current.intensity += (tRim - rimRef.current.intensity) * 0.04;
    }

    // Machine accent lights — subtle pulsing for "alive" feel
    accentRefs.current.forEach((light, i) => {
      if (!light) return;
      const phase = t * (0.3 + i * 0.07) + i * 1.2;
      const pulse = 1 + Math.sin(phase) * 0.08;
      light.intensity = (emergency ? 0.2 : isNight ? 0.15 : 0.35) * pulse;
    });
  });

  const isNight = shift === 'night';
  const shadowSize = effectivePerformance ? 512 : balanced ? 1024 : 2048;

  /* Machine zone accent colours & positions */
  const accents: { pos: [number, number, number]; color: string; dist: number }[] = [
    { pos: [0, 1.4, -0.2], color: emergency ? '#ff2020' : '#60d0a0', dist: 5 },
    { pos: [-5.2, 2.0, 0], color: '#ff8040', dist: 6 },
    { pos: [-1, 1.7, 0.3], color: '#50a0d0', dist: 6 },
    { pos: [3, 1.8, 0], color: '#d0a050', dist: 7 },
    { pos: [5.5, 2.5, 0], color: '#5070d0', dist: 7 },
    { pos: [6, 1.5, 2.5], color: '#c06040', dist: 5 },
    { pos: [-3.5, 2.2, -1.5], color: '#8090c0', dist: 5 },
    { pos: [1.5, 1, 2.5], color: '#a0c070', dist: 4 },
  ];

  return (
    <>
      {/* ── HDR Environment ── */}
      <Environment
        files={HDRI_PATH}
        background={false}
        environmentIntensity={isNight ? 0.1 : cinematic ? 0.35 : 0.24}
      />

      {/* ── Ambient base — lowered to let directional lights sculpt deeper ── */}
      <ambientLight ref={ambRef} intensity={0.45} color="#ede8df" />

      {/* ── Key light — high right, warm ── */}
      <directionalLight
        ref={mainRef}
        position={[5, 14, 7]}
        intensity={cinematic ? 2.8 : 2.0}
        color="#fff4e0"
        castShadow={!effectivePerformance}
        shadow-mapSize-width={shadowSize}
        shadow-mapSize-height={shadowSize}
        shadow-camera-far={40}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-bias={-0.0002}
        shadow-normalBias={0.015}
        shadow-radius={effectivePerformance ? 1 : balanced ? 3 : 5}
      />

      {/* ── Fill light — cool blue, opposite side ── */}
      <directionalLight
        ref={fillRef}
        position={[-7, 9, 5]}
        intensity={cinematic ? 1.3 : 0.95}
        color="#c0d0e8"
        castShadow={!effectivePerformance}
        shadow-mapSize-width={effectivePerformance ? 256 : balanced ? 512 : 1024}
        shadow-mapSize-height={effectivePerformance ? 256 : balanced ? 512 : 1024}
        shadow-camera-far={28}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />

      {/* ── Bounce fill — simulates floor reflection ── */}
      <directionalLight
        ref={bounceFillRef}
        position={[0, -2, 0]}
        intensity={0.5}
        color="#d0c8b8"
        castShadow={false}
      />

      {/* ── Rim / back light — strong golden edge separation ── */}
      <spotLight
        ref={rimRef}
        position={[0, 7, -9]}
        angle={0.55}
        penumbra={0.85}
        intensity={0.9}
        color="#e8c060"
        distance={22}
        castShadow={false}
      />

      {/* ── Secondary rim — left side separation ── */}
      <spotLight
        position={[-8, 5, 3]}
        angle={0.4}
        penumbra={0.7}
        intensity={isNight ? 0.1 : 0.35}
        color="#7090c0"
        distance={18}
        castShadow={false}
      />

      {/* ── Volumetric light beams — breathing opacity ── */}
      {!effectivePerformance && cinematic && (
        <>
          <VolumetricBeam position={[-4.5, 5.5, -1]} color="#f0e8d0" intensity={0.14} width={1.0} />
          <VolumetricBeam position={[-1, 5.5, 0.5]} color="#f0e8d0" intensity={0.12} width={0.9} />
          <VolumetricBeam position={[2.5, 5.5, -0.5]} color="#f0e8d0" intensity={0.1} width={1.1} />
          <VolumetricBeam position={[5.5, 5.5, 1]} color="#e8e0c0" intensity={0.09} width={0.8} />
          <VolumetricBeam position={[0, 5.5, 2.5]} color="#e0d8c0" intensity={0.07} width={0.6} />
        </>
      )}

      {/* ── Machine zone accent lights — pulsing ── */}
      {accents.map((a, i) => (
        <pointLight
          key={i}
          ref={(el: THREE.PointLight | null) => { if (el) accentRefs.current[i] = el; }}
          position={a.pos}
          intensity={0.35}
          color={a.color}
          distance={a.dist}
          decay={2}
        />
      ))}

      {/* ── Overhead warehouse pendants — two rows ── */}
      {[-5.5, -3, -0.5, 2, 4.5, 7].map((x, i) => (
        <group key={`pendant-${i}`}>
          <spotLight
            position={[x, 4.8, i % 2 === 0 ? -2.5 : 2.5]}
            angle={0.65}
            penumbra={0.7}
            intensity={isNight ? 0.12 : 0.45}
            color="#fff0d0"
            distance={9}
            decay={2}
            castShadow={false}
          />
          {/* Pendant housing */}
          <mesh position={[x, 4.7, i % 2 === 0 ? -2.5 : 2.5]}>
            <cylinderGeometry args={[0.1, 0.16, 0.07, 8]} />
            <meshStandardMaterial color="#333" metalness={0.8} roughness={0.25} />
          </mesh>
          {/* Lamp bulb — emissive */}
          <mesh position={[x, 4.64, i % 2 === 0 ? -2.5 : 2.5]}>
            <sphereGeometry args={[0.035, 8, 8]} />
            <meshStandardMaterial color="#fff8e0" emissive="#fff0c0" emissiveIntensity={isNight ? 0.5 : 2.5} toneMapped={false} />
          </mesh>
          {/* Suspension wire */}
          <mesh position={[x, 5.3, i % 2 === 0 ? -2.5 : 2.5]}>
            <cylinderGeometry args={[0.003, 0.003, 1.2, 4]} />
            <meshStandardMaterial color="#555" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      ))}

      {/* ── Contact floor shadows — wider, deeper ── */}
      {!effectivePerformance && (
        <ContactShadows
          position={[0, 0.001, 0]}
          scale={balanced ? 18 : 22}
          blur={balanced ? 2 : 2.5}
          far={5}
          opacity={balanced ? 0.44 : 0.55}
          color="#0a0810"
        />
      )}

      {/* ── Floor edge glow strips ── */}
      <RimStrip position={[-9, 0.04, 0]} width={0.06} height={16} color="#c8a858" intensity={0.12} />
      <RimStrip position={[9, 0.04, 0]} width={0.06} height={16} color="#c8a858" intensity={0.12} />
      <RimStrip position={[0, 0.04, -8]} width={18} height={0.06} color="#7888b0" intensity={0.08} />
      <RimStrip position={[0, 0.04, 8]} width={18} height={0.06} color="#7888b0" intensity={0.08} />

      {/* ── Floor zone glow patches — subtle area light feel ── */}
      <FloorGlow position={[-5.2, 0.03, 0]} radius={1.8} color="#ff8040" opacity={0.04} />
      <FloorGlow position={[3, 0.03, 0]} radius={2.0} color="#d0a050" opacity={0.035} />
      <FloorGlow position={[5.5, 0.03, 0]} radius={2.2} color="#5070d0" opacity={0.03} />
      <FloorGlow position={[0, 0.03, 2.5]} radius={1.5} color="#60d0a0" opacity={0.03} />
    </>
  );
}

function VolumetricBeam({ position, color, intensity, width = 0.8 }: {
  position: [number, number, number];
  color: string;
  intensity: number;
  width?: number;
}) {
  const ref = useRef<THREE.Mesh>(null!);
  const shift = useStore(s => s.shiftMode);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const mat = ref.current.material as THREE.MeshBasicMaterial;
    const t = clock.getElapsedTime();
    const breathe = Math.sin(t * 0.6 + position[0]) * 0.25 + 0.75;
    const base = shift === 'night' ? intensity * 0.25 : intensity;
    mat.opacity = base * breathe;
  });

  return (
    <mesh ref={ref} position={[position[0], position[1] * 0.5, position[2]]}>
      <cylinderGeometry args={[0.04, width, position[1], 16, 1, true]} />
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

function FloorGlow({ position, radius, color, opacity }: {
  position: [number, number, number];
  radius: number;
  color: string;
  opacity: number;
}) {
  return (
    <mesh position={position} rotation={[-Math.PI * 0.5, 0, 0]}>
      <circleGeometry args={[radius, 24]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
