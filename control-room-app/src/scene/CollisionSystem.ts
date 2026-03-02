import * as THREE from 'three';

export interface AABB {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface CollisionAgent {
  id: number;
  position: THREE.Vector3;
  halfSize: number;
}

export function createAABB(x: number, z: number, halfSize: number): AABB {
  return {
    minX: x - halfSize,
    maxX: x + halfSize,
    minZ: z - halfSize,
    maxZ: z + halfSize,
  };
}

export function aabbIntersects(a: AABB, b: AABB): boolean {
  return !(a.maxX < b.minX || a.minX > b.maxX || a.maxZ < b.minZ || a.minZ > b.maxZ);
}

export function blockedByStatic(nextAabb: AABB, obstacles: AABB[]): boolean {
  for (let i = 0; i < obstacles.length; i++) {
    if (aabbIntersects(nextAabb, obstacles[i])) return true;
  }
  return false;
}

export function blockedByAgents(nextAabb: AABB, selfId: number, agents: CollisionAgent[]): boolean {
  for (let i = 0; i < agents.length; i++) {
    const other = agents[i];
    if (other.id === selfId) continue;
    const otherAabb = createAABB(other.position.x, other.position.z, other.halfSize);
    if (aabbIntersects(nextAabb, otherAabb)) return true;
  }
  return false;
}

export function snapToGrid(value: number, grid: number): number {
  return Math.round(value / grid) * grid;
}

export function waypointDetour(
  from: THREE.Vector3,
  to: THREE.Vector3,
  grid: number,
  halfSize: number,
  staticObstacles: AABB[],
): THREE.Vector3 | null {
  const dir = new THREE.Vector3(to.x - from.x, 0, to.z - from.z).normalize();
  const left = new THREE.Vector3(-dir.z, 0, dir.x);
  const right = new THREE.Vector3(dir.z, 0, -dir.x);

  const leftCandidate = new THREE.Vector3(
    snapToGrid(from.x + left.x * grid, grid),
    from.y,
    snapToGrid(from.z + left.z * grid, grid),
  );
  const rightCandidate = new THREE.Vector3(
    snapToGrid(from.x + right.x * grid, grid),
    from.y,
    snapToGrid(from.z + right.z * grid, grid),
  );

  const leftAabb = createAABB(leftCandidate.x, leftCandidate.z, halfSize);
  if (!blockedByStatic(leftAabb, staticObstacles)) return leftCandidate;

  const rightAabb = createAABB(rightCandidate.x, rightCandidate.z, halfSize);
  if (!blockedByStatic(rightAabb, staticObstacles)) return rightCandidate;

  return null;
}