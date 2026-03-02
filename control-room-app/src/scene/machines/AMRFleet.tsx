import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../state/store';
import { AMR, type AMRRuntime } from '../AMR';
import {
  type AABB,
  type CollisionAgent,
  blockedByAgents,
  blockedByStatic,
  createAABB,
  snapToGrid,
  waypointDetour,
} from '../CollisionSystem';

const GRID = 0.4;
const SPEED = 0.95;
const HALF = 0.19;
const ARRIVAL_EPS = 0.08;

const PATHS: [number, number, number][][] = [
  [[-8, 0, -3], [-6, 0, -3], [-6, 0, -1.4], [-5.4, 0, -1.4], [-6, 0, -3]],
  [[-8, 0, 3], [-4, 0, 3], [0, 0, 3.2], [4, 0, 2.6], [7, 0, 1.8], [5, 0, -1.8], [1, 0, -2.6], [-4, 0, -2.2], [-8, 0, -1.8]],
  [[8, 0, -3], [5, 0, -2.6], [2, 0, -2.1], [-1, 0, -2.3], [-4, 0, -1.2], [-3.8, 0, 1.1], [-0.2, 0, 2.1], [4, 0, 1.6], [8, 0, 0]],
];

const STATIC_OBSTACLES: AABB[] = [
  createAABB(-5.2, -1.4, 0.45),
  createAABB(-4.3, -1.4, 0.45),
  createAABB(6.2, 2.4, 0.45),
  createAABB(5.6, 0.1, 0.45),
  createAABB(-0.4, -2.9, 1.45),
  createAABB(3.1, 0.8, 0.95),
  createAABB(3.1, -0.8, 0.95),
];

interface AgentState {
  id: number;
  path: THREE.Vector3[];
  runtime: AMRRuntime;
  waypointIndex: number;
  detour: THREE.Vector3 | null;
  waitClock: number;
}

function buildPath(path: [number, number, number][]) {
  return path.map(([x, y, z]) => new THREE.Vector3(snapToGrid(x, GRID), y, snapToGrid(z, GRID)));
}

export function AMRFleet() {
  const emergency = useStore(s => s.emergencyStop);
  const delivery = useStore(s => s.amrDelivering);
  const waitingByOps = useStore(s => s.amrWaiting);

  const agentStates = useRef<AgentState[]>(
    PATHS.map((path, index) => {
      const parsed = buildPath(path);
      return {
        id: index,
        path: parsed,
        runtime: {
          x: parsed[0].x,
          y: 0,
          z: parsed[0].z,
          rotY: 0,
          waiting: false,
          moving: true,
        },
        waypointIndex: 1,
        detour: null,
        waitClock: 0,
      };
    }),
  );

  const agentVisuals = useMemo(
    () => [
      { body: '#9ad7c8', accent: '#76bfb1', led: '#8ef8df' },
      { body: '#b8addf', accent: '#cdbdf0', led: '#d9beff' },
      { body: '#e8d9c5', accent: '#f1a28f', led: '#ffd7b5' },
    ],
    [],
  );

  useFrame((_, delta) => {
    const states = agentStates.current;
    const dynamicAgents: CollisionAgent[] = states.map(s => ({
      id: s.id,
      position: new THREE.Vector3(s.runtime.x, 0, s.runtime.z),
      halfSize: HALF,
    }));

    for (let i = 0; i < states.length; i++) {
      const state = states[i];
      const runtime = state.runtime;

      const blockedByScenario = state.id === 0 && (waitingByOps || (delivery && emergency));
      if (emergency || blockedByScenario) {
        runtime.waiting = true;
        runtime.moving = false;
        continue;
      }

      const current = new THREE.Vector3(runtime.x, 0, runtime.z);
      let target = state.detour ?? state.path[state.waypointIndex];

      const toTarget = new THREE.Vector3(target.x - current.x, 0, target.z - current.z);
      const dist = toTarget.length();

      if (dist < ARRIVAL_EPS) {
        if (state.detour) {
          state.detour = null;
        } else {
          state.waypointIndex = (state.waypointIndex + 1) % state.path.length;
        }
        target = state.detour ?? state.path[state.waypointIndex];
      }

      const moveDir = new THREE.Vector3(target.x - runtime.x, 0, target.z - runtime.z);
      const moveLen = moveDir.length();
      if (moveLen < 1e-4) {
        runtime.moving = false;
        runtime.waiting = false;
        continue;
      }

      moveDir.normalize();
      const step = Math.min(SPEED * delta, moveLen);
      const nx = snapToGrid(runtime.x + moveDir.x * step, GRID / 2);
      const nz = snapToGrid(runtime.z + moveDir.z * step, GRID / 2);
      const nextAabb = createAABB(nx, nz, HALF);

      const blockedStatic = blockedByStatic(nextAabb, STATIC_OBSTACLES);
      const blockedDynamic = blockedByAgents(nextAabb, state.id, dynamicAgents);

      if (blockedStatic || blockedDynamic) {
        state.waitClock += delta;
        runtime.waiting = true;
        runtime.moving = false;

        if (state.waitClock > 0.35) {
          const detour = waypointDetour(current, target, GRID, HALF, STATIC_OBSTACLES);
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
      runtime.x = nx;
      runtime.z = nz;
      runtime.rotY = Math.atan2(moveDir.x, moveDir.z);

      dynamicAgents[i].position.set(runtime.x, 0, runtime.z);
    }
  });

  return (
    <group>
      {agentStates.current.map((state, index) => (
        <AMR
          key={state.id}
          runtime={state.runtime}
          phase={index * 0.8}
          bodyColor={agentVisuals[index].body}
          accentColor={agentVisuals[index].accent}
          ledColor={agentVisuals[index].led}
        />
      ))}
    </group>
  );
}