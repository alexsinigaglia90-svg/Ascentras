import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../state/store';
import {
  type AABB,
  type CollisionAgent,
  blockedByAgents,
  blockedByStatic,
  createAABB,
  snapToGrid,
  waypointDetour,
} from '../CollisionSystem';

const GRID = 0.2;
const BASE_SPEED = 0.82;
const HALF_SIZE = 0.24;
const ARRIVAL_EPS = 0.1;

const PATROL_PATHS: [number, number, number][][] = [
  [[-8, 0.01, -3], [-6, 0.01, -3], [-6, 0.01, -1.4], [-5.5, 0.01, -1.4], [-6.2, 0.01, -3]],
  [[-8, 0.01, 3], [-4, 0.01, 3], [0, 0.01, 3.5], [4, 0.01, 3], [7.4, 0.01, 1.2], [7, 0.01, -2], [4, 0.01, -3], [-2, 0.01, -3], [-8, 0.01, -2]],
  [[8, 0.01, -3], [5, 0.01, -3], [2, 0.01, -2.5], [-1, 0.01, -3], [-4, 0.01, -2], [-4, 0.01, 1], [0, 0.01, 2], [4, 0.01, 1.5], [8, 0.01, 0]],
];

const STATIC_OBSTACLES: AABB[] = [
  createAABB(-5.15, -1.2, 0.86),
  createAABB(-4.3, -1.4, 0.56),
  createAABB(-1.0, 0.0, 0.58),
  createAABB(3.0, 1.6, 0.78),
  createAABB(3.0, -1.6, 0.78),
  createAABB(5.5, 0.0, 1.25),
  createAABB(6.0, 2.5, 1.16),
  createAABB(7.2, 1.9, 0.62),
];

interface VehicleRuntime {
  x: number;
  y: number;
  z: number;
  rotY: number;
  waiting: boolean;
  moving: boolean;
}

interface VehicleState {
  id: number;
  path: THREE.Vector3[];
  waypointIndex: number;
  detour: THREE.Vector3 | null;
  waitClock: number;
  runtime: VehicleRuntime;
}

const AMR_THEME = [
  { body: '#2f3442', shell: '#4a5265', trim: '#6ed6ff', led: '#56e2ff' },
  { body: '#30363f', shell: '#566174', trim: '#9fd3ff', led: '#9fe7ff' },
  { body: '#312f3d', shell: '#57506a', trim: '#b8b1ff', led: '#d2c8ff' },
];

function buildPath(path: [number, number, number][]) {
  return path.map(([x, y, z]) => new THREE.Vector3(snapToGrid(x, GRID), y, snapToGrid(z, GRID)));
}

