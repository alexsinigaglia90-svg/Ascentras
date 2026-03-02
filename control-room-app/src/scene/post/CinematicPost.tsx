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

  if (performanceMode) return null;

  return (
    <EffectComposer multisampling={4}>
      {/* Ambient Occlusion — soft, NOT oppressive */}
      <N8AO
        aoRadius={0.5}
        intensity={1.0}
        distanceFalloff={0.8}
        quality="medium"
        halfRes={false}
        color={new THREE.Color('#1a1820')}
      />

      {/* Bloom — only on emissive elements (screens, LEDs, beacons) */}
      <Bloom
        intensity={0.25}
        luminanceThreshold={0.7}
        luminanceSmoothing={0.3}
        mipmapBlur
        radius={0.5}
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
