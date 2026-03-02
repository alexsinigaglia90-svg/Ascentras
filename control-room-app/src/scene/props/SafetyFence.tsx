import * as M from '../materials/materialPresets';

/** ── Reusable safety fence section ──
 *  Posts + horizontal rails + top caps.
 *  `corners` = array of [x, z] positions for posts (y is auto 0).
 *  `height` = total fence height.
 */
export function SafetyFence({ corners, height = 0.9, y = 0 }: {
  corners: [number, number][];
  height?: number;
  y?: number;
}) {
  return (
    <group>
      {corners.map(([x, z], i) => (
        <group key={i}>
          {/* Post */}
          <mesh position={[x, y + height / 2, z]} castShadow>
            <boxGeometry args={[0.03, height, 0.03]} />
            <meshPhysicalMaterial {...M.safetyYellow} />
          </mesh>
          {/* Top cap */}
          <mesh position={[x, y + height + 0.01, z]}>
            <sphereGeometry args={[0.02, 6, 6]} />
            <meshPhysicalMaterial {...M.safetyYellow} />
          </mesh>
          {/* Floor plate */}
          <mesh position={[x, y + 0.005, z]} receiveShadow>
            <boxGeometry args={[0.08, 0.01, 0.08]} />
            <meshPhysicalMaterial {...M.castIron} />
          </mesh>
        </group>
      ))}

      {/* Horizontal rails between consecutive posts */}
      {corners.map(([x1, z1], i) => {
        if (i === corners.length - 1) return null;
        const [x2, z2] = corners[i + 1];
        const mx = (x1 + x2) / 2;
        const mz = (z1 + z2) / 2;
        const len = Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2);
        const angle = Math.atan2(x2 - x1, z2 - z1);
        return (
          <group key={`rail${i}`}>
            {/* Upper rail */}
            <mesh position={[mx, y + height * 0.75, mz]} rotation={[0, angle, 0]}>
              <boxGeometry args={[0.02, 0.02, len]} />
              <meshPhysicalMaterial {...M.safetyYellow} />
            </mesh>
            {/* Lower rail */}
            <mesh position={[mx, y + height * 0.35, mz]} rotation={[0, angle, 0]}>
              <boxGeometry args={[0.02, 0.02, len]} />
              <meshPhysicalMaterial {...M.safetyYellow} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/** Access gate panel — simplified hinged gate */
export function AccessGate({ position, rotation = [0, 0, 0], width = 0.6, height = 0.9 }: {
  position: [number, number, number];
  rotation?: [number, number, number];
  width?: number;
  height?: number;
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* Gate frame */}
      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={[width, height, 0.02]} />
        <meshPhysicalMaterial
          color="#d4a820"
          roughness={0.4}
          metalness={0.4}
          transparent
          opacity={0.25}
        />
      </mesh>
      {/* Wire mesh pattern hint */}
      <mesh position={[0, height / 2, 0.011]}>
        <boxGeometry args={[width - 0.06, height - 0.06, 0.003]} />
        <meshStandardMaterial color="#c8b030" wireframe transparent opacity={0.12} />
      </mesh>
      {/* Hinge side post */}
      <mesh position={[-width / 2, height / 2, 0]}>
        <boxGeometry args={[0.03, height + 0.04, 0.03]} />
        <meshPhysicalMaterial {...M.safetyYellow} />
      </mesh>
      {/* Handle */}
      <mesh position={[width / 2 - 0.04, height * 0.55, 0.02]}>
        <boxGeometry args={[0.015, 0.06, 0.02]} />
        <meshPhysicalMaterial {...M.machinedSteel} />
      </mesh>
      {/* Interlock sensor */}
      <mesh position={[width / 2, height - 0.05, 0]}>
        <boxGeometry args={[0.025, 0.04, 0.025]} />
        <meshPhysicalMaterial {...M.blackPlastic} />
      </mesh>
    </group>
  );
}
