"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/animations/gsap";
import { MOTION_CONFIG } from "@/lib/animations/motionConfig";

type SceneState = { opacity: number; particleMorph: number; intensity: number; cameraProgress: number };

const vertexShader = `
attribute vec3 aPosition;
attribute vec3 aTarget;
attribute vec3 aColor;
attribute vec3 aLightColor;
attribute float aSize;
attribute float aStarSize;
attribute float aStarType;
attribute float aTwinkle;
uniform float uMorph;
uniform float uVelocity;
uniform float uStructure;
uniform float uCamera;
uniform float uTime;
uniform vec2 uMouse;
uniform vec2 uResolution;
uniform float uInteractive;
uniform float uPointerActive;
uniform float uOpacity;
uniform float uLightTheme;
varying vec3 vColor;
varying float vAlpha;
varying float vCore;
varying vec3 vCoreColor;
varying float vStarShape;
varying float vTwinkle;
varying float vLine;
void main() {
  float d = clamp(uMorph, 0.0, 1.0);
  float aspect = uResolution.x / max(1.0, uResolution.y);
  float mobile = 1.0 - step(0.72, aspect);
  vec3 p = mix(aPosition, aTarget, d);
  p += vec3(
    sin(uTime * 0.20 + aPosition.y * 3.0),
    cos(uTime * 0.17 + aPosition.x * 3.0),
    sin(uTime * 0.16 + aPosition.z * 4.0)
  ) * 0.006;
  float yaw = uTime * 0.055 + uCamera * 0.10 + uMouse.x * 0.16 * uInteractive + uVelocity * 0.025;
  float pitch = sin(uTime * 0.13) * 0.035 - uMouse.y * 0.11 * uInteractive;
  float cy = cos(yaw), sy = sin(yaw);
  p.xz = mat2(cy, -sy, sy, cy) * p.xz;
  float cx = cos(pitch), sx = sin(pitch);
  p.yz = mat2(cx, -sx, sx, cx) * p.yz;

  // Preserve a round, sculptural footprint in pixel space while placing it
  // decisively to the right of the hero copy. On narrow screens it sits low.
  p.x *= 1.0 / max(aspect, 0.35);
  vec2 center = vec2(mix(0.60, 0.0, mobile), mix(0.0, -0.48, mobile));
  vec2 size = mix(vec2(1.0), vec2(0.72), mobile);
  p.xy = p.xy * size + center;
  float perspective = 1.0 / (1.0 + p.z * 0.22);
  vec2 sculpturePosition = p.xy * perspective;
  vec2 scenePosition = sculpturePosition;

  // A small local push gives the pointer a tangible effect without deforming
  // the complete sculpture or its morphed formations.
  vec2 mouseDelta = scenePosition - uMouse;
  float mouseFalloff = 1.0 - smoothstep(0.015, 0.20, length(mouseDelta));
  scenePosition += normalize(mouseDelta + vec2(0.00001)) * mouseFalloff * 0.045 * uInteractive * uPointerActive;
  gl_Position = vec4(scenePosition, -p.z * 0.18, 1.0);
  gl_PointSize = mix(aSize, aStarSize, d) * (1.0 + p.z * 0.22);
  vColor = mix(aColor, aLightColor, uLightTheme);
  vCore = smoothstep(2.0, 6.0, aSize);
  vCoreColor = mix(vec3(0.72, 1.0, 0.98), vec3(0.025, 0.25, 0.24), uLightTheme);
  vStarShape = aStarType;
  vTwinkle = aTwinkle;
  vLine = 1.0 - step(0.5, aSize);
  float mobileAlpha = mix(0.56, 0.34, mobile);
  float lightAlpha = mix(1.05, 0.68, mobile);
  mobileAlpha = mix(mobileAlpha, lightAlpha, uLightTheme);
  float themeAlpha = mix(1.0, 1.4, uLightTheme);
  float twinkle = 0.68 + 0.32 * sin(uTime * (1.2 + aTwinkle * 2.4) + aPosition.x * 41.0 + aPosition.y * 29.0);
  float structureAlpha = (0.76 + 0.12 * sin(uTime * 0.5 + aPosition.x * 8.0 + aPosition.z * 5.0));
  float starAlpha = mix(1.0, twinkle, d * (0.3 + aTwinkle * 0.7));
  vAlpha = mix(structureAlpha, starAlpha, d) * uOpacity * mobileAlpha * themeAlpha * mix(1.0, uStructure, vLine);
}`;

