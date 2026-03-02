import { ContactShadows } from '@react-three/drei';
import { useStore } from '../state/store';

export function LightingSetup() {
  const shift = useStore(s => s.shiftMode);
  const emergency = useStore(s => s.emergencyStop);
  const performanceMode = useStore(s => s.performanceMode);

  const day = shift === 'day' && !emergency;

  return (
    <>
      <hemisphereLight
        intensity={day ? 0.72 : 0.45}
        color={day ? '#e9f6ff' : '#7f8fb0'}
        groundColor={day ? '#f4e8d7' : '#2f3548'}
      />

      <ambientLight intensity={day ? 0.32 : 0.2} color={day ? '#f8f3ea' : '#b8c3e0'} />

      <directionalLight
        position={[6, 8, 4]}
        intensity={day ? 1.05 : 0.6}
        color={day ? '#fff1dc' : '#c7d7ff'}
        castShadow={!performanceMode}
        shadow-mapSize-width={performanceMode ? 512 : 1024}
        shadow-mapSize-height={performanceMode ? 512 : 1024}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-camera-far={28}
      />

      <directionalLight
        position={[-7, 5, -3]}
        intensity={day ? 0.46 : 0.3}
        color={day ? '#d6fff5' : '#9bb2e2'}
      />

      {!performanceMode && (
        <ContactShadows
          position={[0, 0.001, 0]}
          opacity={0.24}
          blur={2.1}
          scale={20}
          far={5}
          color="#74879f"
        />
      )}
    </>
  );
}