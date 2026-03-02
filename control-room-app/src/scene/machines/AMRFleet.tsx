import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../state/store';

/**
 * AMR Fleet — Autonomous Mobile Robots that patrol the warehouse,
 * deliver pallets to the depal buffer lane, and wait when buffer is full.
 * High-detail chassis with LIDAR dome, safety scanners, LED strips,
 * driven wheels, and pallet on top when delivering.
 */

/* ── Patrol path waypoints (world coordinates) ── */
const PATROL_PATHS: [number, number, number][][] = [
  // AMR 0: main delivery route (warehouse → buffer lane)
  [[-8, 0.01, -3], [-6, 0.01, -3], [-6, 0.01, -1.4], [-5.5, 0.01, -1.4]],
  // AMR 1: secondary patrol route (circling the scene)
  [[-8, 0.01, 3], [-4, 0.01, 3], [0, 0.01, 3.5], [4, 0.01, 3], [7, 0.01, 2], [7, 0.01, -2], [4, 0.01, -3], [-2, 0.01, -3], [-8, 0.01, -2]],
  // AMR 2: cross-dock route
  [[8, 0.01, -3], [5, 0.01, -3], [2, 0.01, -2.5], [-1, 0.01, -3], [-4, 0.01, -2], [-4, 0.01, 1], [0, 0.01, 2], [4, 0.01, 1.5], [8, 0.01, 0]],
];

const AMR_SPEED = 0.6; // units per second

export function AMRFleet() {
  return (
    <group>
      {PATROL_PATHS.map((path, i) => (
        <AMRVehicle key={i} index={i} path={path} />
      ))}
    </group>
  );
}

