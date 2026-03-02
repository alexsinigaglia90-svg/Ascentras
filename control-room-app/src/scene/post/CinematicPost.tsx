import { useMemo } from 'react';
import * as THREE from 'three';
import {
  EffectComposer,
  Bloom,
  Vignette,
  N8AO,
  ToneMapping,
  SMAA,
  Noise,
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
  const cinematic = quality === 'cinematic';

  if (performanceMode || safe) return null;

  return (
    <EffectComposer multisampling={balanced ? 0 : 4}>
      {balanced && <SMAA />}

      {/* Ambient Occlusion — high quality, tighter for mechanical detail */}
      {!balanced && (
        <N8AO
          aoRadius={cinematic ? 0.42 : 0.34}
          intensity={cinematic ? 1.65 : 0.95}
          distanceFalloff={cinematic ? 0.6 : 0.72}
          quality="high"
          halfRes={!cinematic}
          color={aoColor}
        />
      )}

      {/* Bloom — luminous glow for LEDs, status lights, emissive elements */}
      <Bloom
        intensity={balanced ? 0.34 : cinematic ? 0.62 : 0.42}
        luminanceThreshold={balanced ? 0.6 : cinematic ? 0.4 : 0.52}
        luminanceSmoothing={balanced ? 0.2 : cinematic ? 0.12 : 0.18}
        mipmapBlur
        radius={balanced ? 0.62 : cinematic ? 0.84 : 0.68}
      />

      {/* Vignette — subtle framing, lighter for premium feel */}
      <Vignette
        offset={cinematic ? 0.28 : 0.3}
        darkness={balanced ? 0.14 : cinematic ? 0.24 : 0.18}
        blendFunction={BlendFunction.NORMAL}
      />

      <Noise opacity={balanced ? 0.03 : 0.04} premultiply blendFunction={BlendFunction.SOFT_LIGHT} />

      {/* Tone mapping — ACES filmic for rich, cinematic colour response */}
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}