function AMRVisual({
  id,
  runtime,
  carryingPallet,
}: {
  id: number;
  runtime: VehicleRuntime;
  carryingPallet: boolean;
}) {
  const rootRef = useRef<THREE.Group>(null!);
  const wheelRefs = useRef<THREE.Mesh[]>([]);
  const scannerRef = useRef<THREE.Mesh>(null!);
  const stripRef = useRef<THREE.MeshStandardMaterial>(null!);

  const theme = AMR_THEME[id % AMR_THEME.length];

  useFrame(({ clock }, delta) => {
    if (!rootRef.current) return;

    const t = clock.getElapsedTime() + id * 0.5;
    const bob = runtime.moving ? Math.sin(t * 8) * 0.003 : 0;
    rootRef.current.position.set(runtime.x, 0.01 + bob, runtime.z);
    rootRef.current.rotation.y = runtime.rotY;

    if (scannerRef.current) scannerRef.current.rotation.y += delta * (runtime.moving ? 5.6 : 2.1);

    for (let i = 0; i < wheelRefs.current.length; i++) {
      const wheel = wheelRefs.current[i];
      if (wheel) wheel.rotation.x += delta * (runtime.moving ? 8.2 : 0.8);
    }

    if (stripRef.current) {
      stripRef.current.emissiveIntensity = runtime.waiting
        ? 0.35 + Math.sin(t * 9) * 0.25
        : carryingPallet
        ? 0.75
        : 0.55;
      stripRef.current.emissive.set(runtime.waiting ? '#ff8a52' : carryingPallet ? '#6cc5ff' : theme.led);
      stripRef.current.color.set(runtime.waiting ? '#ffb48b' : carryingPallet ? '#7fd2ff' : theme.led);
    }
  });

  return (
    <group ref={rootRef}>
      <mesh position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.42, 24]} />
        <meshBasicMaterial color={theme.led} transparent opacity={runtime.waiting ? 0.11 : 0.07} toneMapped={false} />
      </mesh>

      <mesh position={[0, 0.06, 0]} castShadow>
        <boxGeometry args={[0.72, 0.08, 0.5]} />
        <meshPhysicalMaterial color={theme.body} metalness={0.72} roughness={0.24} clearcoat={0.3} clearcoatRoughness={0.2} />
      </mesh>

      <mesh position={[0, 0.11, 0]} castShadow>
        <boxGeometry args={[0.64, 0.028, 0.44]} />
        <meshPhysicalMaterial color={theme.shell} metalness={0.48} roughness={0.32} />
      </mesh>

      {[0.28, -0.28].map((z, i) => (
        <mesh key={`bump-${id}-${i}`} position={[0, 0.055, z]}>
          <boxGeometry args={[0.54, 0.032, 0.018]} />
          <meshStandardMaterial color={theme.trim} roughness={0.45} metalness={0.35} emissive={theme.trim} emissiveIntensity={0.25} toneMapped={false} />
        </mesh>
      ))}

      {[[-0.24, -0.2], [-0.24, 0.2], [0.24, -0.2], [0.24, 0.2]].map(([x, z], i) => (
        <mesh
          key={`wheel-${id}-${i}`}
          ref={(el: THREE.Mesh | null) => {
            if (el) wheelRefs.current[i] = el;
          }}
          position={[x, 0.035, z]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[0.035, 0.035, 0.045, 12]} />
          <meshPhysicalMaterial color="#171a21" roughness={0.9} metalness={0.08} />
        </mesh>
      ))}

      <mesh position={[0, 0.14, 0]}>
        <cylinderGeometry args={[0.055, 0.06, 0.038, 16]} />
        <meshPhysicalMaterial color="#161922" metalness={0.85} roughness={0.18} />
      </mesh>
      <mesh ref={scannerRef} position={[0, 0.173, 0]}>
        <cylinderGeometry args={[0.03, 0.041, 0.022, 12]} />
        <meshPhysicalMaterial color="#1f2432" metalness={0.9} roughness={0.14} />
      </mesh>

      <mesh position={[0, 0.082, 0.255]}>
        <boxGeometry args={[0.5, 0.01, 0.006]} />
        <meshStandardMaterial
          ref={stripRef}
          color={theme.led}
          emissive={theme.led}
          emissiveIntensity={0.55}
          toneMapped={false}
        />
      </mesh>

      <mesh position={[0, 0.08, -0.255]}>
        <boxGeometry args={[0.5, 0.01, 0.006]} />
        <meshStandardMaterial color={theme.led} emissive={theme.led} emissiveIntensity={0.4} toneMapped={false} />
      </mesh>

      <pointLight
        position={[0, 0.03, 0]}
        intensity={runtime.waiting ? 0.1 : 0.16}
        color={runtime.waiting ? '#ff9a6e' : carryingPallet ? '#7bc6ff' : theme.led}
        distance={1.5}
        decay={2}
      />

      {carryingPallet && (
        <group position={[0, 0.15, 0]}>
          <mesh>
            <boxGeometry args={[0.58, 0.014, 0.44]} />
            <meshPhysicalMaterial color="#be9d5a" roughness={0.72} metalness={0.05} />
          </mesh>
          {[0.08, 0.19].map((y, li) => (
            <group key={`cargo-${id}-${li}`}>
              {[-0.14, 0, 0.14].map((x, xi) =>
                [-0.08, 0.08].map((z, zi) => (
                  <mesh key={`box-${id}-${li}-${xi}-${zi}`} position={[x, y, z]}>
                    <boxGeometry args={[0.13, 0.1, 0.13]} />
                    <meshStandardMaterial color={li === 0 ? '#c89b71' : '#b9875e'} roughness={0.66} metalness={0.02} />
                  </mesh>
                )),
              )}
            </group>
          ))}
        </group>
      )}
    </group>
  );
}

