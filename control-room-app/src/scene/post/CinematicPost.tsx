import { useMemo } from 'react';
import * as THREE from 'three';
import {
  EffectComposer,
  Bloom,
  Vignette,
  N8AO,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { useStore } from '../../state/store';

/**
 * Cinematic post-processing — crisp and clean.
 *
 * REMOVED the "glass view" caused by:
 *   - DepthOfField (bokehScale was 2.5 — blurred the whole scene)
 *   - ChromaticAberration (added color fringing like a glass pane)
 *   - N8AO too aggressive (was 1.8 — muddied the image)
 *
 * Now: subtle AO for contact shadows, restrained bloom
 * for emissive glow, clean vignette for framing.
 * Entirely disabled in Performance Mode.
 */
export function CinematicPost() {
  const performanceMode = useStore(s => s.performanceMode);
  const aoColor = useMemo(() => new THREE.Color('#1a1820'), []);

  if (performanceMode) return null;

  return (
    <EffectComposer multisampling={4}>
      {/* Ambient Occlusion — tighter radius for detailed machine geometry */}
      <N8AO
        aoRadius={0.35}
        intensity={1.1}
        distanceFalloff={0.7}
        quality="medium"
        halfRes={false}
        color={aoColor}
      />

      {/* Bloom — slightly stronger for LEDs, beacons, screen emissives */}
      <Bloom
        intensity={0.3}
        luminanceThreshold={0.65}
        luminanceSmoothing={0.25}
        mipmapBlur
        radius={0.6}
      />

      {/* Vignette — subtle frame, not overpowering */}
      <Vignette
        offset={0.3}
        darkness={0.3}
        blendFunction={BlendFunction.NORMAL}
      />

      {/* NO DepthOfField — was causing the hazy glass look */}
      {/* NO ChromaticAberration — was causing color fringing */}
    </EffectComposer>
  );
}
