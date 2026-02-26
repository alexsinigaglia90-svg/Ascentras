import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js';
import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/postprocessing/ShaderPass.js';
import { VignetteShader } from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/shaders/VignetteShader.js';

const STORAGE_OPTIONS = ['High Density', 'High Accessibility', 'Hybrid'];
const FULFILMENT_OPTIONS = ['Wave', 'Continuous Flow', 'Batch'];
const AUTOMATION_OPTIONS = ['Labour Driven', 'Selective Automation', 'Mechanization Heavy'];

const FACTORS = {
  storageModel: {
    'High Density': { throughput: 8, costIndex: -5, congestionRisk: 10, scalability: 6, labourSensitivity: 9 },
    'High Accessibility': { throughput: 10, costIndex: 8, congestionRisk: -6, scalability: 4, labourSensitivity: -2 },
    Hybrid: { throughput: 9, costIndex: 1, congestionRisk: 1, scalability: 8, labourSensitivity: 2 }
  },
  fulfilmentLogic: {
    Wave: { throughput: 5, costIndex: -2, congestionRisk: 7, scalability: 3, labourSensitivity: 4 },
    'Continuous Flow': { throughput: 12, costIndex: 4, congestionRisk: -5, scalability: 9, labourSensitivity: -1 },
    Batch: { throughput: 4, costIndex: -4, congestionRisk: 3, scalability: 5, labourSensitivity: 6 }
  },
  automationLevel: {
    'Labour Driven': { throughput: -4, costIndex: -10, congestionRisk: 8, scalability: -3, labourSensitivity: 14 },
    'Selective Automation': { throughput: 8, costIndex: 2, congestionRisk: -4, scalability: 9, labourSensitivity: -6 },
    'Mechanization Heavy': { throughput: 15, costIndex: 12, congestionRisk: -8, scalability: 13, labourSensitivity: -12 }
  }
};

const BASE_METRICS = {
  throughput: 58,
  costIndex: 52,
  congestionRisk: 50,
  scalability: 56,
  labourSensitivity: 54
};

const LABELS = {
  storageModel: 'Storage Model',
  fulfilmentLogic: 'Fulfilment Logic',
  automationLevel: 'Automation Level'
};

