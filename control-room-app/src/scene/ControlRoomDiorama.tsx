import { useRef, useEffect, lazy, Suspense, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../state/store';
import { WarehouseEnvironment } from './WarehouseEnvironment';
import { ControlDesk } from './ControlDesk';
import { CinematicLighting } from './lighting/CinematicLighting';
import { CinematicPost } from './post/CinematicPost';

type QualityTier = 'safe' | 'balanced' | 'cinematic' | 'ultra';

const wait = (ms: number) => new Promise<void>(resolve => window.setTimeout(resolve, ms));

/* Lazy-load heavy machine rigs — they are complex geometry builders */
const loadAutoStoreRig = () => import('./machines/AutoStoreRig');
const loadConveyorRig = () => import('./machines/ConveyorRig');
const loadDepalletizerRig = () => import('./machines/DepalletizerRig');
const loadPalletizerRig = () => import('./machines/PalletizerRig');
const loadDecantingStations = () => import('./machines/DecantingStations');
const loadAMRFleet = () => import('./machines/AMRFleet');
const loadIndustrialDetails = () => import('./props/IndustrialDetails');
const loadDustParticles = () => import('./DustParticles');

const preloadSceneAssets = () =>
  Promise.all([
    loadAutoStoreRig(),
    loadConveyorRig(),
    loadDepalletizerRig(),
    loadPalletizerRig(),
    loadDecantingStations(),
    loadAMRFleet(),
    loadIndustrialDetails(),
    loadDustParticles(),
  ]);

const AutoStoreRig = lazy(() => loadAutoStoreRig().then(m => ({ default: m.AutoStoreRig })));
const ConveyorRig = lazy(() => loadConveyorRig().then(m => ({ default: m.ConveyorRig })));
const DepalletizerRig = lazy(() => loadDepalletizerRig().then(m => ({ default: m.DepalletizerRig })));
const PalletizerRig = lazy(() => loadPalletizerRig().then(m => ({ default: m.PalletizerRig })));
const DecantingStations = lazy(() => loadDecantingStations().then(m => ({ default: m.DecantingStations })));
const AMRFleet = lazy(() => loadAMRFleet().then(m => ({ default: m.AMRFleet })));
const IndustrialDetails = lazy(() => loadIndustrialDetails().then(m => ({ default: m.IndustrialDetails })));
const DustParticles = lazy(() => loadDustParticles().then(m => ({ default: m.DustParticles })));

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

function PerformanceBudgetGuard({
  enabled,
  targetFrameMs,
  onPenaltyIncrease,
  onPenaltyDecrease,
}: {
  enabled: boolean;
  targetFrameMs: number;
  onPenaltyIncrease: () => void;
  onPenaltyDecrease: () => void;
}) {
  const emaFrameMs = useRef(16.7);
  const overBudgetSeconds = useRef(0);
  const underBudgetSeconds = useRef(0);

  useFrame((_, delta) => {
    const frameMs = Math.max(1, delta * 1000);
    emaFrameMs.current += (frameMs - emaFrameMs.current) * 0.08;

    if (!enabled) {
      overBudgetSeconds.current = 0;
      underBudgetSeconds.current = 0;
      return;
    }

    const overThreshold = targetFrameMs + 4;
    const underThreshold = Math.max(8, targetFrameMs - 4);
    const overBudget = emaFrameMs.current > overThreshold;
    const underBudget = emaFrameMs.current < underThreshold;

    if (overBudget) {
      overBudgetSeconds.current += delta;
    } else {
      overBudgetSeconds.current = Math.max(0, overBudgetSeconds.current - delta * 0.6);
    }

    if (underBudget) {
      underBudgetSeconds.current += delta;
    } else {
      underBudgetSeconds.current = Math.max(0, underBudgetSeconds.current - delta * 0.7);
    }

    if (overBudgetSeconds.current >= 2.2) {
      overBudgetSeconds.current = 0;
      underBudgetSeconds.current = 0;
      onPenaltyIncrease();
    }

    if (underBudgetSeconds.current >= 5.2) {
      underBudgetSeconds.current = 0;
      overBudgetSeconds.current = 0;
      onPenaltyDecrease();
    }
  });

  return null;
}

function downgradeQuality(base: QualityTier, penalty: 0 | 1 | 2): QualityTier {
  if (penalty === 0) return base;
  if (penalty === 1) {
    if (base === 'ultra') return 'cinematic';
    if (base === 'cinematic') return 'balanced';
    if (base === 'balanced') return 'safe';
    return 'safe';
  }

  if (base === 'ultra') return 'balanced';
  if (base === 'cinematic') return 'safe';
  return 'safe';
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

function SceneBootOverlay({ stage }: { stage: 'initial' | 'ultra' }) {
  const label = stage === 'ultra' ? 'Ultra mode initialising' : 'Initialising control room';

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at center, rgba(16,22,34,0.76), rgba(9,13,22,0.9))',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div style={{ width: 260, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
        <div style={{ fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(216,227,242,0.9)' }}>
          {label}
        </div>
        <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.14)', borderRadius: 999, overflow: 'hidden' }}>
          <div
            style={{
              width: '42%',
              height: '100%',
              borderRadius: 999,
              background: 'linear-gradient(90deg, rgba(107,173,107,0.4), rgba(151,217,255,0.9), rgba(107,173,107,0.4))',
              animation: 'sceneBootSweep 1.25s ease-in-out infinite',
            }}
          />
        </div>
        <div style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              style={{
                height: 4,
                borderRadius: 999,
                background: 'rgba(138,180,220,0.6)',
                transformOrigin: 'left',
                animation: `sceneBootPulse 0.9s ease-in-out ${idx * 0.08}s infinite`,
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes sceneBootSweep {
          0% { transform: translateX(-120%); opacity: 0.3; }
          45% { opacity: 1; }
          100% { transform: translateX(270%); opacity: 0.3; }
        }
        @keyframes sceneBootPulse {
          0%, 100% { transform: scaleX(0.45); opacity: 0.35; }
          50% { transform: scaleX(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
 *  ControlRoomDiorama – main Canvas with cinematic
 *  renderer, pushed-back fog, clean scene composition.
 *  ══════════════════════════════════════════════════════ */
export function ControlRoomDiorama({ active = true }: { active?: boolean }) {
  const performanceMode = useStore(s => s.performanceMode);
  const ultraVisualMode = useStore(s => s.ultraVisualMode);
  const shift = useStore(s => s.shiftMode);
  const [adaptivePerf, setAdaptivePerf] = useState(false);
  const [dynamicPenalty, setDynamicPenalty] = useState<0 | 1 | 2>(0);
  const [sceneReady, setSceneReady] = useState(false);
  const [ultraWarmup, setUltraWarmup] = useState(false);
  const glRef = useRef<THREE.WebGLRenderer | null>(null);
  const invalidateRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const nav = navigator as Navigator & { deviceMemory?: number };
    const lowCore = typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency <= 4;
    const lowMemory = typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 4;
    const preferReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
    setAdaptivePerf(lowCore || lowMemory || preferReducedMotion);
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      await Promise.all([preloadSceneAssets(), wait(4200)]);
      if (!cancelled) setSceneReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!active || performanceMode || adaptivePerf) {
      setDynamicPenalty(0);
    }
  }, [active, performanceMode, adaptivePerf]);

  useEffect(() => {
    let cancelled = false;

    if (!ultraVisualMode) {
      setUltraWarmup(false);
      return;
    }

    setDynamicPenalty(0);
    setUltraWarmup(true);

    (async () => {
      await Promise.all([preloadSceneAssets(), wait(6500)]);
      if (!cancelled) setUltraWarmup(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [ultraVisualMode]);

  useEffect(() => {
    const gl = glRef.current;
    const invalidate = invalidateRef.current;
    if (!gl || !invalidate) return;

    if (!active) {
      gl.setAnimationLoop(null);
      return;
    }

    gl.setAnimationLoop(() => {
      invalidate();
    });

    return () => {
      gl.setAnimationLoop(null);
    };
  }, [active]);

  const baseQuality = useMemo<QualityTier>(() => {
    if (performanceMode || adaptivePerf) return 'safe';
    if (ultraVisualMode) return 'ultra';
    return shift === 'night' ? 'balanced' : 'cinematic';
  }, [performanceMode, adaptivePerf, ultraVisualMode, shift]);

  const quality = useMemo<QualityTier>(
    () => downgradeQuality(baseQuality, dynamicPenalty),
    [baseQuality, dynamicPenalty],
  );

  const effectivePerformance = quality === 'safe';
  const detailLevel = quality === 'safe' ? 0 : quality === 'balanced' ? 1 : quality === 'cinematic' ? 2 : 3;
  const targetFrameMs = quality === 'ultra' ? 16.8 : quality === 'cinematic' ? 20 : quality === 'balanced' ? 24 : 28;
  const lockAdaptiveDowngrade = ultraVisualMode;
  const dprSetting: 1 | [number, number] = quality === 'safe' ? 1 : quality === 'balanced' ? [1, 1.25] : quality === 'ultra' ? [1.25, 2] : [1, 1.5];
  const shadowEnabled = !effectivePerformance;
  const antialiasEnabled = !effectivePerformance;
  const exposure = shift === 'night'
    ? (quality === 'safe' ? 0.8 : quality === 'balanced' ? 0.92 : quality === 'ultra' ? 1.08 : 1.04)
    : quality === 'ultra' ? 1.7 : quality === 'cinematic' ? 1.62 : 1.4;

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
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
        glRef.current = gl;
        invalidateRef.current = invalidate;
        if (active) {
          gl.setAnimationLoop(() => {
            invalidate();
          });
        }
      }}
    >
      <color attach="background" args={[shift === 'night' ? '#131824' : '#dbe2ea']} />
      <fog attach="fog" args={[shift === 'night' ? '#171f31' : '#cfd6df', quality === 'ultra' ? 22 : quality === 'cinematic' ? 20 : 22, quality === 'ultra' ? 70 : quality === 'cinematic' ? 62 : 50]} />

      <CameraController />
      {active && <SimTicker />}
      <PerformanceBudgetGuard
        enabled={active && !performanceMode && !adaptivePerf && !lockAdaptiveDowngrade}
        targetFrameMs={targetFrameMs}
        onPenaltyIncrease={() => setDynamicPenalty(p => (p < 2 ? ((p + 1) as 0 | 1 | 2) : p))}
        onPenaltyDecrease={() => setDynamicPenalty(p => (p > 0 ? ((p - 1) as 0 | 1 | 2) : p))}
      />

      {/* Lighting */}
      <CinematicLighting performanceOverride={effectivePerformance} quality={quality} />

      {/* Environment shell */}
      <WarehouseEnvironment detailLevel={detailLevel} />

      {/* Operator station */}
      <ControlDesk />

      {/* Machines — lazy-loaded for faster initial paint */}
      {sceneReady ? (
        <Suspense fallback={<SceneLoadingFallback />}>
          <DepalletizerRig />
          <ConveyorRig />
          <DecantingStations />
          <AutoStoreRig />
          <PalletizerRig />
          <AMRFleet detailLevel={detailLevel} />
          <IndustrialDetails detailLevel={detailLevel} />
          {detailLevel >= 2 && <DustParticles />}
        </Suspense>
      ) : (
        <SceneLoadingFallback />
      )}

      {/* Postprocessing – NO DOF, NO ChromaticAberration */}
      {active && <CinematicPost quality={quality} />}
      </Canvas>

      {!sceneReady && <SceneBootOverlay stage="initial" />}
      {sceneReady && ultraWarmup && <SceneBootOverlay stage="ultra" />}
    </div>
  );
}
