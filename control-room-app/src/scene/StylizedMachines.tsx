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
  sky: '#cfe3f5',
};

function DepalletizerZone() {
  const running = useStore(s => s.depalletizerRunning);
  const speed = useStore(s => s.depalletizerSpeed);
  const fault = useStore(s => s.depalletizerFault);
  const boxesRemaining = useStore(s => s.palletBoxesRemaining);

  const armRef = useRef<THREE.Group>(null!);
  const wristRef = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const sf = running && !fault ? speed / 100 : 0.08;

    if (armRef.current) {
      armRef.current.rotation.y = -0.8 + Math.sin(t * 0.9 * sf) * 0.45;
      armRef.current.rotation.z = -0.18 + Math.sin(t * 1.2 * sf) * 0.12;
    }
    if (wristRef.current) {
      wristRef.current.rotation.z = Math.sin(t * 2.2 * sf) * 0.4;
    }
  });

  return (
    <group position={[-5.2, 0, -1.2]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.26, 0.3, 0.3, 8]} />
        <meshStandardMaterial color={fault ? C.coral : C.lavender} roughness={0.95} metalness={0.02} flatShading />
      </mesh>

      <group ref={armRef} position={[0.02, 0.26, 0]}>
        <mesh position={[0.32, 0.08, 0]} castShadow>
          <capsuleGeometry args={[0.08, 0.45, 6, 12]} />
          <meshStandardMaterial color={C.mint} roughness={0.95} metalness={0.02} flatShading />
        </mesh>
        <mesh ref={wristRef} position={[0.62, 0.24, 0]} castShadow>
          <boxGeometry args={[0.16, 0.08, 0.16]} />
          <meshStandardMaterial color={C.sand} roughness={0.95} metalness={0.02} flatShading />
        </mesh>
      </group>

      <mesh position={[-0.8, 0.08, -0.2]} castShadow>
        <boxGeometry args={[0.7, 0.12, 0.52]} />
        <meshStandardMaterial color={C.sand} roughness={0.96} metalness={0.02} flatShading />
      </mesh>
      {Array.from({ length: Math.ceil(boxesRemaining / 3) }).map((_, i) => (
        <mesh key={`depal-stack-${i}`} position={[-0.8, 0.18 + i * 0.1, -0.2]} castShadow>
          <boxGeometry args={[0.62 - i * 0.02, 0.08, 0.46 - i * 0.02]} />
          <meshStandardMaterial color={i % 2 ? '#d9bceb' : '#a5d9cb'} roughness={0.95} metalness={0.01} flatShading />
        </mesh>
      ))}

      <mesh position={[0.2, 0.11, 0.45]}>
        <sphereGeometry args={[0.05, 10, 10]} />
        <meshStandardMaterial
          color={fault ? C.coral : C.mint}
          emissive={fault ? C.coral : C.mint}
          emissiveIntensity={fault ? 0.55 : 0.3}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function FlowBoxes() {
  const running = useStore(s => s.conveyorRunning);
  const jam = useStore(s => s.conveyorJam);
  const refs = useRef<THREE.Mesh[]>([]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    refs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const speed = running && !jam ? 0.52 : 0.02;
      const base = ((t * speed) + i * 0.39) % 1;
      mesh.position.x = -3.8 + base * 7.6;
      mesh.position.y = 0.18 + Math.sin(t * 2 + i) * 0.01;
    });
  });

  return (
    <group>
      {Array.from({ length: 9 }).map((_, i) => (
        <mesh
          key={`flow-${i}`}
          ref={(el: THREE.Mesh | null) => {
            if (el) refs.current[i] = el;
          }}
          position={[-3.8 + i * 0.7, 0.18, 0]}
          castShadow
        >
          <boxGeometry args={[0.2, 0.14, 0.14]} />
          <meshStandardMaterial color={i % 3 === 0 ? C.coral : i % 3 === 1 ? C.lavender : C.mint} roughness={0.95} metalness={0.01} flatShading />
        </mesh>
      ))}
    </group>
  );
}

function ConveyorZone() {
  const running = useStore(s => s.conveyorRunning);
  const jam = useStore(s => s.conveyorJam);

  return (
    <group>
      <mesh position={[0, 0.12, 0]} castShadow>
        <boxGeometry args={[8.4, 0.12, 0.8]} />
        <meshStandardMaterial color={running ? C.teal : '#b7c7cf'} roughness={0.97} metalness={0.01} flatShading />
      </mesh>

      <mesh position={[2.8, 0.18, 0]}>
        <boxGeometry args={[0.18, 0.22, 0.82]} />
        <meshStandardMaterial color={jam ? C.coral : C.sky} roughness={0.96} metalness={0.01} flatShading />
      </mesh>

      <mesh position={[3.5, 0.12, 1.9]} castShadow>
        <boxGeometry args={[3.4, 0.1, 0.92]} />
        <meshStandardMaterial color={C.mint} roughness={0.96} metalness={0.01} flatShading />
      </mesh>

      <FlowBoxes />
    </group>
  );
}