const DEFAULT_DESIGN = {
  storageModel: 'Hybrid',
  fulfilmentLogic: 'Continuous Flow',
  automationLevel: 'Selective Automation'
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function computeMetrics(design) {
  const totals = { ...BASE_METRICS };

  Object.keys(design).forEach((field) => {
    const option = design[field];
    const delta = FACTORS[field][option];
    totals.throughput += delta.throughput;
    totals.costIndex += delta.costIndex;
    totals.congestionRisk += delta.congestionRisk;
    totals.scalability += delta.scalability;
    totals.labourSensitivity += delta.labourSensitivity;
  });

  totals.throughput = clamp(totals.throughput, 25, 100);
  totals.costIndex = clamp(totals.costIndex, 18, 100);
  totals.congestionRisk = clamp(totals.congestionRisk, 12, 100);
  totals.scalability = clamp(totals.scalability, 25, 100);
  totals.labourSensitivity = clamp(totals.labourSensitivity, 8, 100);

  const score = (
    totals.throughput * 0.30
    + totals.scalability * 0.25
    + (100 - totals.costIndex) * 0.20
    + (100 - totals.congestionRisk) * 0.15
    + (100 - totals.labourSensitivity) * 0.10
  );

  return {
    ...totals,
    score
  };
}

function generateAllDesigns() {
  const designs = [];
  STORAGE_OPTIONS.forEach((storageModel) => {
    FULFILMENT_OPTIONS.forEach((fulfilmentLogic) => {
      AUTOMATION_OPTIONS.forEach((automationLevel) => {
        designs.push({ storageModel, fulfilmentLogic, automationLevel });
      });
    });
  });
  return designs;
}

function designEquals(left, right) {
  return left.storageModel === right.storageModel
    && left.fulfilmentLogic === right.fulfilmentLogic
    && left.automationLevel === right.automationLevel;
}

function chooseBestDesign(humanDesign, humanMetrics) {
  const all = generateAllDesigns().map((design) => ({ design, metrics: computeMetrics(design) }));
  all.sort((a, b) => b.metrics.score - a.metrics.score);

  const best = all[0];
  if (best.metrics.score > humanMetrics.score) return best;

  const equalOrBetter = all.filter((entry) => entry.metrics.score >= humanMetrics.score);
  const differentTie = equalOrBetter.find((entry) => !designEquals(entry.design, humanDesign));
  if (differentTie) return differentTie;

  return best;
}

function metricDisplay(metrics) {
  return [
    { key: 'Throughput', value: `${Math.round(700 + metrics.throughput * 9)} / h` },
    { key: 'Cost Index', value: `${metrics.costIndex.toFixed(1)}` },
    { key: 'Congestion Risk', value: `${metrics.congestionRisk.toFixed(1)}%` },
    { key: 'Scalability', value: `${metrics.scalability.toFixed(1)}%` },
    { key: 'Labour Sensitivity', value: `${metrics.labourSensitivity.toFixed(1)}%` }
  ];
}

function createMetricList(root, metrics) {
  root.innerHTML = metricDisplay(metrics)
    .map((item) => `<li><span>${item.key}</span><span data-metric="${item.key}">${item.value}</span></li>`)
    .join('');
}

function animateNumber(element, target, digits = 1, suffix = '') {
  const start = Number(element.dataset.value ?? target);
  const delta = target - start;
  const duration = 340;
  const startTime = performance.now();

  function tick(now) {
    const progress = clamp((now - startTime) / duration, 0, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = start + delta * eased;
    element.textContent = `${value.toFixed(digits)}${suffix}`;

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      element.dataset.value = `${target}`;
    }
  }

  requestAnimationFrame(tick);
}

function updateMetricList(root, metrics) {
  const data = metricDisplay(metrics);
  data.forEach((item) => {
    const valueEl = root.querySelector(`[data-metric="${item.key}"]`);
    if (valueEl) valueEl.textContent = item.value;
  });
}

function updateConfigList(root, design) {
  root.innerHTML = Object.keys(design)
    .map((key) => `<li><span>${LABELS[key]}</span><span>${design[key]}</span></li>`)
    .join('');
}

function createSegmentButtons(root, options, selectedValue, onChange) {
  root.innerHTML = '';
  options.forEach((option) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = option;
    button.classList.toggle('active', option === selectedValue);
    button.setAttribute('aria-pressed', option === selectedValue ? 'true' : 'false');
    button.addEventListener('click', () => onChange(option));
    root.appendChild(button);
  });
}

class WarehouseScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060b12);

    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 250);
    this.camera.position.set(20, 14, 20);
    this.cameraTargetPos = new THREE.Vector3(20, 14, 20);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.36, 0.5, 0.92);
    this.composer.addPass(this.bloom);
    this.vignette = new ShaderPass(VignetteShader);
    this.vignette.uniforms.offset.value = 1.15;
    this.vignette.uniforms.darkness.value = 1.2;
    this.composer.addPass(this.vignette);

    this.clock = new THREE.Clock();
    this.flowSpeed = 0.09;
    this.glowLevel = 0.25;
    this.automationLevel = 0.6;
    this.botPulse = 0;

    this.zoneMaterials = [];
    this.conveyors = [];
    this.particleGroup = [];

    this.setupScene();
    this.animate = this.animate.bind(this);
    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);
    requestAnimationFrame(this.animate);
  }

  setupScene() {
    const hemi = new THREE.HemisphereLight(0xb7cdf7, 0x1a2230, 0.9);
    this.scene.add(hemi);

    const key = new THREE.DirectionalLight(0xe0ecff, 1.15);
    key.position.set(12, 20, 8);
    this.scene.add(key);

    const rim = new THREE.DirectionalLight(0x5e8bc9, 0.7);
    rim.position.set(-14, 10, -10);
    this.scene.add(rim);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(90, 90),
      new THREE.MeshStandardMaterial({ color: 0x0d141f, roughness: 0.95, metalness: 0.1 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.8;
    this.scene.add(floor);

    const zoneData = [
      { x: -10, z: -3, w: 7, d: 7, h: 0.6 },
      { x: 0, z: -6, w: 8, d: 5, h: 0.7 },
      { x: 10, z: -1, w: 6, d: 8, h: 0.65 },
      { x: -4, z: 8, w: 9, d: 5, h: 0.55 },
      { x: 8, z: 8, w: 7, d: 6, h: 0.8 }
    ];

    zoneData.forEach((zone) => {
      const material = new THREE.MeshStandardMaterial({
        color: 0x162435,
        emissive: 0x4f7dc8,
        emissiveIntensity: 0.16,
        roughness: 0.62,
        metalness: 0.28
      });
      this.zoneMaterials.push(material);

      const mesh = new THREE.Mesh(new THREE.BoxGeometry(zone.w, zone.h, zone.d), material);
      mesh.position.set(zone.x, zone.h / 2 - 0.8, zone.z);
      this.scene.add(mesh);
    });

    const conveyorCurves = [
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-14, -0.2, -8),
        new THREE.Vector3(-8, -0.1, -2),
        new THREE.Vector3(-1, -0.05, -4),
        new THREE.Vector3(7, -0.1, 2),
        new THREE.Vector3(14, -0.2, 8)
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-12, -0.15, 10),
        new THREE.Vector3(-5, -0.1, 6),
        new THREE.Vector3(3, -0.08, 8),
        new THREE.Vector3(12, -0.16, 4)
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-10, -0.1, -12),
        new THREE.Vector3(-2, -0.06, -7),
        new THREE.Vector3(8, -0.05, -10),
        new THREE.Vector3(14, -0.1, -6)
      ])
    ];

    conveyorCurves.forEach((curve) => {
      const geo = new THREE.TubeGeometry(curve, 90, 0.13, 8, false);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x3a5f8f,
        emissive: 0x4d88df,
        emissiveIntensity: 0.46,
        roughness: 0.35,
        metalness: 0.75
      });
      const conveyor = new THREE.Mesh(geo, mat);
      this.scene.add(conveyor);
      this.conveyors.push(conveyor);
    });

    const particleCurve = conveyorCurves[0];
    const particleCount = 54;
    const particleGeo = new THREE.SphereGeometry(0.07, 10, 10);
    const particleMat = new THREE.MeshBasicMaterial({ color: 0xa8d0ff });
    for (let i = 0; i < particleCount; i += 1) {
      const mesh = new THREE.Mesh(particleGeo, particleMat);
      const offset = i / particleCount;
      mesh.position.copy(particleCurve.getPointAt(offset));
      this.scene.add(mesh);
      this.particleGroup.push({ mesh, offset, curve: particleCurve });
    }

    this.scene.fog = new THREE.Fog(0x060b12, 26, 70);
  }

  updateFromMetrics(metrics, automationLabel) {
    this.flowSpeed = 0.05 + (metrics.throughput / 100) * 0.22;
    this.glowLevel = 0.12 + (metrics.congestionRisk / 100) * 0.58;

    if (automationLabel === 'Labour Driven') this.automationLevel = 0.35;
    else if (automationLabel === 'Selective Automation') this.automationLevel = 0.68;
    else this.automationLevel = 1;
  }

  onBotUpdate() {
    this.botPulse = 1;
    this.cameraTargetPos.set(20.7, 14.6, 19.1);
  }

  animate() {
    const dt = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();

    const conveyorVisible = Math.max(1, Math.round(this.automationLevel * this.conveyors.length));
    this.conveyors.forEach((conveyor, index) => {
      conveyor.visible = index < conveyorVisible;
      const material = conveyor.material;
      material.emissiveIntensity = 0.24 + this.automationLevel * 0.55;
    });

    this.zoneMaterials.forEach((material, index) => {
      const pulse = 0.06 * Math.sin(elapsed * 2 + index * 0.9);
      material.emissiveIntensity = this.glowLevel + pulse + this.botPulse * 0.6;
    });

    this.particleGroup.forEach((particle, index) => {
      const t = (particle.offset + elapsed * this.flowSpeed * (1 + (index % 5) * 0.05)) % 1;
      particle.mesh.position.copy(particle.curve.getPointAt(t));
    });

    if (this.botPulse > 0) this.botPulse = Math.max(0, this.botPulse - dt * 1.45);

    if (this.botPulse < 0.01) {
      this.cameraTargetPos.set(20, 14, 20);
    }

    this.camera.position.lerp(this.cameraTargetPos, 0.03);
    this.camera.lookAt(0, -0.2, 0);

    this.composer.render();
    requestAnimationFrame(this.animate);
  }

  handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / Math.max(1, height);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.composer.setSize(width, height);
  }
}

