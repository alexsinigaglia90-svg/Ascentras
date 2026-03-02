import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../state/store';

const C = {
  mint: '#9ad7c8',
  teal: '#76bfb1',
  sand: '#e8d9c5',
  lavender: '#b8addf',
  coral: '#f1a28f',
  offWhite: '#f8f5ef',
  steelSoft: '#9aafbf',
  deep: '#6e86a1',
};

function FlowBoxes() {
  const running = useStore(s => s.conveyorRunning);
  const refs = useRef<THREE.Mesh[]>([]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    refs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const base = ((t * (running ? 0.55 : 0)) + i * 0.38) % 1;
      mesh.position.x = -3.8 + base * 7.6;
      mesh.position.y = 0.17 + Math.sin(t * 2 + i) * 0.01;
    });
  });

  return (
    <group>
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh
          key={`flow-${i}`}
          ref={(el: THREE.Mesh | null) => {
            if (el) refs.current[i] = el;
          }}
          position={[-3.8 + i, 0.17, 0]}
          castShadow
        >
          <boxGeometry args={[0.18, 0.14, 0.14]} />
          <meshStandardMaterial color={i % 2 === 0 ? C.coral : C.lavender} roughness={0.95} metalness={0.01} flatShading />
        </mesh>
      ))}
    </group>
  );
}

function AutoStoreBots() {
  const speed = useStore(s => s.autostoreSpeed);
  const emergency = useStore(s => s.emergencyStop);
  const refs = useRef<THREE.Group[]>([]);
  const ledRefs = useRef<THREE.Mesh[]>([]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const sf = emergency ? 0 : speed / 100;
    refs.current.forEach((bot, i) => {
      if (!bot) return;
      const px = 4.7 + Math.sin(t * 0.45 * sf + i) * 1.3;
      const pz = Math.sin(t * 0.37 * sf + i * 1.4) * 0.8;
      bot.position.set(px, 0.52, pz);
      bot.rotation.y = Math.sin(t * 0.2 + i) * 0.8;

      const led = ledRefs.current[i];
      if (led) {
        const mat = led.material as THREE.MeshStandardMaterial;
        const pulse = 0.4 + Math.sin(t * 4 + i) * 0.25;
        mat.emissiveIntensity = pulse;
      }
    });
  });

  return (
    <group>
      {Array.from({ length: 3 }).map((_, i) => (
        <group
          key={`as-bot-${i}`}
          ref={(el: THREE.Group | null) => {
            if (el) refs.current[i] = el;
          }}
          position={[4.7 + i * 0.5, 0.52, 0]}
        >
          <mesh castShadow>
            <capsuleGeometry args={[0.12, 0.14, 6, 12]} />
            <meshStandardMaterial color={C.deep} roughness={0.95} metalness={0.02} flatShading />
          </mesh>
          <mesh position={[0, 0.08, 0]}>
            <torusGeometry args={[0.1, 0.01, 8, 20]} />
            <meshStandardMaterial
              ref={(el: THREE.Mesh | null) => {
                if (el) ledRefs.current[i] = el;
              }}
              color={C.mint}
              emissive={C.mint}
              emissiveIntensity={0.5}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function StylizedMachines() {
  const depalRunning = useStore(s => s.depalletizerRunning);
  const depalFault = useStore(s => s.depalletizerFault);
  const heatmap = useStore(s => s.autostoreHeatmap);
  const palletizerRunning = useStore(s => s.palletizerRunning);
  const conveyorRunning = useStore(s => s.conveyorRunning);

  const bins = useMemo(() => {
    const items: [number, number, number, string][] = [];
    for (let x = 0; x < 8; x++) {
      for (let z = 0; z < 5; z++) {
        const color = heatmap
          ? x > 5
            ? '#f2a18d'
            : x > 3
            ? '#d6b8ef'
            : '#9fded1'
          : (x + z) % 2 === 0
          ? '#a9c4d8'
          : '#b8addf';
        items.push([4.2 + x * 0.32, 0.16, -0.7 + z * 0.32, color]);
      }
    }
    return items;
  }, [heatmap]);

  return (
    <group>
      <group position={[-5.2, 0, -1.2]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.24, 0.28, 0.28, 8]} />
          <meshStandardMaterial color={depalFault ? C.coral : C.lavender} roughness={0.95} metalness={0.02} flatShading />
        </mesh>
        <mesh position={[0.34, 0.28, 0]} castShadow rotation={[0, 0, depalRunning ? -0.4 : -0.1]}>
          <capsuleGeometry args={[0.08, 0.45, 6, 12]} />
          <meshStandardMaterial color={C.mint} roughness={0.95} metalness={0.02} flatShading />
        </mesh>
        <mesh position={[0.65, 0.45, 0]} castShadow>
          <boxGeometry args={[0.16, 0.08, 0.14]} />
          <meshStandardMaterial color={C.sand} roughness={0.95} metalness={0.02} flatShading />
        </mesh>
      </group>

      <group>
        <mesh position={[0, 0.12, 0]} castShadow>
          <boxGeometry args={[8.2, 0.12, 0.72]} />
          <meshStandardMaterial color={conveyorRunning ? C.teal : '#b7c7cf'} roughness={0.97} metalness={0.01} flatShading />
        </mesh>
        <FlowBoxes />
      </group>

      <group position={[3.1, 0, 0]}>
        <mesh position={[0, 0.32, 0.8]} castShadow>
          <boxGeometry args={[1.3, 0.09, 0.6]} />
          <meshStandardMaterial color={C.sand} roughness={0.96} metalness={0.01} flatShading />
        </mesh>
        <mesh position={[0, 0.32, -0.8]} castShadow>
          <boxGeometry args={[1.3, 0.09, 0.6]} />
          <meshStandardMaterial color={C.sand} roughness={0.96} metalness={0.01} flatShading />
        </mesh>
      </group>

      <group>
        <mesh position={[5.4, 0.5, 0]} castShadow>
          <boxGeometry args={[3.2, 1, 2.1]} />
          <meshStandardMaterial color={C.offWhite} roughness={0.98} metalness={0.01} flatShading />
        </mesh>
        {bins.map(([x, y, z, color], i) => (
          <mesh key={`bin-${i}`} position={[x, y, z]} castShadow>
            <boxGeometry args={[0.23, 0.2, 0.23]} />
            <meshStandardMaterial color={color} roughness={0.96} metalness={0.01} flatShading />
          </mesh>
        ))}
        <AutoStoreBots />
      </group>

      <group position={[6.2, 0, 2.4]}>
        <mesh position={[0, 0.45, 0]} castShadow>
          <boxGeometry args={[1.4, 0.9, 1.1]} />
          <meshStandardMaterial color={C.lavender} roughness={0.95} metalness={0.01} flatShading />
        </mesh>
        <mesh position={[0.35, 0.95, 0]} castShadow>
          <boxGeometry args={[0.28, 0.1, 0.28]} />
          <meshStandardMaterial color={palletizerRunning ? C.mint : '#c5d5dc'} roughness={0.95} metalness={0.01} flatShading />
        </mesh>
      </group>
    </group>
  );
}