const fragmentShader = `
precision mediump float;
varying vec3 vColor;
varying float vAlpha;
varying float vCore;
varying vec3 vCoreColor;
varying float vStarShape;
varying float vTwinkle;
varying float vLine;
void main() {
  vec2 uv = gl_PointCoord * 2.0 - 1.0;
  float r = length(uv);
  float circle = 1.0 - smoothstep(0.58, 1.0, r);
  float crossRay = max(
    (1.0 - smoothstep(0.035, 0.16, abs(uv.x))) * (1.0 - smoothstep(0.18, 1.0, abs(uv.y))),
    (1.0 - smoothstep(0.035, 0.16, abs(uv.y))) * (1.0 - smoothstep(0.18, 1.0, abs(uv.x)))
  );
  float diamond = 1.0 - smoothstep(0.68, 1.0, abs(uv.x) + abs(uv.y));
  float starMask = mix(circle, diamond, smoothstep(0.78, 0.84, vStarShape));
  starMask = mix(starMask, max(starMask, crossRay), smoothstep(0.95, 0.99, vStarShape));
  float mask = mix(circle, starMask, 1.0 - vLine);
  float core = (1.0 - smoothstep(0.0, 0.72, r)) * vCore;
  float alpha = mask * vAlpha * (0.66 + core * 0.34);
  if (alpha < 0.025) discard;
  gl_FragColor = vec4(mix(vColor, vCoreColor, core * 0.22), alpha);
}`;

function randomFactory(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

const DARK_PALETTE = [
  [0.133, 0.722, 0.667], // teal
  [0.384, 0.835, 0.773], // secondary teal
  [0.843, 0.91, 0.859], // a few pale signal points
  [0.184, 0.604, 0.588], // blue-green
  [0.357, 0.78, 0.749], // turquoise highlight
  [0.663, 0.725, 0.667], // sage
];
const LIGHT_PALETTE = [
  [0.024, 0.427, 0.404], // deep teal
  [0.09, 0.50, 0.47], // blue-green
  [0.12, 0.34, 0.39], // deep petrol
  [0.18, 0.56, 0.54], // controlled turquoise
  [0.08, 0.29, 0.32], // charcoal teal
  [0.22, 0.47, 0.45], // muted blue-green
];

type Vec3 = [number, number, number];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const normalize = (a: Vec3): Vec3 => {
  const length = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / length, a[1] / length, a[2] / length];
};

/** Five phase-shifted trefoil ribbons braid around one shared central volume. */
function ribbonCenter(ribbon: number, t: number): Vec3 {
  const theta = t * Math.PI * 2;
  const phase = (ribbon / 5) * Math.PI * 2;
  const minor = theta * 3 + phase;
  const major = theta * 2 + phase * 0.42;
  const radius = 0.29 + 0.095 * Math.cos(minor);
  const point: Vec3 = [
    radius * Math.cos(major),
    radius * Math.sin(major),
    0.17 * Math.sin(minor) + 0.035 * Math.sin(theta + phase),
  ];

  // Slightly tilt each loop around the core to build a deep, braided silhouette.
  const tilt = (ribbon - 2) * 0.12;
  const cy = Math.cos(tilt), sy = Math.sin(tilt);
  return [point[0], point[1] * cy - point[2] * sy, point[1] * sy + point[2] * cy];
}

function ribbonPoint(ribbon: number, t: number, across: number): Vec3 {
  const center = ribbonCenter(ribbon, t);
  const before = ribbonCenter(ribbon, t - 0.001);
  const after = ribbonCenter(ribbon, t + 0.001);
  const tangent = normalize([after[0] - before[0], after[1] - before[1], after[2] - before[2]]);
  const radial = normalize(center);
  const side = normalize(cross(tangent, radial));
  const width = 0.043 * across;
  const lifted = 0.009 * (1 - across * across);
  return [
    (center[0] + side[0] * width + radial[0] * lifted) * 1.16,
    (center[1] + side[1] * width + radial[1] * lifted) * 1.16,
    (center[2] + side[2] * width + radial[2] * lifted) * 1.16,
  ];
}

