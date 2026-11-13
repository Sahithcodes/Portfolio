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
uniform float uTime;
uniform vec2 uMouse;
uniform vec2 uResolution;
uniform float uInteractive;
uniform float uPointerActive;
uniform float uOpacity;
uniform float uLightTheme;
uniform float uSkillMix;
uniform float uScroll;
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
  float rotation = (uTime * 0.055 + uScroll * 0.16) * uSkillMix;
  float rotationCos = cos(rotation);
  float rotationSin = sin(rotation);
  vec2 rotatedXZ = mat2(rotationCos, -rotationSin, rotationSin, rotationCos) * p.xz;
  p.xz = mix(p.xz, rotatedXZ, uSkillMix);
  float particlePhase = uTime * (0.34 + aTwinkle * 0.18) + aTwinkle * 6.28318;
  p += vec3(sin(particlePhase), cos(particlePhase * 0.87), sin(particlePhase * 0.71))
    * (0.0014 + aTwinkle * 0.0011 + uVelocity * 0.0005);
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
  vec3 naturalColor = mix(aColor, aLightColor, uLightTheme);
  vec3 darkSculptureColor = mix(vec3(0.035, 0.31, 0.30), vec3(0.10, 0.73, 0.68), aTwinkle);
  vec3 lightSculptureColor = mix(vec3(0.012, 0.18, 0.18), vec3(0.018, 0.37, 0.34), aTwinkle);
  vColor = mix(naturalColor, mix(darkSculptureColor, lightSculptureColor, uLightTheme), uSkillMix);
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
uniform float uLineMode;
uniform float uLineAlpha;
void main() {
  if (uLineMode > 0.5) {
    float lineAlpha = vAlpha * uLineAlpha * 0.42;
    if (lineAlpha < 0.012) discard;
    gl_FragColor = vec4(vColor * vDepth, lineAlpha);
    return;
  }
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
  [0.008, 0.24, 0.22], // deep teal
  [0.01, 0.31, 0.29], // blue-green
  [0.02, 0.25, 0.30], // deep petrol
  [0.02, 0.34, 0.32], // controlled turquoise
  [0.01, 0.19, 0.20], // charcoal teal
  [0.03, 0.28, 0.26], // muted blue-green
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

type ParticleFormation = { positions: Float32Array; lineIndices: Uint16Array };
type LineSegment = [Vec3, Vec3];

function pathsToSegments(paths: Vec3[][]): LineSegment[] {
  const segments: LineSegment[] = [];
  for (const path of paths) {
    for (let i = 1; i < path.length; i++) segments.push([path[i - 1], path[i]]);
  }
  return segments;
}

function sampleLineFormation(count: number, paths: Vec3[][], seed: number): ParticleFormation {
  const segments = pathsToSegments(paths);
  const positions = new Float32Array(count * 3);
  const indices: number[] = [];
  if (!segments.length) return { positions, lineIndices: new Uint16Array() };
  const random = randomFactory(seed);
  let cursor = 0;
  segments.forEach(([from, to], segmentIndex) => {
    const samples = Math.floor(count / segments.length) + (segmentIndex < count % segments.length ? 1 : 0);
    const start = cursor;
    for (let i = 0; i < samples; i++, cursor++) {
      const t = samples <= 1 ? 0.5 : i / (samples - 1);
      const k = cursor * 3;
      const depthJitter = (random() - 0.5) * 0.006;
      positions[k] = from[0] + (to[0] - from[0]) * t + depthJitter * 0.25;
      positions[k + 1] = from[1] + (to[1] - from[1]) * t - depthJitter * 0.2;
      positions[k + 2] = from[2] + (to[2] - from[2]) * t + depthJitter;
      if (i > 0) indices.push(cursor - 1, cursor);
    }
    // Keep line identity segmented at path edges; no line joins cross a gap.
    if (cursor - start < 2) return;
  });
  return { positions, lineIndices: new Uint16Array(indices) };
}

function circlePath(radius: number, centerY = 0, steps = 48, offset = 0, depth = 0): Vec3[] {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const angle = (i / steps) * Math.PI * 2 + offset;
    return [Math.cos(angle) * radius, centerY + Math.sin(angle) * radius, Math.sin(angle) * depth];
  });
}

