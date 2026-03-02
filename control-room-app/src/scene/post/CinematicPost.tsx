import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { useStore } from '../../state/store';

/**
 * Safe post-processing.
 *
 * - Bloom only (no AO/vignette/tone mapping) to minimize GPU compatibility issues.
 */
export function CinematicPost() {
  const performanceMode = useStore(s => s.performanceMode);

  if (performanceMode) return null;

  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={0.22}
        luminanceThreshold={0.88}
        luminanceSmoothing={0.18}
        mipmapBlur
        radius={0.45}
      />
    </EffectComposer>
  );
}