function AutoStoreBots() {
  const speed = useStore(s => s.autostoreSpeed);
  const emergency = useStore(s => s.emergencyStop);
  const refs = useRef<THREE.Group[]>([]);
  const ledRefs = useRef<THREE.MeshStandardMaterial[]>([]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const sf = emergency ? 0 : speed / 100;
    refs.current.forEach((bot, i) => {
      if (!bot) return;
      const px = 4.7 + Math.sin(t * 0.45 * sf + i) * 1.28;
      const pz = Math.sin(t * 0.37 * sf + i * 1.3) * 0.78;
      bot.position.set(px, 0.54, pz);
      bot.rotation.y = Math.atan2(Math.cos(t * 0.45 * sf + i), Math.cos(t * 0.37 * sf + i * 1.3));

      const led = ledRefs.current[i];
      if (led) {
        led.emissiveIntensity = emergency ? 0.2 : 0.45 + Math.sin(t * 4 + i) * 0.2;
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
          position={[4.7 + i * 0.5, 0.54, 0]}
        >
          <mesh castShadow>
            <capsuleGeometry args={[0.12, 0.14, 6, 12]} />
            <meshStandardMaterial color={C.deep} roughness={0.95} metalness={0.02} flatShading />
          </mesh>
          <mesh position={[0, 0.08, 0]}>
            <torusGeometry args={[0.1, 0.01, 8, 20]} />
            <meshStandardMaterial
              ref={(el: THREE.MeshStandardMaterial | null) => {
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

function AutoStoreZone() {
  const heatmap = useStore(s => s.autostoreHeatmap);
  const density = useStore(s => s.autostoreBinDensity);

  const bins = useMemo(() => {
    const items: [number, number, number, string][] = [];
    let idx = 0;
    for (let x = 0; x < 8; x++) {
      for (let z = 0; z < 5; z++) {
        const visible = (idx / 40) * 100 < density;
        if (!visible) {
          idx++;
          continue;
        }
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
        idx++;
      }
    }
    return items;
  }, [heatmap, density]);

  return (
    <group>
      <mesh position={[5.4, 0.5, 0]} castShadow>
        <boxGeometry args={[3.2, 1, 2.1]} />
        <meshStandardMaterial color={C.offWhite} roughness={0.98} metalness={0.01} flatShading />
      </mesh>

      {Array.from({ length: 9 }).map((_, i) => (
        <mesh key={`grid-x-${i}`} position={[4.08 + i * 0.32, 0.5, 0]}>
          <boxGeometry args={[0.02, 1.02, 2.12]} />
          <meshStandardMaterial color="#dbe7f1" roughness={0.97} metalness={0.01} flatShading />
        </mesh>
      ))}

      <mesh position={[3.85, 0.24, -1.2]} castShadow>
        <boxGeometry args={[0.44, 0.2, 0.5]} />
        <meshStandardMaterial color={C.sand} roughness={0.96} metalness={0.01} flatShading />
      </mesh>
      <mesh position={[6.95, 0.24, 1.2]} castShadow>
        <boxGeometry args={[0.44, 0.2, 0.5]} />
        <meshStandardMaterial color={C.sand} roughness={0.96} metalness={0.01} flatShading />
      </mesh>

      {bins.map(([x, y, z, color], i) => (
        <mesh key={`bin-${i}`} position={[x, y, z]} castShadow>
          <boxGeometry args={[0.23, 0.2, 0.23]} />
          <meshStandardMaterial color={color} roughness={0.96} metalness={0.01} flatShading />
        </mesh>
      ))}

      <AutoStoreBots />
    </group>
  );
}

function PalletizerZone() {
  const running = useStore(s => s.palletizerRunning);
  const rate = useStore(s => s.palletizerOutputRate);
  const pattern = useStore(s => s.palletizerPattern);
  const headRef = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    if (!headRef.current) return;
    const t = clock.getElapsedTime();
    const sf = running ? Math.max(0.4, rate / 100) : 0.15;
    headRef.current.position.x = 0.36 + Math.sin(t * 0.8 * sf) * 0.36;
    headRef.current.position.y = 0.95 + Math.sin(t * 1.1 * sf) * 0.12;
  });

  const stackCount = running ? Math.max(2, Math.round(rate / 16)) : 2;

  return (
    <group position={[6.2, 0, 2.4]}>
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[1.5, 0.92, 1.2]} />
        <meshStandardMaterial color={C.lavender} roughness={0.95} metalness={0.01} flatShading />
      </mesh>

      <mesh position={[0.35, 0.95, 0]} castShadow>
        <boxGeometry args={[0.9, 0.1, 0.32]} />
        <meshStandardMaterial color={running ? C.mint : '#c5d5dc'} roughness={0.95} metalness={0.01} flatShading />
      </mesh>

      <mesh ref={headRef} position={[0.35, 0.95, 0]} castShadow>
        <boxGeometry args={[0.24, 0.1, 0.24]} />
        <meshStandardMaterial color={C.sand} roughness={0.95} metalness={0.01} flatShading />
      </mesh>

      {Array.from({ length: stackCount }).map((_, i) => (
        <mesh key={`pal-stack-${i}`} position={[-0.28 + (pattern === 'A' ? 0 : 0.08), 0.1 + i * 0.09, 0]} castShadow>
          <boxGeometry args={[0.42 - i * 0.01, 0.08, 0.42 - i * 0.01]} />
          <meshStandardMaterial color={i % 2 === 0 ? '#a8ddd0' : '#d7bceb'} roughness={0.96} metalness={0.01} flatShading />
        </mesh>
      ))}
    </group>
  );
}

export function StylizedMachines() {
  return (
    <group>
      <DepalletizerZone />
      <ConveyorZone />
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
      <AutoStoreZone />
      <PalletizerZone />
    </group>
  );
}