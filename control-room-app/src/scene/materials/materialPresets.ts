/**
 * materialPresets.ts — Reusable PBR material property sets.
 * Import a preset and spread it into <meshPhysicalMaterial {...M.paintedSteel} />.
 * Every preset targets MeshPhysicalMaterial.
 */

/* ---------- helper type ---------- */
export interface MatProps {
  color: string;
  roughness: number;
  metalness: number;
  clearcoat?: number;
  clearcoatRoughness?: number;
}

/* ══════════════════════════════════════════════
 *  METAL
 *  ══════════════════════════════════════════════ */

/** Powder-coated RAL 7016 grey steel — machine frames, cabinets */
export const paintedSteel: MatProps = {
  color: '#4a5060',
  roughness: 0.45,
  metalness: 0.6,
  clearcoat: 0.1,
  clearcoatRoughness: 0.6,
};

/** Bright machined steel — exposed shafts, pins, bolts */
export const machinedSteel: MatProps = {
  color: '#8a8a90',
  roughness: 0.15,
  metalness: 0.9,
};

/** Brushed aluminium — extrusion profiles, guard frames */
export const brushedAluminium: MatProps = {
  color: '#a0a5b0',
  roughness: 0.28,
  metalness: 0.75,
  clearcoat: 0.08,
  clearcoatRoughness: 0.5,
};

/** Cast iron base — heavy machine feet, robot base */
export const castIron: MatProps = {
  color: '#3a3d42',
  roughness: 0.6,
  metalness: 0.65,
};

/** Chrome / nickel plating — piston rods, actuator shafts */
export const chrome: MatProps = {
  color: '#c0c0c5',
  roughness: 0.08,
  metalness: 0.95,
};

/** Yellow safety — fence posts, guard rails */
export const safetyYellow: MatProps = {
  color: '#d4a820',
  roughness: 0.35,
  metalness: 0.4,
  clearcoat: 0.15,
  clearcoatRoughness: 0.4,
};

/** Red safety — e-stop buttons, fire equipment */
export const safetyRed: MatProps = {
  color: '#c03030',
  roughness: 0.3,
  metalness: 0.3,
  clearcoat: 0.55,
  clearcoatRoughness: 0.2,
};

/** Brass / bronze accent — nameplates, pedestal trim */
export const brass: MatProps = {
  color: '#b59a5e',
  roughness: 0.2,
  metalness: 0.8,
};

/** Dark enclosure — monitors, electrical panels */
export const darkEnclosure: MatProps = {
  color: '#1a1c20',
  roughness: 0.2,
  metalness: 0.6,
  clearcoat: 0.4,
  clearcoatRoughness: 0.3,
};

/* ══════════════════════════════════════════════
 *  PLASTICS / RUBBER / MISC
 *  ══════════════════════════════════════════════ */

/** Black ABS plastic — sensor housings, motor covers */
export const blackPlastic: MatProps = {
  color: '#1e1e20',
  roughness: 0.55,
  metalness: 0.05,
  clearcoat: 0.25,
  clearcoatRoughness: 0.6,
};

/** Grey PVC — conduit, trunking */
export const greyPVC: MatProps = {
  color: '#6a6e75',
  roughness: 0.7,
  metalness: 0.05,
};

/** Black rubber — belt surface, gaskets */
export const rubber: MatProps = {
  color: '#222225',
  roughness: 0.85,
  metalness: 0.02,
};

/** Wood pallet — EUR/EPAL colour */
export const palletWood: MatProps = {
  color: '#7a6a50',
  roughness: 0.85,
  metalness: 0.02,
};

/** Cardboard — carton surfaces */
export const cardboard: MatProps = {
  color: '#8a7a60',
  roughness: 0.82,
  metalness: 0.03,
};

/** Desk laminate — control desk surface */
export const laminate: MatProps = {
  color: '#3a3530',
  roughness: 0.6,
  metalness: 0.08,
  clearcoat: 0.3,
  clearcoatRoughness: 0.5,
};

/** Warning label yellow decal */
export const warningDecal: MatProps = {
  color: '#c8a020',
  roughness: 0.5,
  metalness: 0.05,
};

/** Screen glass — emissive applied separately */
export const screenGlass: MatProps = {
  color: '#0a1520',
  roughness: 0.05,
  metalness: 0.1,
  clearcoat: 0.8,
  clearcoatRoughness: 0.1,
};