function makeGeometry(count: number) {
  const random = randomFactory(491_027);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const lightColors = new Float32Array(count * 3);
  const scatter = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const starSizes = new Float32Array(count);
  const starTypes = new Float32Array(count);
  const twinkles = new Float32Array(count);
  const ribbonCount = 5;
  const acrossCount = 15;
  const perRibbon = Math.ceil(count / ribbonCount);
  const alongCount = Math.ceil(perRibbon / acrossCount);

  for (let i = 0; i < count; i++) {
    const ribbon = Math.floor(i / perRibbon);
    const withinRibbon = i % perRibbon;
    const row = withinRibbon % acrossCount;
    const column = Math.floor(withinRibbon / acrossCount);
    const across = ((row / (acrossCount - 1)) * 2 - 1) * (0.9 + random() * 0.1);
    const t = (column + random() * 0.42) / alongCount;
    const point = ribbonPoint(ribbon, t, across);
    const jitter = 0.0018 + random() * 0.0032;
    const a = random() * Math.PI * 2;
    const index = i * 3;
    positions[index] = point[0] + Math.cos(a) * jitter;
    positions[index + 1] = point[1] + Math.sin(a) * jitter;
    positions[index + 2] = point[2] + (random() - 0.5) * jitter * 1.7;
    // Stable screen-wide destinations make reverse scroll reconstruct the ribbons.
    scatter[index] = random() * 1.92 - 0.96;
    scatter[index + 1] = random() * 1.84 - 0.92;
    scatter[index + 2] = random() * 1.2 - 0.6;

    const colorRoll = random();
    // Teal and turquoise traces dominate, with a few pale signal points.
    const colorIndex = colorRoll < 0.60 ? 0 : colorRoll < 0.87 ? 1 : colorRoll < 0.94 ? 2 : colorRoll < 0.975 ? 3 : colorRoll < 0.985 ? 4 : 5;
    const color = DARK_PALETTE[colorIndex];
    const lightColor = LIGHT_PALETTE[colorIndex];
    const brightness = 0.68 + random() * 0.38;
    colors[index] = Math.min(1, color[0] * brightness);
    colors[index + 1] = Math.min(1, color[1] * brightness);
    colors[index + 2] = Math.min(1, color[2] * brightness);
    lightColors[index] = Math.min(1, lightColor[0] * brightness);
    lightColors[index + 1] = Math.min(1, lightColor[1] * brightness);
    lightColors[index + 2] = Math.min(1, lightColor[2] * brightness);
    sizes[i] = random() < 0.024 ? 3.1 + random() * 1.5 : 1.25 + random() * 0.85;
    starSizes[i] = random() < 0.035 ? 4.0 + random() * 3.0 : 1.1 + random() * 1.45;
    starTypes[i] = random();
    twinkles[i] = random();
  }

  // Fine longitudinal filaments trace each ribbon. Sparse cross-lines describe
  // the woven surface without turning the sculpture into a network graph.
  const linePositions: number[] = [];
  const lineColors: number[] = [];
  const lineLightColors: number[] = [];
  const addLine = (a: Vec3, b: Vec3, weight: number, color: number[]) => {
    linePositions.push(...a, ...b);
    lineColors.push(color[0] * weight, color[1] * weight, color[2] * weight, color[0] * weight, color[1] * weight, color[2] * weight);
    const light = [0.024, 0.427, 0.404];
    const lightWeight = Math.min(1, 0.65 + weight * 1.5);
    lineLightColors.push(light[0] * lightWeight, light[1] * lightWeight, light[2] * lightWeight, light[0] * lightWeight, light[1] * lightWeight, light[2] * lightWeight);
  };
  const samples = 220;
  for (let ribbon = 0; ribbon < ribbonCount; ribbon++) {
    for (const across of [-0.92, 0, 0.92]) {
      const weight = across === 0 ? 0.16 : 0.23;
      for (let step = 0; step < samples; step++) {
        addLine(ribbonPoint(ribbon, step / samples, across), ribbonPoint(ribbon, (step + 1) / samples, across), weight, [0.133, 0.722, 0.667]);
      }
    }
    for (let step = 0; step < samples; step += 22) {
      addLine(ribbonPoint(ribbon, step / samples, -0.92), ribbonPoint(ribbon, step / samples, 0.92), 0.07, [0.22, 0.78, 0.72]);
    }
  }

  return {
    positions,
    colors,
    lightColors,
    scatter,
    sizes,
    starSizes,
    starTypes,
    twinkles,
    linePositions: new Float32Array(linePositions),
    lineColors: new Float32Array(lineColors),
    lineLightColors: new Float32Array(lineLightColors),
  };
}

