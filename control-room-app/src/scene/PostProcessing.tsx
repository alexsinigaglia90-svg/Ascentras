import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  EffectComposer,
  Bloom,
  DepthOfField,
  Vignette,
  N8AO,
  ChromaticAberration,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { useStore } from '../state/store';

/**
 * Cinematic post-processing pipeline.
 * Disabled entirely in Performance Mode.
 */
export function PostProcessing() {
  const performanceMode = useStore(s => s.performanceMode);
  const emergency = useStore(s => s.emergencyStop);

  if (performanceMode) return null;

  return (
    <EffectComposer multisampling={4}>
      {/* Ambient Occlusion — soft contact shadows */}
      <N8AO
        aoRadius={0.8}
        intensity={1.8}
        distanceFalloff={0.6}
        quality="medium"
        halfRes={false}
        color={new THREE.Color('#1a1820')}
      />

      {/* Bloom — subtle glow on emissives & highlights */}
      <Bloom
        intensity={0.35}
        luminanceThreshold={0.6}
        luminanceSmoothing={0.4}
        mipmapBlur
        radius={0.7}
      />

      {/* Depth of Field — cinematic focus */}
      <DepthOfField
        focusDistance={0.02}
        focalLength={0.06}
        bokehScale={2.5}
      />

      {/* Subtle chromatic aberration for lens feel */}
      <ChromaticAberration
        blendFunction={BlendFunction.NORMAL}
        offset={new THREE.Vector2(0.0004, 0.0004)}
        radialModulation={true}
        modulationOffset={0.2}
      />

      {/* Vignette — darkened edges for focus */}
      <Vignette
        offset={0.25}
        darkness={0.45}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
}
