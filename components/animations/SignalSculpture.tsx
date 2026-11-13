"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "@/lib/animations/gsap";

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
varying float vDepth;
void main() {
  float d = clamp(uMorph, 0.0, 1.0);
  float aspect = uResolution.x / max(1.0, uResolution.y);
  float mobile = 1.0 - step(0.72, aspect);
  vec3 p = mix(aPosition, aTarget, d);
  float particlePhase = uTime * (0.34 + aTwinkle * 0.18) + aTwinkle * 6.28318;
  p += vec3(sin(particlePhase), cos(particlePhase * 0.87), sin(particlePhase * 0.71))
    * (0.0014 + aTwinkle * 0.0011 + uVelocity * 0.0005);
  float yaw = uTime * 0.009 + uCamera * 0.025 + uVelocity * 0.003;
  float pitch = sin(uTime * 0.08) * 0.012;
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

  // Local repulsion and a faint ripple leave the rest of the portrait anchored.
  vec2 mouseDelta = scenePosition - uMouse;
  float mouseDistance = length(mouseDelta);
  float mouseFalloff = 1.0 - smoothstep(0.008, 0.095, mouseDistance);
  float ripple = sin(mouseDistance * 92.0 - uTime * 2.2) * exp(-mouseDistance * 26.0) * 0.0025;
  float repulsion = mouseFalloff * 0.017 + ripple;
  scenePosition += normalize(mouseDelta + vec2(0.00001, 0.0)) * repulsion * uInteractive * uPointerActive;
  gl_Position = vec4(scenePosition, -p.z * 0.18, 1.0);
  gl_PointSize = mix(aSize, aStarSize, d) * (1.0 + p.z * 0.22) * mix(1.0, 1.45, uLightTheme);
  vColor = mix(aColor, aLightColor, uLightTheme);
  vDepth = clamp(0.84 + p.z * 0.32, 0.62, 1.08);
  vCore = smoothstep(2.0, 3.6, aSize);
  vCoreColor = mix(vec3(0.72, 1.0, 0.98), vec3(0.025, 0.25, 0.24), uLightTheme);
  vStarShape = aStarType;
  vTwinkle = aTwinkle;
  float mobileAlpha = mix(0.92, 0.78, mobile);
  float lightAlpha = mix(1.0, 0.88, mobile);
  mobileAlpha = mix(mobileAlpha, lightAlpha, uLightTheme);
  float themeAlpha = mix(1.0, 1.75, uLightTheme);
  float twinkle = 0.78 + 0.22 * sin(uTime * (0.55 + aTwinkle * 0.5) + aTwinkle * 6.28318);
  float structureAlpha = (0.88 + 0.07 * sin(uTime * 0.28 + aTwinkle * 6.28318));
  float starAlpha = mix(1.0, twinkle, d * (0.3 + aTwinkle * 0.7));
  float particleVisibility = 0.86 + aTwinkle * 0.08 + vCore * 0.12;
  vAlpha = mix(structureAlpha, starAlpha, d) * uOpacity * mobileAlpha * themeAlpha * particleVisibility;
}`;

const fragmentShader = `
precision mediump float;
varying vec3 vColor;
varying float vAlpha;
varying float vCore;
varying vec3 vCoreColor;
varying float vStarShape;
varying float vTwinkle;
varying float vDepth;
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
  float mask = starMask;
  float core = (1.0 - smoothstep(0.0, 0.72, r)) * vCore;
  float baseAlpha = mask * vAlpha * vDepth * (0.66 + core * 0.34);
  float halo = exp(-r * r * 4.2) * vCore * vAlpha * 0.18;
  float alpha = 1.0 - (1.0 - baseAlpha) * (1.0 - halo);
  if (alpha < 0.025) discard;
  gl_FragColor = vec4(mix(vColor * vDepth, vCoreColor, core * 0.38 + halo * 0.45), alpha);
}`;

function randomFactory(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

async function loadPortraitSamples(): Promise<Float32Array> {
  const image = new Image();
  image.src = "/images/portrait-cutout-v2.png";
  await image.decode();

  const canvas = document.createElement("canvas");
  canvas.width = 234;
  canvas.height = 338;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Could not sample portrait image");
  // Keep the head, neck and shoulders in frame while dropping the phone and
  // lower torso, which gives facial detail more room in the hero composition.
  context.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight * 0.70, 0, 0, canvas.width, canvas.height);
  const { data } = context.getImageData(0, 0, canvas.width, canvas.height);

  let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      if (data[(y * canvas.width + x) * 4 + 3] > 32) {
        minX = Math.min(minX, x); minY = Math.min(minY, y);
        maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
      }
    }
  }
  const subjectWidth = maxX - minX + 1;
  const subjectHeight = maxY - minY + 1;
  const subjectAspect = subjectWidth / subjectHeight;

  const samples: number[] = [];
  for (let y = 0; y < canvas.height; y += 2) {
    for (let x = 0; x < canvas.width; x += 2) {
      const k = (y * canvas.width + x) * 4;
      const r = data[k], g = data[k + 1], b = data[k + 2];
      if (data[k + 3] < 48) continue;
      const normalizedX = (x - minX) / Math.max(1, subjectWidth - 1);
      const normalizedY = (y - minY) / Math.max(1, subjectHeight - 1);
      const right = (y * canvas.width + Math.min(canvas.width - 1, x + 2)) * 4;
      const below = (Math.min(canvas.height - 1, y + 2) * canvas.width + x) * 4;
      const edge = Math.min(1, (
        Math.abs(r - data[right]) + Math.abs(g - data[right + 1]) + Math.abs(b - data[right + 2]) +
        Math.abs(r - data[below]) + Math.abs(g - data[below + 1]) + Math.abs(b - data[below + 2])
      ) / 900);
      // The sampling image is cropped to 70% height, so these normalized
      // regions cover the complete face through the chin and jaw.
      const faceRegion = normalizedY > 0.15 && normalizedY < 0.72 && normalizedX > 0.20 && normalizedX < 0.80;
      const facialCore = normalizedY > 0.20 && normalizedY < 0.59 && normalizedX > 0.30 && normalizedX < 0.74;
      const importance = Math.min(1, (facialCore ? 0.48 : faceRegion ? 0.28 : 0.04) + edge * 2.45);
      const sample = [
        (normalizedX - 0.5) * 1.5 * subjectAspect,
        (0.5 - normalizedY) * 1.5,
        ((r + g + b) / 765 - 0.5) * 0.08,
        r / 255,
        g / 255,
        b / 255,
        importance,
        edge,
      ];
      samples.push(...sample);
      // Bias stable sampling toward the face and high-contrast details such as
      // eyes, brows, nostrils and lips without disturbing the actual silhouette.
      if (faceRegion) samples.push(...sample);
      if (facialCore) { samples.push(...sample); samples.push(...sample); }
      if (faceRegion && edge > 0.10) samples.push(...sample);
      if (faceRegion && edge > 0.22) samples.push(...sample);
      else if (edge > 0.18) samples.push(...sample);
    }
  }
  if (samples.length < 600) throw new Error("Portrait mask did not contain enough person detail");
  return new Float32Array(samples);
}

const DARK_PALETTE = [
  [0.10, 0.56, 0.52], // deep teal
  [0.20, 0.76, 0.69], // turquoise
  [0.24, 0.78, 0.82], // restrained cyan
  [0.12, 0.55, 0.59], // blue-green
  [0.33, 0.83, 0.78], // selected turquoise highlight
  [0.30, 0.58, 0.60], // muted petrol
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

function makeGeometry(count: number, portrait: Float32Array) {
  const random = randomFactory(491_027);
  const sampleCount = portrait.length / 8;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const lightColors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const starSizes = new Float32Array(count);
  const starTypes = new Float32Array(count);
  const twinkles = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const sampleIndex = (Math.floor((i * sampleCount) / count) * 8) % portrait.length;
    const importance = portrait[sampleIndex + 6];
    const edge = portrait[sampleIndex + 7];
    const jitter = 0.0007 + random() * 0.0015;
    const a = random() * Math.PI * 2;
    const index = i * 3;
    positions[index] = portrait[sampleIndex] + Math.cos(a) * jitter;
    positions[index + 1] = portrait[sampleIndex + 1] + Math.sin(a) * jitter;
    positions[index + 2] = portrait[sampleIndex + 2] + (random() - 0.5) * jitter * 1.7;
    const colorRoll = random();
    const colorIndex = colorRoll < 0.34 ? 0 : colorRoll < 0.67 ? 1 : colorRoll < 0.80 ? 2 : colorRoll < 0.91 ? 3 : colorRoll < 0.975 ? 4 : 5;
    const sourceR = portrait[sampleIndex + 3];
    const sourceG = portrait[sampleIndex + 4];
    const sourceB = portrait[sampleIndex + 5];
    const color = DARK_PALETTE[colorIndex];
    const lightColor = LIGHT_PALETTE[colorIndex];
    const sourceLuminance = (sourceR * 0.2126 + sourceG * 0.7152 + sourceB * 0.0722);
    // Keep dark hair and eye detail dark while allowing the brighter skin and
    // high contrast edges to read clearly as a face in the particle portrait.
    const brightness = 0.42 + sourceLuminance * 0.82 + importance * 0.14 + edge * 0.72;
    const tealMix = 0.40 + importance * 0.18;
    colors[index] = Math.min(1, (sourceR * (1 - tealMix) + color[0] * tealMix) * brightness);
    colors[index + 1] = Math.min(1, (sourceG * (1 - tealMix) + color[1] * tealMix) * brightness);
    colors[index + 2] = Math.min(1, (sourceB * (1 - tealMix) + color[2] * tealMix) * brightness);
    const lightBrightness = 0.84 + edge * 0.34 + importance * 0.10 + (1 - sourceLuminance) * 0.16;
    lightColors[index] = Math.min(0.72, lightColor[0] * lightBrightness);
    lightColors[index + 1] = Math.min(0.72, lightColor[1] * lightBrightness);
    lightColors[index + 2] = Math.min(0.72, lightColor[2] * lightBrightness);
    sizes[i] = (random() < 0.02 ? 2.8 + random() * 0.6 : 1.5 + random() * 0.65) + importance * 0.55 + edge * 1.7;
    starSizes[i] = sizes[i] * (1 + random() * 0.14);
    starTypes[i] = random();
    twinkles[i] = random();
  }

  return {
    positions,
    colors,
    lightColors,
    sizes,
    starSizes,
    starTypes,
    twinkles,
  };
}

function makeFormations(count: number, base: Float32Array): Float32Array[] {
  const network = new Float32Array(count * 3);
  const grid = new Float32Array(count * 3);
  const project = new Float32Array(count * 3);
  const text = new Float32Array(count * 3);
  const random = randomFactory(20261111);
  const sampledText: Vec3[] = [];
  const nodes: Vec3[] = [];
  for (let i = 0; i < 18; i++) {
    const y = 1 - 2 * ((i + 0.5) / 18);
    const angle = i * 2.399963229728653;
    const radius = Math.sqrt(Math.max(0, 1 - y * y));
    nodes.push([radius * Math.cos(angle) * 0.60, y * 0.58, radius * Math.sin(angle) * 0.42]);
  }
  nodes.push([0, 0.02, 0]);
  const edges: Array<[number, number]> = [];
  const edgeKeys = new Set<string>();
  for (let node = 0; node < 18; node++) {
    const nearest = nodes.slice(0, 18).map((point, other) => ({
      other,
      distance: Math.hypot(point[0] - nodes[node][0], point[1] - nodes[node][1], point[2] - nodes[node][2]),
    })).filter(({ other }) => other !== node).sort((a, b) => a.distance - b.distance).slice(0, 3);
    for (const { other } of nearest) {
      const low = Math.min(node, other), high = Math.max(node, other);
      const key = `${low}:${high}`;
      if (!edgeKeys.has(key)) { edgeKeys.add(key); edges.push([low, high]); }
    }
    if (node % 3 === 0) edges.push([node, 18]);
  }
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
    const edge = edges[i % edges.length];
    const from = nodes[edge[0]], to = nodes[edge[1]];
    const edgeLayer = Math.floor(i / edges.length);
    const t = (edgeLayer + 0.5 + (random() - 0.5) * 0.18) / Math.ceil(count / edges.length);
    network[k] = from[0] + (to[0] - from[0]) * t + (random() - 0.5) * 0.012;
    network[k + 1] = from[1] + (to[1] - from[1]) * t + (random() - 0.5) * 0.012;
    network[k + 2] = from[2] + (to[2] - from[2]) * t + (random() - 0.5) * 0.012;

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

function drawFallback(canvas: HTMLCanvasElement, particles: ReturnType<typeof makeGeometry>, pointer = { x: 0, y: 0, active: false }) {
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
  const centerY = height * (width < height ? 0.62 : 0.5);
  const scale = Math.min(width, height) * (width < height ? 0.58 : 0.46);
  const pointerX = (pointer.x + 1) * width * 0.5;
  const pointerY = (1 - pointer.y) * height * 0.5;
  for (let i = 0; i < particles.sizes.length; i++) {
    const k = i * 3;
    let x = centerX + particles.positions[k] * scale;
    let y = centerY - particles.positions[k + 1] * scale;
    if (pointer.active) {
      const dx = x - pointerX, dy = y - pointerY;
      const distance = Math.hypot(dx, dy);
      const force = (1 - Math.min(1, distance / 92)) ** 2 * 18;
      if (distance > 0.01) { x += (dx / distance) * force; y += (dy / distance) * force; }
    }
    const palette = light ? particles.lightColors : particles.colors;
    const color = `${Math.round(palette[k] * 255)},${Math.round(palette[k + 1] * 255)},${Math.round(palette[k + 2] * 255)}`;
    const opacity = (particles.sizes[i] > 3 ? 0.94 : 0.76) * (light ? 0.94 : 1);
    ctx.fillStyle = `rgba(${color},${opacity})`;
    ctx.beginPath();
    ctx.arc(x, y, Math.max(0.75, particles.sizes[i] * 0.55), 0, Math.PI * 2);
    ctx.fill();
  }
}

/** One persistent GPU particle system morphs the photo into later scroll formations. */
export default function SignalSculpture({ state, reducedMotion }: { state: SceneState; reducedMotion: boolean }) {
  const webglCanvas = useRef<HTMLCanvasElement>(null);
  const fallbackCanvas = useRef<HTMLCanvasElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const pointerIsActive = useRef(false);
  const [portraitSamples, setPortraitSamples] = useState<Float32Array | null>(null);
  const fallbackGeometry = useMemo(() => {
    if (!portraitSamples?.length) return null;
    const lowPower = typeof window !== "undefined" && window.innerWidth < 768;
    return makeGeometry(lowPower ? 700 : 1400, portraitSamples);
  }, [portraitSamples]);

  useEffect(() => {
    let cancelled = false;
    loadPortraitSamples()
      .then((samples) => { if (!cancelled) setPortraitSamples(samples); })
      .catch(() => { if (!cancelled) setPortraitSamples(new Float32Array()); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const canvas = webglCanvas.current;
    const fallback = fallbackCanvas.current;
    if (!canvas || !fallback || !portraitSamples?.length || !fallbackGeometry) return;
    drawFallback(fallback, fallbackGeometry);

    let gl: WebGLRenderingContext | null = null;
    let program: WebGLProgram | null = null;
    let buffers: WebGLBuffer[] = [];
    let visible = true;
    let tickerAttached = false;
    let disposed = false;
    let lastFrame = 0;
    let smoothMouse = { x: 0, y: 0 };
    let pointerInfluence = 0;
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
      const geometry = makeGeometry(lowPower ? 2200 : 9000, portraitSamples);
      const formations = makeFormations(geometry.sizes.length, geometry.positions);
      let activeStage = 0;
      let activeTargetStage = Math.min(1, formations.length - 1);
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
      Object.values(pointBuffers).forEach((buffer) => {
        if (!buffer) throw new Error("Could not create sculpture buffer");
        buffers.push(buffer);
      });
      const upload = (buffer: WebGLBuffer, data: Float32Array) => {
        gl!.bindBuffer(gl!.ARRAY_BUFFER, buffer);
        gl!.bufferData(gl!.ARRAY_BUFFER, data, gl!.STATIC_DRAW);
      };
      upload(pointBuffers.position!, formations[0]);
      upload(pointBuffers.color!, geometry.colors);
      upload(pointBuffers.lightColor!, geometry.lightColors);
      upload(pointBuffers.target!, formations[activeTargetStage]);
      upload(pointBuffers.size!, geometry.sizes);
      upload(pointBuffers.starSize!, geometry.starSizes);
      upload(pointBuffers.starType!, geometry.starTypes);
      upload(pointBuffers.twinkle!, geometry.twinkles);

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
        smoothMouse.x += (mouse.current.x - smoothMouse.x) * 0.095;
        smoothMouse.y += (mouse.current.y - smoothMouse.y) * 0.095;
        pointerInfluence += ((pointerActive ? 1 : 0) - pointerInfluence) * (pointerActive ? 0.12 : 0.075);
        gl.useProgram(program);
        gl.clear(gl.COLOR_BUFFER_BIT);
        const desiredMorph = Math.max(0, Math.min(formations.length - 1, state.particleMorph || 0));
        const stagePosition = reducedMotion ? Math.round(desiredMorph) : desiredMorph;
        const fromStage = Math.min(formations.length - 1, Math.floor(stagePosition));
        const toStage = Math.min(fromStage + 1, formations.length - 1);
        if (fromStage !== activeStage || toStage !== activeTargetStage) {
          activeStage = fromStage;
          activeTargetStage = toStage;
          upload(pointBuffers.position!, formations[activeStage]);
          upload(pointBuffers.target!, formations[activeTargetStage]);
        }
        const morphProgress = reducedMotion ? 0 : stagePosition - fromStage;
        if (uniform.morph) gl.uniform1f(uniform.morph, morphProgress);
        if (uniform.velocity) gl.uniform1f(uniform.velocity, reducedMotion ? 0 : state.intensity || 0);
        if (uniform.camera) gl.uniform1f(uniform.camera, reducedMotion ? 0 : state.cameraProgress || 0);
        if (uniform.time) gl.uniform1f(uniform.time, reducedMotion ? 0 : (now - started) / 1000);
        if (uniform.mouse) gl.uniform2f(uniform.mouse, smoothMouse.x, smoothMouse.y);
        if (uniform.resolution) gl.uniform2f(uniform.resolution, canvas.width, canvas.height);
        if (uniform.interactive) gl.uniform1f(uniform.interactive, reducedMotion || lowPower ? 0 : 1);
        if (uniform.pointerActive) gl.uniform1f(uniform.pointerActive, reducedMotion ? 0 : pointerInfluence);
        if (uniform.opacity) gl.uniform1f(uniform.opacity, state.opacity);
        if (uniform.light) gl.uniform1f(uniform.light, document.documentElement.dataset.theme === "light" ? 1 : 0);

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
        mouse.current.x = (event.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
        mouse.current.y = 1 - (event.clientY / Math.max(1, window.innerHeight)) * 2;
        pointerActive = true;
        pointerIsActive.current = true;
      };
      const onPointerLeave = () => { pointerActive = false; pointerIsActive.current = false; };
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
        window.removeEventListener("portfolio:motion-update", onReducedMotionUpdate);
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
  }, [reducedMotion, state, portraitSamples, fallbackGeometry]);

  useEffect(() => {
    const fallback = fallbackCanvas.current;
    if (!fallback) return;
    const redraw = () => {
      if (fallbackGeometry) drawFallback(fallback, fallbackGeometry, { ...mouse.current, active: pointerIsActive.current && !reducedMotion });
    };
    const observer = new MutationObserver(redraw);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    window.addEventListener("resize", redraw, { passive: true });
    let redrawFrame = 0;
    const onPointerMove = (event: PointerEvent) => {
      mouse.current.x = (event.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
      mouse.current.y = 1 - (event.clientY / Math.max(1, window.innerHeight)) * 2;
      pointerIsActive.current = true;
      if (fallback.style.opacity !== "1" || redrawFrame) return;
      redrawFrame = window.requestAnimationFrame(() => {
        redrawFrame = 0;
        redraw();
      });
    };
    const onPointerLeave = () => {
      pointerIsActive.current = false;
      mouse.current.x = 0;
      mouse.current.y = 0;
      if (fallback.style.opacity === "1") redraw();
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("blur", onPointerLeave);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", redraw);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("blur", onPointerLeave);
      if (redrawFrame) window.cancelAnimationFrame(redrawFrame);
    };
  }, [fallbackGeometry, reducedMotion]);

  return (
    <div ref={root} className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
      <canvas ref={fallbackCanvas} className="absolute inset-0 h-full w-full opacity-0" />
      <canvas ref={webglCanvas} className="absolute inset-0 h-full w-full pointer-events-none transition-opacity duration-300" />
    </div>
  );
}