function makeFormations(count: number, base: Float32Array): Float32Array[] {
  const network = new Float32Array(count * 3);
  const grid = new Float32Array(count * 3);
  const project = new Float32Array(count * 3);
  const text = new Float32Array(count * 3);
  const random = randomFactory(20261111);
  const sampledText: Vec3[] = [];
  if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    canvas.width = 1024; canvas.height = 280;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "#fff";
      context.font = "700 174px Arial, sans-serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText("SAHITH.exe", canvas.width / 2, canvas.height / 2, 980);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      for (let y = 0; y < canvas.height; y += 3) for (let x = 0; x < canvas.width; x += 3) {
        if (pixels[(y * canvas.width + x) * 4 + 3] > 128) sampledText.push([(x / canvas.width - 0.5) * 1.25, (0.5 - y / canvas.height) * 0.5, (random() - 0.5) * 0.025]);
      }
    }
  }
  for (let i = 0; i < count; i++) {
    const k = i * 3;
    const y = 1 - 2 * ((i + 0.5) / count);
    const angle = i * 2.399963229728653;
    const radius = Math.sqrt(Math.max(0, 1 - y * y));
    network[k] = radius * Math.cos(angle) * 0.67;
    network[k + 1] = y * 0.67;
    network[k + 2] = radius * Math.sin(angle) * 0.48;

    const gx = (i % 80) / 79 - 0.5;
    const gy = (Math.floor(i / 80) % 80) / 79 - 0.5;
    const layer = Math.floor(i / 6400);
    grid[k] = gx * 1.35;
    grid[k + 1] = gy * 1.35;
    grid[k + 2] = (layer - 0.5) * 0.34 + Math.sin(i * 0.19) * 0.025;

    // Three linked technical columns with cross braces: an abstract systems structure.
    const column = i % 3;
    const phase = Math.floor(i / 3) / Math.ceil(count / 3);
    const a = phase * Math.PI * 2;
    const centers = [-0.42, 0, 0.42];
    const r = 0.12 + (column === 1 ? 0.1 : 0);
    project[k] = centers[column] + Math.cos(a) * r;
    project[k + 1] = phase * 0.96 - 0.48;
    project[k + 2] = Math.sin(a) * r * 0.62 + (column - 1) * 0.04;

    const point = sampledText.length ? sampledText[(i * 97) % sampledText.length] : [base[k], base[k + 1], base[k + 2]] as Vec3;
    text[k] = point[0]; text[k + 1] = point[1]; text[k + 2] = point[2];
  }
  return [base, network, grid, project, text];
}

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Could not create sculpture shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || "Sculpture shader compilation failed";
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