function AMRVehicle({ index, path }: { index: number; path: [number, number, number][] }) {
  const groupRef = useRef<THREE.Group>(null!);
  const wheelRefs = useRef<THREE.Mesh[]>([]);
  const ledRef = useRef<THREE.Mesh>(null!);
  const scannerRef = useRef<THREE.Mesh>(null!);
  const progressRef = useRef(index * 0.33); // staggered start
  const amrDelivering = useStore(s => s.amrDelivering);
  const amrWaiting = useStore(s => s.amrWaiting);

  // Is this the delivery AMR (index 0)?
  const isDeliveryAmr = index === 0;
  const carryingPallet = isDeliveryAmr && amrDelivering;
  const waiting = isDeliveryAmr && amrWaiting;

  const pathLength = useMemo(() => {
    let len = 0;
    for (let i = 1; i < path.length; i++) {
      const dx = path[i][0] - path[i - 1][0];
      const dz = path[i][2] - path[i - 1][2];
      len += Math.sqrt(dx * dx + dz * dz);
    }
    return len;
  }, [path]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (waiting) {
      // Pulse the LED when waiting
      if (ledRef.current) {
        const mat = ledRef.current.material as THREE.MeshBasicMaterial;
        mat.color.setHex(Math.sin(performance.now() * 0.005) > 0 ? 0xff8800 : 0xff2020);
      }
      return;
    }

    // Advance along path
    progressRef.current += (AMR_SPEED * delta) / pathLength;
    if (progressRef.current >= 1) progressRef.current -= 1;

    const totalDist = progressRef.current * pathLength;
    let accumulated = 0;
    let pos = new THREE.Vector3(path[0][0], 0.01, path[0][2]);
    let dir = new THREE.Vector3(1, 0, 0);

    for (let i = 1; i < path.length; i++) {
      const dx = path[i][0] - path[i - 1][0];
      const dz = path[i][2] - path[i - 1][2];
      const segLen = Math.sqrt(dx * dx + dz * dz);
      if (accumulated + segLen >= totalDist) {
        const segT = (totalDist - accumulated) / segLen;
        pos.set(
          path[i - 1][0] + dx * segT,
          0.01,
          path[i - 1][2] + dz * segT,
        );
        dir.set(dx, 0, dz).normalize();
        break;
      }
      accumulated += segLen;
    }

    groupRef.current.position.copy(pos);
    if (dir.length() > 0.001) {
      groupRef.current.rotation.y = Math.atan2(dir.x, dir.z);
    }

    // Spin wheels
    wheelRefs.current.forEach(w => {
      if (w) w.rotation.x += delta * 6;
    });

    // Scanner rotation
    if (scannerRef.current) {
      scannerRef.current.rotation.y += delta * 3;
    }

    // LED colour: green normal, blue delivering, orange waiting
    if (ledRef.current) {
      const mat = ledRef.current.material as THREE.MeshBasicMaterial;
      mat.color.setHex(carryingPallet ? 0x4080ff : 0x40ff40);
    }
  });

  return (
    <group ref={groupRef}>
      {/* ── Chassis — low flat box ── */}
      <mesh position={[0, 0.06, 0]} castShadow>
        <boxGeometry args={[0.7, 0.08, 0.5]} />
        <meshPhysicalMaterial color="#2a2a30" metalness={0.7} roughness={0.25} clearcoat={0.3} clearcoatRoughness={0.2} />
      </mesh>

      {/* ── Top cover — rounded ── */}
      <mesh position={[0, 0.11, 0]} castShadow>
        <boxGeometry args={[0.64, 0.025, 0.44]} />
        <meshPhysicalMaterial color="#3a4050" metalness={0.5} roughness={0.3} />
      </mesh>

      {/* ── Bumper strips (front + back) ── */}
      {[0.36, -0.36].map((x, i) => (
        <mesh key={`bump${i}`} position={[0, 0.05, x * (0.5 / 0.36)]}>
          <boxGeometry args={[0.52, 0.04, 0.02]} />
          <meshPhysicalMaterial color="#e8a020" roughness={0.5} metalness={0.3} />
        </mesh>
      ))}

      {/* ── Wheels (4) ── */}
      {[[-0.24, -0.2], [-0.24, 0.2], [0.24, -0.2], [0.24, 0.2]].map(([x, z], i) => (
        <mesh
          key={`wheel${i}`}
          ref={(el: THREE.Mesh | null) => { if (el) wheelRefs.current[i] = el; }}
          position={[x, 0.035, z]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[0.035, 0.035, 0.04, 12]} />
          <meshPhysicalMaterial color="#1a1a1a" roughness={0.9} metalness={0.1} />
        </mesh>
      ))}

      {/* ── LIDAR dome ── */}
      <mesh position={[0, 0.14, 0]}>
        <cylinderGeometry args={[0.05, 0.06, 0.04, 16]} />
        <meshPhysicalMaterial color="#1a1a20" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh ref={scannerRef} position={[0, 0.17, 0]}>
        <cylinderGeometry args={[0.03, 0.04, 0.025, 12]} />
        <meshPhysicalMaterial color="#202030" metalness={0.9} roughness={0.15} />
      </mesh>
      {/* LIDAR beam indicator */}
      <mesh position={[0, 0.185, 0]}>
        <sphereGeometry args={[0.008, 8, 8]} />
        <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={2} toneMapped={false} />
      </mesh>

      {/* ── Safety scanners (front + back) ── */}
      {[0.28, -0.28].map((z, i) => (
        <group key={`scan${i}`} position={[0, 0.03, z]}>
          <mesh>
            <boxGeometry args={[0.08, 0.02, 0.02]} />
            <meshPhysicalMaterial color="#1a1a1a" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0, i === 0 ? 0.012 : -0.012]}>
            <boxGeometry args={[0.06, 0.015, 0.003]} />
            <meshStandardMaterial color="#ff4444" emissive="#ff2020" emissiveIntensity={0.5} transparent opacity={0.8} />
          </mesh>
        </group>
      ))}

      {/* ── LED status strips (side) ── */}
      {[-0.26, 0.26].map((z, i) => (
        <mesh
          key={`led${i}`}
          ref={i === 0 ? ledRef : undefined}
          position={[0, 0.08, z]}
        >
          <boxGeometry args={[0.5, 0.01, 0.005]} />
          <meshBasicMaterial color="#40ff40" />
        </mesh>
      ))}

      {/* ── Logo/ID plate ── */}
      <mesh position={[0.33, 0.08, 0]}>
        <planeGeometry args={[0.06, 0.03]} />
        <meshStandardMaterial color="#e0e0e0" metalness={0.3} roughness={0.4} />
      </mesh>

      {/* ── Battery indicator LEDs ── */}
      {[0, 1, 2, 3].map(i => (
        <mesh key={`batt${i}`} position={[-0.2 + i * 0.04, 0.125, 0.22]}>
          <sphereGeometry args={[0.005, 6, 6]} />
          <meshStandardMaterial
            color={i < 3 ? '#00ff44' : '#ff4400'}
            emissive={i < 3 ? '#00ff44' : '#ff4400'}
            emissiveIntensity={1.5}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* ── Point light under chassis for floor glow ── */}
      <pointLight position={[0, 0.02, 0]} intensity={0.15} color="#4080ff" distance={1.5} decay={2} />

      {/* ── Carried pallet (visible when delivering) ── */}
      {carryingPallet && (
        <group position={[0, 0.15, 0]}>
          <mesh>
            <boxGeometry args={[0.6, 0.012, 0.45]} />
            <meshPhysicalMaterial color="#c4a55a" roughness={0.7} metalness={0.05} />
          </mesh>
          {/* Stacked boxes on pallet */}
          {[0.08, 0.19, 0.3].map((y, li) => (
            <group key={`pl${li}`}>
              {[-0.15, 0, 0.15].map((x, xi) =>
                [-0.08, 0.08].map((z, zi) => (
                  <mesh key={`pb${xi}_${zi}`} position={[x, y, z]}>
                    <boxGeometry args={[0.14, 0.1, 0.14]} />
                    <meshPhysicalMaterial color="#c4956a" roughness={0.65} metalness={0.02} />
                  </mesh>
                ))
              )}
            </group>
          ))}
        </group>
      )}
    </group>
  );
}
