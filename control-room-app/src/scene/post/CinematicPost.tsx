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
 * Stylized post-processing.
 *
 * - Subtle AO only for soft grounding
 * - Bloom only on bright emissive accents
 * - Gentle vignette
 */
export function CinematicPost() {
  const performanceMode = useStore(s => s.performanceMode);
  const aoColor = useMemo(() => new THREE.Color('#98a8bf'), []);

  if (performanceMode) return null;

  return (
    <EffectComposer multisampling={2}>
      {/* Ambient Occlusion — light and clean */}
      <N8AO
        aoRadius={0.28}
        intensity={0.45}
        distanceFalloff={0.7}
        quality="medium"
        halfRes
        color={aoColor}
      />

      {/* Bloom — only emissive elements should cross this threshold */}
      <Bloom
        intensity={0.32}
        luminanceThreshold={0.82}
        luminanceSmoothing={0.2}
        mipmapBlur
        radius={0.55}
      />

      {/* Vignette — very soft */}
      <Vignette
        offset={0.26}
        darkness={0.15}
        blendFunction={BlendFunction.NORMAL}
      />

      {/* Tone mapping — ACES filmic for rich, cinematic colour response */}
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}
