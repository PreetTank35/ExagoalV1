'use client';

/**
 * BrainVisualization.tsx
 * -----------------------------------------------------------------------
 * Interactive 3D brain activity model for ExaGo's "Learning State" panel.
 *
 * Pure Three.js (no react-three-fiber). Client component — mount inside a
 * Next.js app with `dynamic(() => import('./BrainVisualization'), { ssr:false })`
 * (see BrainVisualizationExample.tsx).
 *
 * Install:
 *   npm install three
 *   npm install -D @types/three
 * -----------------------------------------------------------------------
 */

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// =========================================================================
// Types
// =========================================================================

export type RegionId =
  | 'frontalLobe'
  | 'parietalLobe'
  | 'temporalLobe'
  | 'occipitalLobe'
  | 'cerebellum'
  | 'brainStem'
  | 'hippocampus'
  | 'amygdala';

export type QuestionType = 'math' | 'verbal' | 'spatial' | 'memory' | 'logic';

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

export interface StudentMetrics {
  /** 0..1 — fraction of recent attempts answered correctly */
  accuracy: number;
  /** 0..1 — normalized solving speed, 1 = fast/fluent, 0 = very slow */
  speed: number;
  /** number of attempts taken on the current concept/question */
  attempts: number;
  /** 0..1 — mastery of the underlying concept (from spaced-repetition / SRS data) */
  conceptMastery: number;
  skillLevel: SkillLevel;
}

export type ActivityMap = Partial<Record<RegionId, number>>;

export interface BrainRegionMeta {
  id: RegionId;
  name: string;
  /** short plain-language description of the region's role, for the overlay */
  fn: string;
}

export interface BrainVisualizationProps {
  /** the type of question currently being solved — drives the base activation pattern */
  questionType?: QuestionType;
  /** the student's live performance metrics — drives activation intensity/spread */
  metrics?: StudentMetrics;
  /**
   * Optional direct activity override per region (0..1), e.g. from a real-time
   * telemetry stream. Merged on top of the computed questionType+metrics pattern.
   */
  activityOverride?: ActivityMap;
  /** called whenever the hovered/selected region changes (null when none) */
  onRegionChange?: (region: BrainRegionMeta | null, activity: number) => void;
  className?: string;
  style?: React.CSSProperties;
  /** show the built-in bottom-left info card + top-right legend (default: true) */
  showOverlay?: boolean;
}

// =========================================================================
// Region metadata (names + plain-language function, shown in the overlay)
// =========================================================================

export const BRAIN_REGIONS: Record<RegionId, BrainRegionMeta> = {
  frontalLobe: {
    id: 'frontalLobe',
    name: 'Frontal Lobe',
    fn: 'Planning, reasoning, and decision-making — the "executive control" of problem solving.',
  },
  parietalLobe: {
    id: 'parietalLobe',
    name: 'Parietal Lobe',
    fn: 'Numerical reasoning, spatial processing, and combining sensory information.',
  },
  temporalLobe: {
    id: 'temporalLobe',
    name: 'Temporal Lobe',
    fn: 'Language comprehension, reading, and auditory processing.',
  },
  occipitalLobe: {
    id: 'occipitalLobe',
    name: 'Occipital Lobe',
    fn: 'Visual processing — reading diagrams, graphs, and on-screen text.',
  },
  cerebellum: {
    id: 'cerebellum',
    name: 'Cerebellum',
    fn: 'Fine motor coordination and the timing/rhythm of procedural steps.',
  },
  brainStem: {
    id: 'brainStem',
    name: 'Brain Stem',
    fn: 'Baseline arousal and alertness — keeps the whole system "switched on".',
  },
  hippocampus: {
    id: 'hippocampus',
    name: 'Hippocampus',
    fn: 'Forming and retrieving memories — recalling formulas, facts, and prior steps.',
  },
  amygdala: {
    id: 'amygdala',
    name: 'Amygdala',
    fn: 'Emotional response — stress, frustration, or confidence under pressure.',
  },
};

// =========================================================================
// Activity computation: question type + student metrics -> per-region 0..1
// =========================================================================