function drawFallback(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  canvas.width = Math.max(1, Math.round(width * dpr));
  canvas.height = Math.max(1, Math.round(height * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  const light = document.documentElement.dataset.theme === "light";
  const centerX = width * (width < height ? 0.5 : 0.80);
  const centerY = height * (width < height ? 0.76 : 0.5);
  const scale = Math.min(width, height) * (width < height ? 0.62 : 0.46);
  ctx.lineWidth = Math.max(0.7, scale * 0.002);
  ctx.strokeStyle = light ? "rgba(6,109,103,.14)" : "rgba(34,184,170,.17)";
  for (let ribbon = 0; ribbon < 5; ribbon++) {
    for (const across of [-0.92, 0, 0.92]) {
      ctx.beginPath();
      for (let step = 0; step <= 180; step++) {
        const p = ribbonPoint(ribbon, step / 180, across);
        const x = centerX + p[0] * scale;
        const y = centerY - p[1] * scale;
        if (!step) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
  const particles = makeGeometry(width < 768 ? 700 : 1400);
  for (let i = 0; i < particles.sizes.length; i++) {
    const k = i * 3;
    const x = centerX + particles.positions[k] * scale;
    const y = centerY - particles.positions[k + 1] * scale;
    const palette = light ? particles.lightColors : particles.colors;
    const color = `${Math.round(palette[k] * 255)},${Math.round(palette[k + 1] * 255)},${Math.round(palette[k + 2] * 255)}`;
    const opacity = (particles.sizes[i] > 4 ? 0.82 : 0.56) * (light ? 0.82 : 1);
    ctx.fillStyle = `rgba(${color},${opacity})`;
    ctx.beginPath();
    ctx.arc(x, y, Math.max(0.75, particles.sizes[i] * 0.55), 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Persistent GPU signal sculpture, replacing the former anatomical point cloud. */
export default function SignalSculpture({ state, reducedMotion }: { state: SceneState; reducedMotion: boolean }) {
  const webglCanvas = useRef<HTMLCanvasElement>(null);
  const fallbackCanvas = useRef<HTMLCanvasElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = webglCanvas.current;
    const fallback = fallbackCanvas.current;
    if (!canvas || !fallback) return;
    drawFallback(fallback);

    let gl: WebGLRenderingContext | null = null;
    let program: WebGLProgram | null = null;
    let buffers: WebGLBuffer[] = [];
    let visible = true;
    let tickerAttached = false;
    let disposed = false;
    let lastFrame = 0;
    let smoothMouse = { x: 0, y: 0 };
      let pointerActive = false;
    const started = performance.now();

    try {
      gl = canvas.getContext("webgl", {
        alpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        powerPreference: "high-performance",
      });
      if (!gl) throw new Error("WebGL unavailable");
      const vs = compile(gl, gl.VERTEX_SHADER, vertexShader);
      const fs = compile(gl, gl.FRAGMENT_SHADER, fragmentShader);
      program = gl.createProgram();
      if (!program) throw new Error("Could not create sculpture program");
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program) || "Sculpture program link failed");
      }

      const lowPower = window.innerWidth < 768 || (navigator as Navigator & { deviceMemory?: number }).deviceMemory === 2;
      const geometry = makeGeometry(lowPower ? 2200 : 9000);
      const formations = makeFormations(geometry.sizes.length, geometry.positions);
      let currentBase = new Float32Array(geometry.positions);
      let activeStage = 0;
      let currentTarget = formations[0];
      let transitionStarted = performance.now();
      const attribute = {
        position: gl.getAttribLocation(program, "aPosition"),
        color: gl.getAttribLocation(program, "aColor"),
        lightColor: gl.getAttribLocation(program, "aLightColor"),
        target: gl.getAttribLocation(program, "aTarget"),
        size: gl.getAttribLocation(program, "aSize"),
        starSize: gl.getAttribLocation(program, "aStarSize"),
        starType: gl.getAttribLocation(program, "aStarType"),
        twinkle: gl.getAttribLocation(program, "aTwinkle"),
      };
      const uniform = {
        morph: gl.getUniformLocation(program, "uMorph"),
        velocity: gl.getUniformLocation(program, "uVelocity"),
        structure: gl.getUniformLocation(program, "uStructure"),
        camera: gl.getUniformLocation(program, "uCamera"),
        time: gl.getUniformLocation(program, "uTime"),
        mouse: gl.getUniformLocation(program, "uMouse"),
        resolution: gl.getUniformLocation(program, "uResolution"),
        interactive: gl.getUniformLocation(program, "uInteractive"),
        pointerActive: gl.getUniformLocation(program, "uPointerActive"),
        opacity: gl.getUniformLocation(program, "uOpacity"),
        light: gl.getUniformLocation(program, "uLightTheme"),
      };
      gl.useProgram(program);

      let contextLost = false;
      const pointBuffers = {
        position: gl.createBuffer(),
        color: gl.createBuffer(),
        lightColor: gl.createBuffer(),
        target: gl.createBuffer(),
        size: gl.createBuffer(),
        starSize: gl.createBuffer(),
        starType: gl.createBuffer(),
        twinkle: gl.createBuffer(),
      };
      const lineBuffers = { position: gl.createBuffer(), color: gl.createBuffer(), lightColor: gl.createBuffer() };
      [...Object.values(pointBuffers), ...Object.values(lineBuffers)].forEach((buffer) => {
        if (!buffer) throw new Error("Could not create sculpture buffer");
        buffers.push(buffer);
      });
      const upload = (buffer: WebGLBuffer, data: Float32Array) => {
        gl!.bindBuffer(gl!.ARRAY_BUFFER, buffer);
        gl!.bufferData(gl!.ARRAY_BUFFER, data, gl!.STATIC_DRAW);
      };
      upload(pointBuffers.position!, geometry.positions);
      upload(pointBuffers.color!, geometry.colors);
      upload(pointBuffers.lightColor!, geometry.lightColors);
      upload(pointBuffers.target!, currentTarget);
      upload(pointBuffers.size!, geometry.sizes);
      upload(pointBuffers.starSize!, geometry.starSizes);
      upload(pointBuffers.starType!, geometry.starTypes);
      upload(pointBuffers.twinkle!, geometry.twinkles);
      upload(lineBuffers.position!, geometry.linePositions);
      upload(lineBuffers.color!, geometry.lineColors);
      upload(lineBuffers.lightColor!, geometry.lineLightColors);

      const resize = () => {
        if (!gl || !canvas) return;
        const dpr = Math.min(window.devicePixelRatio || 1, lowPower ? 1.15 : 1.5);
        const width = Math.max(1, Math.round(canvas.clientWidth * dpr));
        const height = Math.max(1, Math.round(canvas.clientHeight * dpr));
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }
        gl.viewport(0, 0, width, height);
      };
      const observer = new ResizeObserver(resize);
      observer.observe(canvas);
      resize();

      const bindAttribute = (buffer: WebGLBuffer, location: number, size: number) => {
        gl!.bindBuffer(gl!.ARRAY_BUFFER, buffer);
        gl!.enableVertexAttribArray(location);
        gl!.vertexAttribPointer(location, size, gl!.FLOAT, false, 0, 0);
      };
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0, 0, 0, 0);

      const render = (now: number) => {
        if (disposed || contextLost || !gl || !program || !visible) return;
        const frameInterval = lowPower ? 32 : 20;
        if (now - lastFrame < frameInterval && !reducedMotion) return;
        lastFrame = now;
        smoothMouse.x += (mouse.current.x - smoothMouse.x) * 0.045;
        smoothMouse.y += (mouse.current.y - smoothMouse.y) * 0.045;
        gl.useProgram(program);
        gl.clear(gl.COLOR_BUFFER_BIT);
        const desiredStage = Math.max(0, Math.min(formations.length - 1, Math.round(state.particleMorph || 0)));
        if (desiredStage !== activeStage) {
          const previousProgress = Math.max(0, Math.min(1, (now - transitionStarted) / MOTION_CONFIG.particleMorphDurationMs));
          for (let i = 0; i < currentBase.length; i++) currentBase[i] += (currentTarget[i] - currentBase[i]) * previousProgress;
          upload(pointBuffers.position!, currentBase);
          activeStage = desiredStage;
          currentTarget = formations[activeStage];
          upload(pointBuffers.target!, currentTarget);
          transitionStarted = now;
        }
        const morphProgress = reducedMotion ? 1 : Math.min(1, (now - transitionStarted) / MOTION_CONFIG.particleMorphDurationMs);
        if (uniform.morph) gl.uniform1f(uniform.morph, morphProgress);
        if (uniform.velocity) gl.uniform1f(uniform.velocity, state.intensity || 0);
        if (uniform.structure) gl.uniform1f(uniform.structure, activeStage === 0 ? 1 : 0.12);
        if (uniform.camera) gl.uniform1f(uniform.camera, state.cameraProgress || 0);
        if (uniform.time) gl.uniform1f(uniform.time, reducedMotion ? 0 : (now - started) / 1000);
        if (uniform.mouse) gl.uniform2f(uniform.mouse, smoothMouse.x, smoothMouse.y);
        if (uniform.resolution) gl.uniform2f(uniform.resolution, canvas.width, canvas.height);
        if (uniform.interactive) gl.uniform1f(uniform.interactive, reducedMotion || lowPower ? 0 : 1);
        if (uniform.pointerActive) gl.uniform1f(uniform.pointerActive, pointerActive ? 1 : 0);
        if (uniform.opacity) gl.uniform1f(uniform.opacity, state.opacity);
        if (uniform.light) gl.uniform1f(uniform.light, document.documentElement.dataset.theme === "light" ? 1 : 0);

        bindAttribute(lineBuffers.position!, attribute.position, 3);
        bindAttribute(lineBuffers.position!, attribute.target, 3);
        bindAttribute(lineBuffers.color!, attribute.color, 3);
        bindAttribute(lineBuffers.lightColor!, attribute.lightColor, 3);
        [attribute.starSize, attribute.starType, attribute.twinkle].forEach((location) => gl!.disableVertexAttribArray(location));
        gl.disableVertexAttribArray(attribute.size);
        gl.vertexAttrib1f(attribute.size, 0.0);
        gl.vertexAttrib1f(attribute.starSize, 1.0);
        gl.vertexAttrib1f(attribute.starType, 0.0);
        gl.vertexAttrib1f(attribute.twinkle, 0.0);
        gl.lineWidth(1);
        gl.drawArrays(gl.LINES, 0, geometry.linePositions.length / 3);

        bindAttribute(pointBuffers.position!, attribute.position, 3);
        bindAttribute(pointBuffers.color!, attribute.color, 3);
        bindAttribute(pointBuffers.lightColor!, attribute.lightColor, 3);
        bindAttribute(pointBuffers.target!, attribute.target, 3);
        bindAttribute(pointBuffers.size!, attribute.size, 1);
        bindAttribute(pointBuffers.starSize!, attribute.starSize, 1);
        bindAttribute(pointBuffers.starType!, attribute.starType, 1);
        bindAttribute(pointBuffers.twinkle!, attribute.twinkle, 1);
        gl.drawArrays(gl.POINTS, 0, geometry.sizes.length);
      };
      const onTicker = (time: number) => render(time * 1000);
      const onReducedMotionUpdate = () => { if (reducedMotion) render(performance.now()); };
      if (reducedMotion) window.addEventListener("portfolio:motion-update", onReducedMotionUpdate);
      const startTicker = () => {
        if (!tickerAttached && !reducedMotion) {
          gsap.ticker.add(onTicker);
          tickerAttached = true;
        }
      };
      const stopTicker = () => {
        if (tickerAttached) {
          gsap.ticker.remove(onTicker);
          tickerAttached = false;
        }
      };

      const intersection = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible) startTicker();
        else stopTicker();
      }, { rootMargin: "120px" });
      if (root.current) intersection.observe(root.current);

      const onContextLost = (event: Event) => {
        event.preventDefault();
        contextLost = true;
        stopTicker();
        window.removeEventListener("portfolio:motion-update", onReducedMotionUpdate);
        canvas.style.opacity = "0";
        fallback.style.opacity = "1";
      };
      canvas.addEventListener("webglcontextlost", onContextLost);

      const onPointerMove = (event: PointerEvent) => {
        if (event.pointerType === "touch") return;
        mouse.current.x = (event.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
        mouse.current.y = 1 - (event.clientY / Math.max(1, window.innerHeight)) * 2;
        pointerActive = true;
      };
      const onPointerLeave = () => { mouse.current.x = 0; mouse.current.y = 0; pointerActive = false; };
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("pointerleave", onPointerLeave);
      window.addEventListener("blur", onPointerLeave);
      if (reducedMotion) render(performance.now());
      else if (visible) startTicker();

      return () => {
        disposed = true;
        observer.disconnect();
        intersection.disconnect();
        canvas.removeEventListener("webglcontextlost", onContextLost);
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerleave", onPointerLeave);
        window.removeEventListener("blur", onPointerLeave);
        stopTicker();
        if (gl) {
          buffers.forEach((buffer) => gl?.deleteBuffer(buffer));
          if (program) gl.deleteProgram(program);
        }
      };
    } catch {
      if (gl) buffers.forEach((buffer) => gl?.deleteBuffer(buffer));
      if (gl && program) gl.deleteProgram(program);
      canvas.style.opacity = "0";
      fallback.style.opacity = "1";
    }
  }, [reducedMotion, state]);

  useEffect(() => {
    const fallback = fallbackCanvas.current;
    if (!fallback) return;
    const redraw = () => drawFallback(fallback);
    const observer = new MutationObserver(redraw);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    window.addEventListener("resize", redraw, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", redraw);
    };
  }, []);

  return (
    <div ref={root} className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
      <canvas ref={fallbackCanvas} className="absolute inset-0 h-full w-full opacity-0" />
      <canvas ref={webglCanvas} className="absolute inset-0 h-full w-full pointer-events-none transition-opacity duration-300" />
    </div>
  );
}