export function AMRFleet() {
  const emergencyStop = useStore(s => s.emergencyStop);
  const amrDelivering = useStore(s => s.amrDelivering);
  const amrWaiting = useStore(s => s.amrWaiting);

  const statesRef = useRef<VehicleState[]>(
    PATROL_PATHS.map((path, index) => {
      const parsed = buildPath(path);
      return {
        id: index,
        path: parsed,
        waypointIndex: 1,
        detour: null,
        waitClock: 0,
        runtime: {
          x: parsed[0].x,
          y: parsed[0].y,
          z: parsed[0].z,
          rotY: 0,
          waiting: false,
          moving: true,
        },
      };
    }),
  );

  const deliveryState = useMemo(() => ({ carrying: amrDelivering, waiting: amrWaiting }), [amrDelivering, amrWaiting]);

  useFrame((_, delta) => {
    const states = statesRef.current;
    const agents: CollisionAgent[] = states.map(s => ({
      id: s.id,
      position: new THREE.Vector3(s.runtime.x, 0, s.runtime.z),
      halfSize: HALF_SIZE,
    }));

    for (let i = 0; i < states.length; i++) {
      const state = states[i];
      const runtime = state.runtime;

      const isDeliveryAmr = state.id === 0;
      const scenarioWaiting = isDeliveryAmr && deliveryState.waiting;
      if (emergencyStop || scenarioWaiting) {
        runtime.waiting = true;
        runtime.moving = false;
        state.waitClock = 0;
        continue;
      }

      const current = new THREE.Vector3(runtime.x, 0, runtime.z);
      let target = state.detour ?? state.path[state.waypointIndex];

      const toTarget = new THREE.Vector3(target.x - current.x, 0, target.z - current.z);
      if (toTarget.length() < ARRIVAL_EPS) {
        if (state.detour) {
          state.detour = null;
        } else {
          state.waypointIndex = (state.waypointIndex + 1) % state.path.length;
        }
        target = state.detour ?? state.path[state.waypointIndex];
      }

      const moveDir = new THREE.Vector3(target.x - runtime.x, 0, target.z - runtime.z);
      const dist = moveDir.length();
      if (dist < 1e-4) {
        runtime.waiting = false;
        runtime.moving = false;
        continue;
      }

      moveDir.normalize();
      const loadPenalty = isDeliveryAmr && deliveryState.carrying ? 0.88 : 1;
      const step = Math.min(BASE_SPEED * loadPenalty * delta, dist);

      const nextX = runtime.x + moveDir.x * step;
      const nextZ = runtime.z + moveDir.z * step;
      const nextAabb = createAABB(nextX, nextZ, HALF_SIZE);

      const hitStatic = blockedByStatic(nextAabb, STATIC_OBSTACLES);
      const hitAgent = blockedByAgents(nextAabb, state.id, agents);

      if (hitStatic || hitAgent) {
        runtime.waiting = true;
        runtime.moving = false;
        state.waitClock += delta;

        if (state.waitClock > 0.28) {
          const detour = waypointDetour(current, target, GRID, HALF_SIZE, STATIC_OBSTACLES);
          if (detour) {
            state.detour = detour;
            state.waitClock = 0;
            runtime.waiting = false;
          }
        }
        continue;
      }

      state.waitClock = 0;
      runtime.waiting = false;
      runtime.moving = true;
      runtime.x = nextX;
      runtime.z = nextZ;
      runtime.rotY = Math.atan2(moveDir.x, moveDir.z);
      agents[i].position.set(runtime.x, 0, runtime.z);
    }
  });

  return (
    <group>
      {statesRef.current.map(state => (
        <AMRVisual
          key={state.id}
          id={state.id}
          runtime={state.runtime}
          carryingPallet={state.id === 0 && deliveryState.carrying}
        />
      ))}
    </group>
  );
}