const QUESTION_TYPE_WEIGHTS: Record<QuestionType, ActivityMap> = {
  math: {
    parietalLobe: 0.9,
    frontalLobe: 0.75,
    occipitalLobe: 0.3,
    temporalLobe: 0.25,
    hippocampus: 0.35,
    cerebellum: 0.2,
    amygdala: 0.15,
    brainStem: 0.2,
  },
  verbal: {
    temporalLobe: 0.9,
    frontalLobe: 0.7,
    parietalLobe: 0.3,
    hippocampus: 0.4,
    occipitalLobe: 0.25,
    cerebellum: 0.15,
    amygdala: 0.2,
    brainStem: 0.2,
  },
  spatial: {
    parietalLobe: 0.85,
    occipitalLobe: 0.8,
    cerebellum: 0.5,
    frontalLobe: 0.4,
    temporalLobe: 0.2,
    hippocampus: 0.25,
    amygdala: 0.15,
    brainStem: 0.2,
  },
  memory: {
    hippocampus: 0.95,
    temporalLobe: 0.6,
    frontalLobe: 0.55,
    parietalLobe: 0.3,
    amygdala: 0.3,
    occipitalLobe: 0.2,
    cerebellum: 0.15,
    brainStem: 0.2,
  },
  logic: {
    frontalLobe: 0.9,
    parietalLobe: 0.6,
    temporalLobe: 0.3,
    hippocampus: 0.3,
    occipitalLobe: 0.2,
    cerebellum: 0.2,
    amygdala: 0.15,
    brainStem: 0.2,
  },
};