function latitudeCirclePath(radius: number, y: number, steps = 40, offset = 0): Vec3[] {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const angle = (i / steps) * Math.PI * 2 + offset;
    return [Math.cos(angle) * radius, y, Math.sin(angle) * radius];
  });
}

function areAdjacentBinaryCorners(left: string, right: string): boolean {
  let differences = 0;
  for (let i = 0; i < left.length; i++) if (left[i] !== right[i]) differences++;
  return differences === 1;
}

function makeFormations(count: number, base: Float32Array): { positions: Float32Array[]; lineIndices: Uint16Array[] } {
  const random = randomFactory(20261111);
  // 01: asymmetric branching graph with a central spine, unequal arms and cross-links.
  const branchPaths: Vec3[][] = [];
  const branchAngles = [-2.55, -1.58, -0.72, 0.24, 1.05, 2.42];
  branchAngles.forEach((angle, i) => {
    const elevation = [-0.38, 0.18, 0.42, -0.22, 0.32, -0.12][i];
    const direction: Vec3 = [Math.cos(angle) * Math.cos(elevation), Math.sin(elevation), Math.sin(angle) * Math.cos(elevation)];
    const root: Vec3 = [0, -0.02, 0];
    const joint: Vec3 = [direction[0] * 0.29, direction[1] * 0.29, direction[2] * 0.29];
    const tip: Vec3 = [direction[0] * (0.54 + (i % 2) * 0.08), direction[1] * 0.54 - 0.01, direction[2] * 0.54];
    branchPaths.push([root, joint, tip]);
    const side: Vec3 = [-Math.sin(angle), 0.28 * (i % 2 ? 1 : -1), Math.cos(angle)];
    [-1, 1].forEach((sign) => {
      const branchTip: Vec3 = [joint[0] + direction[0] * 0.20 + side[0] * sign * 0.15, joint[1] + direction[1] * 0.20 + side[1] * sign * 0.15, joint[2] + direction[2] * 0.20 + side[2] * sign * 0.15];
      branchPaths.push([joint, [joint[0] + direction[0] * 0.11 + side[0] * sign * 0.07, joint[1] + direction[1] * 0.11 + side[1] * sign * 0.07, joint[2] + direction[2] * 0.11 + side[2] * sign * 0.07], branchTip]);
    });
  });
  branchPaths.push([[-0.46, 0.40, -0.08], [-0.20, 0.21, 0.12], [0.02, 0.40, 0.02], [0.38, 0.26, -0.12]]);
  const branching = sampleLineFormation(count, branchPaths, 71_032);

  // 02: optical iris made from offset rings, curved blades and a scanning focus ray.
  const irisPaths: Vec3[][] = [circlePath(0.57, 0, 56, 0, 0.01), circlePath(0.39, 0, 48, 0.08, 0.035), circlePath(0.16, 0, 40, 0, 0.02)];
  for (let blade = 0; blade < 9; blade++) {
    const start = (blade / 9) * Math.PI * 2;
    const path: Vec3[] = [];
    for (let step = 0; step <= 18; step++) {
      const t = step / 18;
      const radius = 0.54 - t * 0.35;
      const angle = start + Math.sin(t * Math.PI) * (blade % 2 ? -0.32 : 0.32);
      path.push([Math.cos(angle) * radius, Math.sin(angle) * radius * 0.88, 0.035 + Math.sin(t * Math.PI) * 0.045]);
    }
    irisPaths.push(path);
  }
  irisPaths.push([[-0.02, -0.03, 0.11], [0.43, 0.23, 0.02]]);
  irisPaths.push([[-0.13, 0, 0.1], [0.13, 0, 0.1]], [[0, -0.12, 0.1], [0, 0.12, 0.1]]);
  const iris = sampleLineFormation(count, irisPaths, 71_033);

  // 03: stacked cuboid frames and braces that read as an assembled 3D system.
  const architecturePaths: Vec3[][] = [];
  const boxes = [
    { y: 0.31, w: 0.58, h: 0.24, d: 0.34 },
    { y: 0.02, w: 0.82, h: 0.24, d: 0.46 },
    { y: -0.31, w: 0.66, h: 0.24, d: 0.58 },
  ];
  const boxCorners: Vec3[][] = [];
  boxes.forEach(({ y, w, h, d }) => {
    const corners: Vec3[] = [];
    for (let z = -1; z <= 1; z += 2) for (let x = -1; x <= 1; x += 2) for (let yy = -1; yy <= 1; yy += 2) corners.push([x * w / 2, y + yy * h / 2, z * d / 2]);
    boxCorners.push(corners);
    for (let i = 0; i < corners.length; i++) for (let j = i + 1; j < corners.length; j++) {
      const a = i.toString(2).padStart(3, "0"), b = j.toString(2).padStart(3, "0");
      if (areAdjacentBinaryCorners(a, b)) architecturePaths.push([corners[i], corners[j]]);
    }
  });
  for (let layer = 0; layer < boxCorners.length - 1; layer++) {
    for (let corner = 0; corner < 8; corner++) architecturePaths.push([boxCorners[layer][corner], boxCorners[layer + 1][corner]]);
  }
  architecturePaths.push([[-0.42, 0.43, 0], [0.38, -0.39, 0]], [[0.42, 0.43, 0], [-0.38, -0.39, 0]]);
  const architecture = sampleLineFormation(count, architecturePaths, 71_034);

  // 04: globe with longitude/latitude coordinates and offset orbital markers.
  const globePaths: Vec3[][] = [];
  for (const latitude of [-0.78, -0.52, -0.26, 0, 0.26, 0.52, 0.78]) {
    const radius = Math.sqrt(1 - latitude * latitude) * 0.48;
    globePaths.push(latitudeCirclePath(radius, latitude * 0.48, 36, latitude * 0.24));
  }
  for (let meridian = 0; meridian < 12; meridian++) {
    const longitude = (meridian / 12) * Math.PI * 2;
    const path = Array.from({ length: 49 }, (_, i) => {
      const latitude = -Math.PI / 2 + (i / 48) * Math.PI;
      return [Math.cos(latitude) * Math.cos(longitude) * 0.48, Math.sin(latitude) * 0.48, Math.cos(latitude) * Math.sin(longitude) * 0.48] as Vec3;
    });
    globePaths.push(path);
  }
  globePaths.push(circlePath(0.60, 0.12, 56, 0.45, 0.02), circlePath(0.65, -0.12, 56, -0.55, -0.03));
  const globe = sampleLineFormation(count, globePaths, 71_035);

  // 05: irregular polyhedral cells grouped around uneven sites, Voronoi-inspired.
  const voronoiPaths: Vec3[][] = [];
  const clusterCenters: Vec3[] = [[-0.31, 0.12, 0], [0.29, 0.16, 0.03], [0.01, -0.28, -0.08]];
  const cellCenters: Vec3[][] = [];
  const cellRandom = randomFactory(71_036);
  clusterCenters.forEach((cluster, clusterIndex) => {
    const centers: Vec3[] = [];
    for (let cell = 0; cell < 5; cell++) {
      const angle = (cell / 5) * Math.PI * 2 + clusterIndex * 0.41;
      const center: Vec3 = [cluster[0] + Math.cos(angle) * (0.12 + cellRandom() * 0.035), cluster[1] + Math.sin(angle) * (0.11 + cellRandom() * 0.03), cluster[2] + (cellRandom() - 0.5) * 0.25];
      centers.push(center);
      const radius = 0.085 + cellRandom() * 0.035;
      const rotation = cellRandom() * Math.PI;
      const corners: Vec3[] = [];
      for (let z = -1; z <= 1; z += 2) for (let y = -1; y <= 1; y += 2) for (let x = -1; x <= 1; x += 2) {
        const px = x * radius * (0.82 + cellRandom() * 0.36), py = y * radius * (0.82 + cellRandom() * 0.36);
        corners.push([center[0] + px * Math.cos(rotation) - py * Math.sin(rotation), center[1] + px * Math.sin(rotation) + py * Math.cos(rotation), center[2] + z * radius * (0.82 + cellRandom() * 0.36)]);
      }
      for (let i = 0; i < corners.length; i++) for (let j = i + 1; j < corners.length; j++) {
        const a = i.toString(2).padStart(3, "0"), b = j.toString(2).padStart(3, "0");
        if (areAdjacentBinaryCorners(a, b)) voronoiPaths.push([corners[i], corners[j]]);
      }
    }
    cellCenters.push(centers);
    for (let cell = 0; cell < centers.length; cell++) voronoiPaths.push([centers[cell], centers[(cell + 1) % centers.length]]);
  });
  for (let cluster = 0; cluster < cellCenters.length; cluster++) {
    for (let cell = 0; cell < cellCenters[cluster].length; cell++) {
      const next = cellCenters[(cluster + 1) % cellCenters.length][(cell * 2) % cellCenters[(cluster + 1) % cellCenters.length].length];
      if (cell % 2 === 0) voronoiPaths.push([cellCenters[cluster][cell], next]);
    }
  }
  const voronoi = sampleLineFormation(count, voronoiPaths, 71_037);

  // Preserve the prior project-stage orbital columns and the final wordmark.
  const project = new Float32Array(count * 3);
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
  const text = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const k = i * 3;
    const column = i % 3;
    const phase = Math.floor(i / 3) / Math.ceil(count / 3);
    const angle = phase * Math.PI * 2;
    const centers = [-0.42, 0, 0.42];
    const radius = 0.12 + (column === 1 ? 0.1 : 0);
    project[k] = centers[column] + Math.cos(angle) * radius;
    project[k + 1] = phase * 0.96 - 0.48;
    project[k + 2] = Math.sin(angle) * radius * 0.62 + (column - 1) * 0.04;
    const point = sampledText.length ? sampledText[(i * 97) % sampledText.length] : [base[k], base[k + 1], base[k + 2]] as Vec3;
    text[k] = point[0]; text[k + 1] = point[1]; text[k + 2] = point[2];
  }
  const emptyLines = new Uint16Array();
  return {
    positions: [base, branching.positions, iris.positions, architecture.positions, globe.positions, voronoi.positions, project, text],
    lineIndices: [emptyLines, branching.lineIndices, iris.lineIndices, architecture.lineIndices, globe.lineIndices, voronoi.lineIndices, emptyLines, emptyLines],
  };
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
      let activeTargetStage = Math.min(1, formations.positions.length - 1);
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
        time: gl.getUniformLocation(program, "uTime"),
        mouse: gl.getUniformLocation(program, "uMouse"),
        resolution: gl.getUniformLocation(program, "uResolution"),
        interactive: gl.getUniformLocation(program, "uInteractive"),
        pointerActive: gl.getUniformLocation(program, "uPointerActive"),
        opacity: gl.getUniformLocation(program, "uOpacity"),
        light: gl.getUniformLocation(program, "uLightTheme"),
        skillMix: gl.getUniformLocation(program, "uSkillMix"),
        scroll: gl.getUniformLocation(program, "uScroll"),
        lineMode: gl.getUniformLocation(program, "uLineMode"),
        lineAlpha: gl.getUniformLocation(program, "uLineAlpha"),
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
      const lineBuffers = { from: gl.createBuffer(), target: gl.createBuffer() };
      Object.values(pointBuffers).forEach((buffer) => {
        if (!buffer) throw new Error("Could not create sculpture buffer");
        buffers.push(buffer);
      });
      Object.values(lineBuffers).forEach((buffer) => {
        if (!buffer) throw new Error("Could not create sculpture line buffer");
        buffers.push(buffer);
      });
      const upload = (buffer: WebGLBuffer, data: Float32Array) => {
        gl!.bindBuffer(gl!.ARRAY_BUFFER, buffer);
        gl!.bufferData(gl!.ARRAY_BUFFER, data, gl!.STATIC_DRAW);
      };
      upload(pointBuffers.position!, formations.positions[0]);
      upload(pointBuffers.color!, geometry.colors);
      upload(pointBuffers.lightColor!, geometry.lightColors);
      upload(pointBuffers.target!, formations.positions[activeTargetStage]);
      upload(pointBuffers.size!, geometry.sizes);
      upload(pointBuffers.starSize!, geometry.starSizes);
      upload(pointBuffers.starType!, geometry.starTypes);
      upload(pointBuffers.twinkle!, geometry.twinkles);
      const uploadLineIndices = (buffer: WebGLBuffer, indices: Uint16Array) => {
        gl!.bindBuffer(gl!.ELEMENT_ARRAY_BUFFER, buffer);
        gl!.bufferData(gl!.ELEMENT_ARRAY_BUFFER, indices, gl!.STATIC_DRAW);
      };
      uploadLineIndices(lineBuffers.from!, formations.lineIndices[0]);
      uploadLineIndices(lineBuffers.target!, formations.lineIndices[activeTargetStage]);
      let fromLineCount = formations.lineIndices[0].length;
      let targetLineCount = formations.lineIndices[activeTargetStage].length;

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
        const desiredMorph = Math.max(0, Math.min(formations.positions.length - 1, state.particleMorph || 0));
        const stagePosition = reducedMotion ? Math.round(desiredMorph) : desiredMorph;
        const fromStage = Math.min(formations.positions.length - 1, Math.floor(stagePosition));
        const toStage = Math.min(fromStage + 1, formations.positions.length - 1);
        if (fromStage !== activeStage || toStage !== activeTargetStage) {
          activeStage = fromStage;
          activeTargetStage = toStage;
          upload(pointBuffers.position!, formations.positions[activeStage]);
          upload(pointBuffers.target!, formations.positions[activeTargetStage]);
          uploadLineIndices(lineBuffers.from!, formations.lineIndices[activeStage]);
          uploadLineIndices(lineBuffers.target!, formations.lineIndices[activeTargetStage]);
          fromLineCount = formations.lineIndices[activeStage].length;
          targetLineCount = formations.lineIndices[activeTargetStage].length;
        }
        const morphProgress = reducedMotion ? 0 : stagePosition - fromStage;
        const skillIn = Math.max(0, Math.min(1, (stagePosition - 0.45) / 0.55));
        const skillOut = 1 - Math.max(0, Math.min(1, (stagePosition - 5.35) / 0.65));
        const skillMix = skillIn * skillOut;
        if (uniform.morph) gl.uniform1f(uniform.morph, morphProgress);
        if (uniform.velocity) gl.uniform1f(uniform.velocity, reducedMotion ? 0 : state.intensity || 0);
        if (uniform.time) gl.uniform1f(uniform.time, reducedMotion ? 0 : (now - started) / 1000);
        if (uniform.mouse) gl.uniform2f(uniform.mouse, smoothMouse.x, smoothMouse.y);
        if (uniform.resolution) gl.uniform2f(uniform.resolution, canvas.width, canvas.height);
        if (uniform.interactive) gl.uniform1f(uniform.interactive, reducedMotion || lowPower ? 0 : 1);
        if (uniform.pointerActive) gl.uniform1f(uniform.pointerActive, reducedMotion ? 0 : pointerInfluence);
        if (uniform.opacity) gl.uniform1f(uniform.opacity, state.opacity);
        if (uniform.light) gl.uniform1f(uniform.light, document.documentElement.dataset.theme === "light" ? 1 : 0);
        if (uniform.skillMix) gl.uniform1f(uniform.skillMix, skillMix);
        if (uniform.scroll) gl.uniform1f(uniform.scroll, state.cameraProgress || 0);

        bindAttribute(pointBuffers.position!, attribute.position, 3);
        bindAttribute(pointBuffers.color!, attribute.color, 3);
        bindAttribute(pointBuffers.lightColor!, attribute.lightColor, 3);
        bindAttribute(pointBuffers.target!, attribute.target, 3);
        bindAttribute(pointBuffers.size!, attribute.size, 1);
        bindAttribute(pointBuffers.starSize!, attribute.starSize, 1);
        bindAttribute(pointBuffers.starType!, attribute.starType, 1);
        bindAttribute(pointBuffers.twinkle!, attribute.twinkle, 1);
        if (uniform.lineMode) gl.uniform1f(uniform.lineMode, 1);
        if (fromLineCount > 0) {
          if (uniform.lineAlpha) gl.uniform1f(uniform.lineAlpha, (1 - morphProgress) * skillMix);
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, lineBuffers.from);
          gl.drawElements(gl.LINES, fromLineCount, gl.UNSIGNED_SHORT, 0);
        }
        if (targetLineCount > 0) {
          if (uniform.lineAlpha) gl.uniform1f(uniform.lineAlpha, morphProgress * skillMix);
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, lineBuffers.target);
          gl.drawElements(gl.LINES, targetLineCount, gl.UNSIGNED_SHORT, 0);
        }
        if (uniform.lineMode) gl.uniform1f(uniform.lineMode, 0);
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