function init() {
  const storageRoot = document.getElementById('storage-model');
  const fulfilmentRoot = document.getElementById('fulfilment-logic');
  const automationRoot = document.getElementById('automation-level');

  const humanMetricsRoot = document.getElementById('human-metrics');
  const botMetricsRoot = document.getElementById('bot-metrics');
  const humanScoreEl = document.getElementById('human-score');
  const botScoreEl = document.getElementById('bot-score');
  const botStatusEl = document.getElementById('bot-status');
  const botConfigRoot = document.getElementById('bot-config');
  const resetButton = document.getElementById('wsim-reset');
  const canvas = document.getElementById('wsim-canvas');

  if (!storageRoot || !fulfilmentRoot || !automationRoot || !humanMetricsRoot || !botMetricsRoot || !humanScoreEl || !botScoreEl || !botStatusEl || !botConfigRoot || !resetButton || !canvas) {
    return;
  }

  const scene = new WarehouseScene(canvas);

  let humanDesign = { ...DEFAULT_DESIGN };
  let botDesign = { ...DEFAULT_DESIGN };
  let humanMetrics = computeMetrics(humanDesign);
  let botMetrics = computeMetrics(botDesign);
  let botTimer = null;

  createMetricList(humanMetricsRoot, humanMetrics);
  createMetricList(botMetricsRoot, botMetrics);
  updateConfigList(botConfigRoot, botDesign);

  humanScoreEl.dataset.value = `${humanMetrics.score}`;
  botScoreEl.dataset.value = `${botMetrics.score}`;
  humanScoreEl.textContent = humanMetrics.score.toFixed(1);
  botScoreEl.textContent = botMetrics.score.toFixed(1);

  function syncButtons(root, value) {
    root.querySelectorAll('button').forEach((button) => {
      const active = button.textContent === value;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function renderChoices() {
    createSegmentButtons(storageRoot, STORAGE_OPTIONS, humanDesign.storageModel, (next) => {
      humanDesign.storageModel = next;
      syncButtons(storageRoot, next);
      handleHumanChange();
    });

    createSegmentButtons(fulfilmentRoot, FULFILMENT_OPTIONS, humanDesign.fulfilmentLogic, (next) => {
      humanDesign.fulfilmentLogic = next;
      syncButtons(fulfilmentRoot, next);
      handleHumanChange();
    });

    createSegmentButtons(automationRoot, AUTOMATION_OPTIONS, humanDesign.automationLevel, (next) => {
      humanDesign.automationLevel = next;
      syncButtons(automationRoot, next);
      handleHumanChange();
    });
  }

  function updateHumanUI() {
    humanMetrics = computeMetrics(humanDesign);
    updateMetricList(humanMetricsRoot, humanMetrics);
    animateNumber(humanScoreEl, humanMetrics.score, 1);
    scene.updateFromMetrics(humanMetrics, humanDesign.automationLevel);
  }

  function updateBotUI() {
    updateConfigList(botConfigRoot, botDesign);
    updateMetricList(botMetricsRoot, botMetrics);
    animateNumber(botScoreEl, botMetrics.score, 1);
    scene.onBotUpdate();
  }

  function runBotEvaluation() {
    botStatusEl.textContent = 'Evaluating';
    botStatusEl.classList.add('is-thinking');

    if (botTimer) window.clearTimeout(botTimer);
    botTimer = window.setTimeout(() => {
      const best = chooseBestDesign(humanDesign, humanMetrics);
      botDesign = { ...best.design };
      botMetrics = best.metrics;
      updateBotUI();
      botStatusEl.classList.remove('is-thinking');
      botStatusEl.textContent = `Resolved · ${botMetrics.score.toFixed(1)} index`;
    }, 600);
  }

  function handleHumanChange() {
    updateHumanUI();
    runBotEvaluation();
  }

  resetButton.addEventListener('click', () => {
    humanDesign = { ...DEFAULT_DESIGN };
    botDesign = { ...DEFAULT_DESIGN };
    botMetrics = computeMetrics(botDesign);
    renderChoices();
    updateHumanUI();
    updateBotUI();
    runBotEvaluation();
  });

  renderChoices();
  updateHumanUI();
  updateBotUI();
  runBotEvaluation();
}

window.addEventListener('DOMContentLoaded', init);