const SKILL_FOCUS: Record<SkillLevel, number> = {
  // higher = more focused/efficient activation concentrated on primary regions
  beginner: 0.55,
  intermediate: 0.78,
  advanced: 1.0,
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * Turns a question type + live student metrics into a per-region activity
 * map (0..1). Beginners show more diffuse, effortful activation spread
 * across the frontal lobe and amygdala; advanced students show sharper,
 * more concentrated activation in the regions the task actually demands.
 */
export function computeRegionActivity(
  questionType: QuestionType,
  metrics: StudentMetrics
): Record<RegionId, number> {
  const base = QUESTION_TYPE_WEIGHTS[questionType];
  const focus = SKILL_FOCUS[metrics.skillLevel];

  const cognitiveLoad = clamp01(
    (1 - metrics.accuracy) * 0.5 +
      (Math.min(metrics.attempts, 5) / 5) * 0.3 +
      (1 - metrics.conceptMastery) * 0.4
  );
  const fluency = clamp01(metrics.speed * metrics.accuracy);
  const stress = clamp01(cognitiveLoad * (1 - metrics.accuracy) * 1.2);

  const result = {} as Record<RegionId, number>;
  (Object.keys(BRAIN_REGIONS) as RegionId[]).forEach((id) => {
    const primary = base[id] ?? 0.1;
    // focused students concentrate on task-relevant regions; unfocused
    // (low-focus / high-load) students diffuse activity more evenly
    const diffused = primary * focus + 0.35 * (1 - focus);
    let v = diffused * (0.55 + 0.45 * cognitiveLoad) * (0.6 + 0.4 * fluency);

    if (id === 'frontalLobe') {
      // executive control ramps up under load regardless of task
      v = clamp01(v + cognitiveLoad * 0.25);
    }
    if (id === 'amygdala') {
      v = clamp01(v * 0.5 + stress * 0.7);
    }
    if (id === 'brainStem') {
      v = clamp01(0.35 + cognitiveLoad * 0.3);
    }
    result[id] = clamp01(v);
  });

  return result;
}

// =========================================================================
// Color mapping: activity (0..1) -> cool(blue/green) .. warm(orange/red)
// =========================================================================

const ACTIVITY_STOPS: Array<[number, THREE.Color]> = [
  [0.0, new THREE.Color('#22d3ee')],
  [0.35, new THREE.Color('#06b6d4')],
  [0.6, new THREE.Color('#facc15')],
  [0.8, new THREE.Color('#f0abfc')],
  [1.0, new THREE.Color('#ff4fd8')],
];

function activityToColor(t: number, out = new THREE.Color()): THREE.Color {
  const v = clamp01(t);
  for (let i = 0; i < ACTIVITY_STOPS.length - 1; i++) {
    const [t0, c0] = ACTIVITY_STOPS[i];
    const [t1, c1] = ACTIVITY_STOPS[i + 1];
    if (v >= t0 && v <= t1) {
      const localT = t1 === t0 ? 0 : (v - t0) / (t1 - t0);
      return out.copy(c0).lerp(c1, localT);
    }
  }
  return out.copy(ACTIVITY_STOPS[ACTIVITY_STOPS.length - 1][1]);
}

// =========================================================================
// Geometry helpers
// =========================================================================

/** deterministic pseudo-random in [-1, 1], seeded by index — stable across renders */
function seededNoise(i: number): number {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}

/** applies small organic surface displacement to fake gyri/sulci folds */
function addOrganicDisplacement(geometry: THREE.BufferGeometry, amount: number) {
  const pos = geometry.attributes.position;
  const normal = geometry.attributes.normal;
  for (let i = 0; i < pos.count; i++) {
    const nx = normal.getX(i);
    const ny = normal.getY(i);
    const nz = normal.getZ(i);
    const n1 = seededNoise(i * 3.1);
    const n2 = seededNoise(i * 7.7 + 1);
    const d = (n1 * 0.6 + n2 * 0.4) * amount;
    pos.setX(i, pos.getX(i) + nx * d);
    pos.setY(i, pos.getY(i) + ny * d);
    pos.setZ(i, pos.getZ(i) + nz * d);
  }
  pos.needsUpdate = true;
  geometry.computeVertexNormals();
}

interface RegionDef {
  id: RegionId;
  /** local position (mirrored automatically if `bilateral` is true) */
  position: THREE.Vector3;
  scale: THREE.Vector3;
  bilateral: boolean;
  organic: number; // displacement amount, 0 = smooth (e.g. brain stem)
  geometryType: 'sphere' | 'capsule';
}

const REGION_DEFS: RegionDef[] = [
  {
    id: 'frontalLobe',
    position: new THREE.Vector3(0.36, 0.22, 0.62),
    scale: new THREE.Vector3(0.62, 0.72, 0.62),
    bilateral: true,
    organic: 0.05,
    geometryType: 'sphere',
  },
  {
    id: 'parietalLobe',
    position: new THREE.Vector3(0.34, 0.55, -0.05),
    scale: new THREE.Vector3(0.56, 0.5, 0.5),
    bilateral: true,
    organic: 0.05,
    geometryType: 'sphere',
  },
  {
    id: 'occipitalLobe',
    position: new THREE.Vector3(0.28, 0.05, -0.75),
    scale: new THREE.Vector3(0.36, 0.46, 0.4),
    bilateral: true,
    organic: 0.045,
    geometryType: 'sphere',
  },
  {
    id: 'temporalLobe',
    position: new THREE.Vector3(0.56, -0.1, 0.14),
    scale: new THREE.Vector3(0.32, 0.3, 0.5),
    bilateral: true,
    organic: 0.04,
    geometryType: 'sphere',
  },
  {
    id: 'cerebellum',
    position: new THREE.Vector3(0.2, -0.55, -0.62),
    scale: new THREE.Vector3(0.32, 0.32, 0.38),
    bilateral: true,
    organic: 0.06,
    geometryType: 'sphere',
  },
  {
    id: 'brainStem',
    position: new THREE.Vector3(0, -0.78, -0.22),
    scale: new THREE.Vector3(0.14, 0.32, 0.14),
    bilateral: false,
    organic: 0,
    geometryType: 'capsule',
  },
  {
    id: 'hippocampus',
    position: new THREE.Vector3(0.36, -0.16, -0.04),
    scale: new THREE.Vector3(0.22, 0.11, 0.11),
    bilateral: true,
    organic: 0,
    geometryType: 'capsule',
  },
  {
    id: 'amygdala',
    position: new THREE.Vector3(0.36, -0.27, 0.16),
    scale: new THREE.Vector3(0.12, 0.11, 0.11),
    bilateral: true,
    organic: 0.02,
    geometryType: 'sphere',
  },
];

/** curated connection pairs used for the neural-pathway overlay */
const CONNECTIONS: Array<[RegionId, RegionId]> = [
  ['frontalLobe', 'parietalLobe'],
  ['frontalLobe', 'temporalLobe'],
  ['parietalLobe', 'occipitalLobe'],
  ['temporalLobe', 'hippocampus'],
  ['hippocampus', 'amygdala'],
  ['frontalLobe', 'hippocampus'],
  ['cerebellum', 'brainStem'],
  ['brainStem', 'frontalLobe'],
  ['temporalLobe', 'amygdala'],
  ['parietalLobe', 'frontalLobe'],
  ['occipitalLobe', 'temporalLobe'],
];

// LOD segment tiers: [distance, widthSegments, heightSegments]
const LOD_TIERS: Array<[number, number, number]> = [
  [0, 28, 22],
  [4.5, 14, 11],
  [8, 7, 6],
];

interface RegionMeshEntry {
  regionId: RegionId;
  side: 'L' | 'R' | 'C';
  lod: THREE.LOD;
  materials: THREE.MeshStandardMaterial[];
  worldPosition: THREE.Vector3;
  baseColor: THREE.Color;
  phase: number;
}

// =========================================================================
// Component
// =========================================================================

export default function BrainVisualization({
  questionType = 'math',
  metrics = {
    accuracy: 0.75,
    speed: 0.6,
    attempts: 1,
    conceptMastery: 0.6,
    skillLevel: 'intermediate',
  },
  activityOverride,
  onRegionChange,
  className,
  style,
  showOverlay = true,
}: BrainVisualizationProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeRegion, setActiveRegion] = useState<BrainRegionMeta | null>(null);
  const [activeActivity, setActiveActivity] = useState(0);

  // Kept in a ref so the animation loop always reads fresh values without
  // re-running the (expensive) scene-setup effect.
  const liveDataRef = useRef({ questionType, metrics, activityOverride });
  useEffect(() => {
    liveDataRef.current = { questionType, metrics, activityOverride };
  }, [questionType, metrics, activityOverride]);

  const notifyRegionChange = useCallback(
    (region: BrainRegionMeta | null, activity: number) => {
      setActiveRegion(region);
      setActiveActivity(activity);
      onRegionChange?.(region, activity);
    },
    [onRegionChange]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ---- renderer / scene / camera -------------------------------------
    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.touchAction = 'none';

    // ---- lights ----------------------------------------------------------
    const hemiLight = new THREE.HemisphereLight('#dbeafe', '#020617', 0.32);
    scene.add(hemiLight);
    const keyLight = new THREE.DirectionalLight('#ffffff', 1.1);
    keyLight.position.set(2.5, 3, 3);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight('#22d3ee', 0.7);
    rimLight.position.set(-3, -1, -2);
    scene.add(rimLight);

    // ---- controls ----------------------------------------------------------
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 2.2;
    controls.maxDistance = 8;
    controls.enablePan = true;
    controls.panSpeed = 0.6;
    controls.rotateSpeed = 0.7;
    controls.target.set(0, -0.1, 0);

    // ---- brain group -------------------------------------------------------
    const brainGroup = new THREE.Group();
    scene.add(brainGroup);
    brainGroup.scale.setScalar(0.78);
    brainGroup.position.y = -0.1;

    const disposables: Array<THREE.BufferGeometry | THREE.Material | THREE.Texture> = [];
    const regionEntries: RegionMeshEntry[] = [];

    const buildRegionGeometry = (
      def: RegionDef,
      segW: number,
      segH: number
    ): THREE.BufferGeometry => {
      let geo: THREE.BufferGeometry;
      if (def.geometryType === 'capsule') {
        geo = new THREE.CapsuleGeometry(1, 1.4, Math.max(4, Math.floor(segH / 2)), segW);
      } else {
        geo = new THREE.SphereGeometry(1, segW, segH);
      }
      if (def.organic > 0) addOrganicDisplacement(geo, def.organic);
      disposables.push(geo);
      return geo;
    };

    const makeRegionMesh = (def: RegionDef, side: 'L' | 'R' | 'C', mirror: number) => {
      const lod = new THREE.LOD();
      const worldPos = new THREE.Vector3(
        def.position.x * mirror,
        def.position.y,
        def.position.z
      );
      const materials: THREE.MeshStandardMaterial[] = [];

      LOD_TIERS.forEach(([distance, segW, segH]) => {
        const geo = buildRegionGeometry(def, segW, segH);
        const material = new THREE.MeshStandardMaterial({
          color: '#2563eb',
          transparent: true,
          opacity: 0.78,
          roughness: 0.55,
          metalness: 0.08,
          emissive: new THREE.Color('#2563eb'),
          emissiveIntensity: 0.25,
        });
        disposables.push(material);
        materials.push(material);
        const mesh = new THREE.Mesh(geo, material);
        mesh.scale.copy(def.scale);
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        mesh.userData.regionId = def.id;
        lod.addLevel(mesh, distance);
      });

      lod.position.copy(worldPos);
      brainGroup.add(lod);

      regionEntries.push({
        regionId: def.id,
        side,
        lod,
        materials,
        worldPosition: worldPos,
        baseColor: new THREE.Color('#2563eb'),
        phase: Math.random() * Math.PI * 2,
      });
    };

    REGION_DEFS.forEach((def) => {
      if (def.bilateral) {
        makeRegionMesh(def, 'L', 1);
        makeRegionMesh(def, 'R', -1);
      } else {
        makeRegionMesh(def, 'C', 1);
      }
    });

    // Two translucent cortical shells make the longitudinal fissure readable
    // while the colored lobes and pathways remain visible underneath.
    const shellGeo = new THREE.SphereGeometry(1, 24, 20);
    addOrganicDisplacement(shellGeo, 0.04);
    disposables.push(shellGeo);
    const shellMat = new THREE.MeshStandardMaterial({
      color: '#67e8f9',
      transparent: true,
      opacity: 0.08,
      roughness: 0.9,
      metalness: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
      wireframe: true,
    });
    disposables.push(shellMat);
    [-1, 1].forEach((side) => {
      const shellMesh = new THREE.Mesh(shellGeo, shellMat);
      shellMesh.scale.set(0.72, 0.98, 1.15);
      shellMesh.position.set(side * 0.36, -0.05, -0.05);
      brainGroup.add(shellMesh);
    });

    // Procedural gyri: layered curved ridges give the cortex a folded biological
    // surface instead of a collection of smooth lobe spheres.
    const ridgePositions: number[] = [];
    [-1, 1].forEach((side) => {
      for (let row = 0; row < 13; row++) {
        const y = -0.78 + row * 0.13;
        const rowWidth = 0.16 + Math.sin((row / 12) * Math.PI) * 0.48;
        const points = 18;
        for (let point = 0; point < points - 1; point++) {
          const a = point / (points - 1);
          const nextA = (point + 1) / (points - 1);
          const x = side * (0.1 + a * rowWidth);
          const nextX = side * (0.1 + nextA * rowWidth);
          const z = 0.96 - Math.pow(a - 0.5, 2) * 0.72 + seededNoise(row * 41 + point) * 0.035;
          const nextZ = 0.96 - Math.pow(nextA - 0.5, 2) * 0.72 + seededNoise(row * 41 + point + 1) * 0.035;
          ridgePositions.push(x, y + Math.sin(a * Math.PI * 2) * 0.025, z, nextX, y + Math.sin(nextA * Math.PI * 2) * 0.025, nextZ);
        }
      }
    });
    const ridgeGeo = new THREE.BufferGeometry();
    ridgeGeo.setAttribute('position', new THREE.Float32BufferAttribute(ridgePositions, 3));
    const ridgeMat = new THREE.LineBasicMaterial({
      color: '#a5f3fc',
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    disposables.push(ridgeGeo, ridgeMat);
    const cortexRidges = new THREE.LineSegments(ridgeGeo, ridgeMat);
    brainGroup.add(cortexRidges);

    const fissureGeo = new THREE.CapsuleGeometry(0.018, 1.55, 6, 8);
    const fissureMat = new THREE.MeshBasicMaterial({
      color: '#0f172a',
      transparent: true,
      opacity: 0.58,
      depthWrite: false,
    });
    disposables.push(fissureGeo, fissureMat);
    const fissure = new THREE.Mesh(fissureGeo, fissureMat);
    fissure.position.set(0, 0.08, 0.18);
    fissure.rotation.x = Math.PI / 2;
    brainGroup.add(fissure);

    // ---- neural network pathways --------------------------------------
    interface ConnectionEntry {
      from: RegionId;
      to: RegionId;
      tube: THREE.Mesh;
      material: THREE.MeshBasicMaterial;
      dot: THREE.Mesh;
      dotMaterial: THREE.MeshBasicMaterial;
      curve: THREE.QuadraticBezierCurve3;
    }
    const connectionEntries: ConnectionEntry[] = [];

    const regionCenter = (id: RegionId): THREE.Vector3 => {
      // average of L/R (or the single center) entries for this region id
      const entries = regionEntries.filter((r) => r.regionId === id);
      const v = new THREE.Vector3();
      entries.forEach((e) => v.add(e.worldPosition));
      v.divideScalar(entries.length || 1);
      return v;
    };

    CONNECTIONS.forEach(([fromId, toId]) => {
      const p0 = regionCenter(fromId);
      const p1 = regionCenter(toId);
      const mid = p0.clone().add(p1).multiplyScalar(0.5);
      mid.y += 0.25 + Math.random() * 0.15;
      mid.multiplyScalar(1.08);

      const curve = new THREE.QuadraticBezierCurve3(p0, mid, p1);
      const tubeGeo = new THREE.TubeGeometry(curve, 24, 0.011, 6, false);
      disposables.push(tubeGeo);
      const material = new THREE.MeshBasicMaterial({
        color: '#22d3ee',
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      disposables.push(material);
      const tube = new THREE.Mesh(tubeGeo, material);
      brainGroup.add(tube);

      const dotGeo = new THREE.SphereGeometry(0.028, 8, 8);
      disposables.push(dotGeo);
      const dotMaterial = new THREE.MeshBasicMaterial({
        color: '#ffffff',
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      disposables.push(dotMaterial);
      const dot = new THREE.Mesh(dotGeo, dotMaterial);
      brainGroup.add(dot);

      connectionEntries.push({ from: fromId, to: toId, tube, material, dot, dotMaterial, curve });
    });

    // Fine-grained synapse field: the curated pathways explain region-to-region
    // flow, while these nodes make the live neural network visible inside the brain.
    const synapsePositions: THREE.Vector3[] = [];
    for (let i = 0; i < 150; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const angle = Math.abs(seededNoise(i * 1.7)) * Math.PI * 2;
      const radius = 0.18 + Math.abs(seededNoise(i * 2.3 + 4)) * 0.74;
      synapsePositions.push(
        new THREE.Vector3(
          side * (0.08 + Math.abs(seededNoise(i * 3.4 + 2)) * 0.52),
          Math.cos(angle) * radius * 0.68,
          0.12 + Math.sin(angle) * radius * 0.72
        )
      );
    }
    const nodePositionArray = new Float32Array(synapsePositions.flatMap((p) => [p.x, p.y, p.z]));
    const nodeGeo = new THREE.BufferGeometry();
    nodeGeo.setAttribute('position', new THREE.BufferAttribute(nodePositionArray, 3));
    const nodeMat = new THREE.PointsMaterial({
      color: '#67e8f9',
      size: 0.052,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    disposables.push(nodeGeo, nodeMat);
    const synapses = new THREE.Points(nodeGeo, nodeMat);
    brainGroup.add(synapses);

    const networkLinePositions: number[] = [];
    synapsePositions.forEach((point, index) => {
      const neighbor = synapsePositions[(index + 7) % synapsePositions.length];
      networkLinePositions.push(point.x, point.y, point.z, neighbor.x, neighbor.y, neighbor.z);
    });
    const networkGeo = new THREE.BufferGeometry();
    networkGeo.setAttribute('position', new THREE.Float32BufferAttribute(networkLinePositions, 3));
    const networkMat = new THREE.LineBasicMaterial({
      color: '#f0abfc',
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    disposables.push(networkGeo, networkMat);
    const neuralNetwork = new THREE.LineSegments(networkGeo, networkMat);
    brainGroup.add(neuralNetwork);

    // ---- responsive camera framing --------------------------------------
    const frameCameraToContainer = (width: number, height: number) => {
      const aspect = width / Math.max(height, 1);
      camera.aspect = aspect;
      // wider containers (e.g. the ~2.4:1 dashboard panel) use a narrower FOV
      // pulled back slightly; narrower/taller containers use a wider FOV
      // pulled closer, so the brain always fills ~70% of the frame.
      const fov = THREE.MathUtils.clamp(46 - (aspect - 1) * 6, 30, 50);
      camera.fov = fov;
      const distance = THREE.MathUtils.clamp(5.4 + Math.max(0, 1.4 - aspect) * 0.9, 5.1, 6.8);
      camera.position.set(0, -0.1, distance);
      camera.lookAt(0, -0.1, 0);
      camera.updateProjectionMatrix();
    };

    // ---- raycasting for hover / click ------------------------------------
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let lastHoveredId: RegionId | null = null;

    // only the currently-active LOD level should be raycast-testable, both
    // for correctness and to avoid wasted intersection tests on hidden tiers
    const pickableMeshes = () =>
      regionEntries.map((entry) => {
        const levelIndex = entry.lod.getCurrentLevel();
        const level = entry.lod.levels[levelIndex] ?? entry.lod.levels[0];
        return level.object as THREE.Mesh;
      });

    const handlePointerMove = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(pickableMeshes(), false);
      if (intersects.length > 0) {
        const id = intersects[0].object.userData.regionId as RegionId;
        if (id !== lastHoveredId) {
          lastHoveredId = id;
          const activity = liveActivityRef.current[id] ?? 0;
          notifyRegionChange(BRAIN_REGIONS[id], activity);
        }
        renderer.domElement.style.cursor = 'pointer';
      } else if (lastHoveredId !== null) {
        lastHoveredId = null;
        notifyRegionChange(null, 0);
        renderer.domElement.style.cursor = 'grab';
      }
    };
    renderer.domElement.addEventListener('pointermove', handlePointerMove);
    renderer.domElement.style.cursor = 'grab';

    // ---- resize observer --------------------------------------------------
    const liveActivityRef = { current: {} as Record<RegionId, number> };

    const resize = () => {
      const w = container.clientWidth || 1;
      const h = container.clientHeight || 1;
      renderer.setSize(w, h, false);
      frameCameraToContainer(w, h);
    };
    resize();

    const resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(container);

    // ---- animation loop -----------------------------------------------
    let rafId = 0;
    const clock = new THREE.Clock();
    const tmpColor = new THREE.Color();

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      const { questionType: qType, metrics: liveMetrics, activityOverride: override } =
        liveDataRef.current;
      const computed = computeRegionActivity(qType, liveMetrics);
      const merged: Record<RegionId, number> = { ...computed, ...(override ?? {}) } as Record<
        RegionId,
        number
      >;
      liveActivityRef.current = merged;

      regionEntries.forEach((entry) => {
        const activity = clamp01(merged[entry.regionId] ?? 0.1);
        const pulse = 0.5 + 0.5 * Math.sin(t * (1.2 + activity * 1.8) + entry.phase);
        const displayActivity = clamp01(activity * (0.85 + 0.3 * pulse));
        activityToColor(displayActivity, tmpColor);
        entry.baseColor.copy(tmpColor);
        entry.materials.forEach((mat) => {
          mat.color.copy(tmpColor);
          mat.emissive.copy(tmpColor);
          mat.opacity = 0.72 + activity * 0.2;
          mat.emissiveIntensity = 0.25 + activity * 0.9;
        });
      });

      connectionEntries.forEach((conn) => {
        const a = clamp01(merged[conn.from] ?? 0.1);
        const b = clamp01(merged[conn.to] ?? 0.1);
        const strength = clamp01((a * b) ** 0.6);
        conn.material.opacity = strength * 0.55;
        const cA = activityToColor(a, new THREE.Color());
        const cB = activityToColor(b, new THREE.Color());
        conn.material.color.copy(cA).lerp(cB, 0.5);

        if (strength > 0.12) {
          const travel = (t * (0.25 + strength * 0.5) + conn.curve.getLength() * 0.001) % 1;
          const pos = conn.curve.getPoint(travel);
          conn.dot.position.copy(pos);
          conn.dotMaterial.opacity = strength * 0.9;
          conn.dotMaterial.color.copy(cA).lerp(cB, travel);
        } else {
          conn.dotMaterial.opacity = 0;
        }
      });

      const networkActivity = Object.values(merged).reduce((sum, value) => sum + value, 0) / Object.keys(merged).length;
      nodeMat.opacity = 0.62 + networkActivity * 0.38;
      networkMat.opacity = 0.16 + networkActivity * 0.28 + (0.5 + 0.5 * Math.sin(t * 1.6)) * 0.08;
      ridgeMat.opacity = 0.28 + networkActivity * 0.24 + (0.5 + 0.5 * Math.sin(t * 1.2)) * 0.08;

      // keep each region's Level-of-Detail mesh in sync with camera distance
      // (also ensures only the active LOD level is visible/pickable)
      regionEntries.forEach((entry) => entry.lod.update(camera));

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // ---- cleanup ------------------------------------------------------
    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      controls.dispose();

      disposables.forEach((d) => d.dispose());
      regionEntries.forEach((entry) => {
        entry.lod.levels.forEach((level) => {
          const mesh = level.object as THREE.Mesh;
          mesh.geometry?.dispose();
        });
      });

      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
      scene.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifyRegionChange]);

  const skillLabel = useMemo(() => {
    const map: Record<SkillLevel, string> = {
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced',
    };
    return map[metrics.skillLevel];
  }, [metrics.skillLevel]);

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: 220,
        ...style,
      }}
    >
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />

      {showOverlay && (
        <>
          {/* legend, top-right */}
          <div
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 10px',
              background: 'rgba(10,16,35,0.88)',
              border: '1px solid rgba(34,211,238,0.35)',
              borderRadius: 6,
              fontFamily:
                'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
              fontSize: 11,
              color: '#cbd5e1',
              pointerEvents: 'none',
            }}
          >
            <span>Low</span>
            <div
              style={{
                width: 64,
                height: 8,
                borderRadius: 4,
                background:
                  'linear-gradient(90deg, #22d3ee, #06b6d4, #facc15, #f0abfc, #ff4fd8)',
              }}
            />
            <span>High</span>
          </div>

          {/* active region card, bottom-left */}
          <div
            style={{
              position: 'absolute',
              left: 10,
              bottom: 10,
              maxWidth: 280,
              padding: '10px 12px',
              background: 'rgba(10,16,35,0.92)',
              border: '1px solid rgba(34,211,238,0.35)',
              borderRadius: 8,
              fontFamily:
                'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
              color: '#e2e8f0',
              pointerEvents: 'none',
              minHeight: 54,
            }}
          >
            {activeRegion ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: `#${activityToColor(activeActivity).getHexString()}`,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontWeight: 700, fontSize: 13 }}>
                    {activeRegion.name}
                  </span>
                  <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700 }}>
                    {Math.round(activeActivity * 100)}%
                  </span>
                </div>
                <div style={{ fontSize: 11.5, marginTop: 4, lineHeight: 1.4, color: '#94a3b8' }}>
                  {activeRegion.fn}
                </div>
              </>
            ) : (
                <div style={{ fontSize: 12, color: '#94a3b8' }}>
                Hover a brain region to see its current activity ·{' '}
                {questionType.charAt(0).toUpperCase() + questionType.slice(1)} question ·{' '}
                {skillLabel} profile
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
