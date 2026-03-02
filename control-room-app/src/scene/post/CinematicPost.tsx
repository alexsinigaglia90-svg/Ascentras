import { useMemo } from 'react';
import * as THREE from 'three';
import {
  EffectComposer,
  Bloom,
  Vignette,
  N8AO,
  ToneMapping,
} from '@react-three/postprocessing';
import { BlendFunction, ToneMappingMode } from 'postprocessing';
import { useStore } from '../../state/store';

/**
 * Enhanced cinematic post-processing — deep, rich, ray-tracing quality.
 *
 * - N8AO at high quality for detailed contact shadows
 * - Two-pass bloom: subtle global + strong emissive punch
 * - Vignette for cinematic framing
 * - ACES Filmic tone mapping for cinematic colour
 */
export function CinematicPost({ quality = 'cinematic' }: { quality?: 'safe' | 'balanced' | 'cinematic' }) {
  const performanceMode = useStore(s => s.performanceMode);
  const aoColor = useMemo(() => new THREE.Color('#0a0810'), []);
  const safe = quality === 'safe';
  const balanced = quality === 'balanced';

  if (performanceMode || safe) return null;

  return (
    <EffectComposer multisampling={balanced ? 0 : 4}>
      {/* Ambient Occlusion — high quality, tighter for mechanical detail */}
      {!balanced && (
        <N8AO
          aoRadius={0.4}
          intensity={1.6}
          distanceFalloff={0.6}
          quality="high"
          halfRes={false}
          color={aoColor}
        />
      )}

      {/* Bloom — luminous glow for LEDs, status lights, emissive elements */}
      <Bloom
        intensity={balanced ? 0.28 : 0.55}
        luminanceThreshold={balanced ? 0.62 : 0.45}
        luminanceSmoothing={balanced ? 0.2 : 0.15}
        mipmapBlur
        radius={balanced ? 0.55 : 0.8}
      />

      {/* Vignette — subtle framing, lighter for premium feel */}
      <Vignette
        offset={0.3}
        darkness={balanced ? 0.16 : 0.25}
        blendFunction={BlendFunction.NORMAL}
      />

      {/* Tone mapping — ACES filmic for rich, cinematic colour response */}
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}
