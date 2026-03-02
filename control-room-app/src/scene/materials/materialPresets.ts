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
  envMapIntensity?: number;
  reflectivity?: number;
  ior?: number;
  sheen?: number;
  sheenRoughness?: number;
  sheenColor?: string;
  specularIntensity?: number;
  specularColor?: string;
}

/* ══════════════════════════════════════════════
 *  METAL
 *  ══════════════════════════════════════════════ */

/** Powder-coated RAL 7016 grey steel — machine frames, cabinets */
export const paintedSteel: MatProps = {
  color: '#4a5060',
  roughness: 0.38,
  metalness: 0.68,
  clearcoat: 0.2,
  clearcoatRoughness: 0.5,
  envMapIntensity: 1.15,
  reflectivity: 0.35,
  specularIntensity: 0.62,
};

/** Bright machined steel — exposed shafts, pins, bolts */
export const machinedSteel: MatProps = {
  color: '#8a8a90',
  roughness: 0.12,
  metalness: 0.94,
  envMapIntensity: 1.3,
  reflectivity: 0.55,
  specularIntensity: 0.85,
};

/** Brushed aluminium — extrusion profiles, guard frames */
export const brushedAluminium: MatProps = {
  color: '#a0a5b0',
  roughness: 0.24,
  metalness: 0.82,
  clearcoat: 0.12,
  clearcoatRoughness: 0.4,
  envMapIntensity: 1.25,
  reflectivity: 0.42,
  specularIntensity: 0.72,
};

/** Cast iron base — heavy machine feet, robot base */
export const castIron: MatProps = {
  color: '#3a3d42',
  roughness: 0.52,
  metalness: 0.7,
  envMapIntensity: 0.95,
  reflectivity: 0.2,
};

/** Chrome / nickel plating — piston rods, actuator shafts */
export const chrome: MatProps = {
  color: '#c0c0c5',
  roughness: 0.06,
  metalness: 0.98,
  envMapIntensity: 1.45,
  reflectivity: 0.75,
  specularIntensity: 1,
};

/** Yellow safety — fence posts, guard rails */
export const safetyYellow: MatProps = {
  color: '#d4a820',
  roughness: 0.28,
  metalness: 0.48,
  clearcoat: 0.25,
  clearcoatRoughness: 0.28,
  envMapIntensity: 1.08,
  reflectivity: 0.4,
};

/** Red safety — e-stop buttons, fire equipment */
export const safetyRed: MatProps = {
  color: '#c03030',
  roughness: 0.26,
  metalness: 0.38,
  clearcoat: 0.65,
  clearcoatRoughness: 0.17,
  envMapIntensity: 1.1,
  reflectivity: 0.45,
};

/** Brass / bronze accent — nameplates, pedestal trim */
export const brass: MatProps = {
  color: '#b59a5e',
  roughness: 0.16,
  metalness: 0.88,
  envMapIntensity: 1.35,
  reflectivity: 0.62,
  specularIntensity: 0.82,
};

/** Dark enclosure — monitors, electrical panels */
export const darkEnclosure: MatProps = {
  color: '#1a1c20',
  roughness: 0.16,
  metalness: 0.68,
  clearcoat: 0.5,
  clearcoatRoughness: 0.26,
  envMapIntensity: 1.1,
  reflectivity: 0.4,
};

/* ══════════════════════════════════════════════
 *  PLASTICS / RUBBER / MISC
 *  ══════════════════════════════════════════════ */

/** Black ABS plastic — sensor housings, motor covers */
export const blackPlastic: MatProps = {
  color: '#1e1e20',
  roughness: 0.48,
  metalness: 0.05,
  clearcoat: 0.32,
  clearcoatRoughness: 0.52,
  ior: 1.42,
  envMapIntensity: 0.65,
};

/** Grey PVC — conduit, trunking */
export const greyPVC: MatProps = {
  color: '#6a6e75',
  roughness: 0.62,
  metalness: 0.05,
  clearcoat: 0.1,
  clearcoatRoughness: 0.7,
  ior: 1.4,
};

/** Black rubber — belt surface, gaskets */
export const rubber: MatProps = {
  color: '#222225',
  roughness: 0.78,
  metalness: 0.02,
  clearcoat: 0.05,
  clearcoatRoughness: 0.9,
};

/** Wood pallet — EUR/EPAL colour */
export const palletWood: MatProps = {
  color: '#7a6a50',
  roughness: 0.72,
  metalness: 0.02,
  sheen: 0.18,
  sheenRoughness: 0.8,
  sheenColor: '#a58a62',
};

/** Cardboard — carton surfaces */
export const cardboard: MatProps = {
  color: '#8a7a60',
  roughness: 0.74,
  metalness: 0.03,
  sheen: 0.22,
  sheenRoughness: 0.86,
  sheenColor: '#b29369',
};

/** Desk laminate — control desk surface */
export const laminate: MatProps = {
  color: '#3a3530',
  roughness: 0.48,
  metalness: 0.1,
  clearcoat: 0.45,
  clearcoatRoughness: 0.36,
  ior: 1.48,
  envMapIntensity: 0.7,
};

/** Warning label yellow decal */
export const warningDecal: MatProps = {
  color: '#c8a020',
  roughness: 0.38,
  metalness: 0.05,
  clearcoat: 0.22,
  clearcoatRoughness: 0.4,
};

/** Screen glass — emissive applied separately */
export const screenGlass: MatProps = {
  color: '#0a1520',
  roughness: 0.05,
  metalness: 0.1,
  clearcoat: 0.8,
  clearcoatRoughness: 0.1,
  ior: 1.52,
  reflectivity: 0.75,
  envMapIntensity: 0.9,
  specularIntensity: 0.95,
};
