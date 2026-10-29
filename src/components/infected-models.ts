import * as THREE from "three";
import { beanie, box, curve, hand, limb, material, mesh, oval, texture, tube, vest } from "./boss-models";

// Halloween 2026 infected walkers, built as minifigures like the boss models.
// The figure faces +Z and walks in place; +X is the figure's left. Limbs hang
// down -Y from their joint groups, so a negative X rotation swings forward.
export type InfectedVariant = "pmc" | "scav" | "black-division";
type Point = [number, number, number];
type Group = THREE.Group;
type Mat = THREE.Material;

export interface InfectedFigure {
  root: Group;
  /** Pose the figure at an absolute time in seconds. */
  update(time: number): void;
}

const SKIN = 0x9db08a;
const BLOOD = 0x6d0b0b;

function group(parent: Group, at: Point) {
  const g = new THREE.Group(); g.position.set(...at); parent.add(g); return g;
}

function pattern(base: string, colors: string[], seed: number) {
  const map = texture(g => {
    g.fillStyle = base; g.fillRect(0, 0, 256, 256);
    const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
    for (let i = 0; i < 60; i++) {
      const x = rand() * 256, y = rand() * 256;
      g.fillStyle = colors[i % colors.length];
      g.beginPath();
      for (let j = 0; j < 9; j++) {
        const angle = j / 8 * Math.PI * 2, r = 9 + rand() * 18;
        const px = x + Math.cos(angle) * r * 1.3, py = y + Math.sin(angle) * r;
        if (j === 0) g.moveTo(px, py); else g.lineTo(px, py);
      }
      g.closePath(); g.fill();
    }
    // A few dried blood spatters printed into the cloth.
    for (let i = 0; i < 5; i++) {
      const x = rand() * 256, y = rand() * 256;
      g.fillStyle = "rgba(100,12,12,.85)";
      g.beginPath(); g.ellipse(x, y, 6 + rand() * 8, 5 + rand() * 6, rand() * 3, 0, Math.PI * 2); g.fill();
      for (let j = 0; j < 4; j++) { g.beginPath(); g.arc(x + rand() * 30 - 15, y + rand() * 30 - 15, 1.5 + rand() * 2.5, 0, Math.PI * 2); g.fill(); }
    }
  });
  return new THREE.MeshStandardMaterial({ map, roughness: 0.9 });
}

// Printed zombie face: milky eyes with pin pupils, dark sockets, torn mouth.
function zombieFace(masked: boolean) {
  return texture(g => {
    g.fillStyle = "#9db08a"; g.fillRect(0, 0, 256, 256);
    g.fillStyle = "rgba(48,58,44,.6)";
    for (const x of [84, 173]) { g.beginPath(); g.ellipse(x, 112, 27, 25, 0, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = "#f2f3e8";
    for (const x of [84, 173]) { g.beginPath(); g.ellipse(x, 109, 17, 19, 0, 0, Math.PI * 2); g.fill(); }
    g.strokeStyle = "rgba(170,30,30,.8)"; g.lineWidth = 1.5;
    for (const [x, d] of [[70, 1], [98, -1], [159, 1], [187, -1]]) {
      g.beginPath(); g.moveTo(x, 104); g.lineTo(x + d * 6, 108); g.lineTo(x + d * 4, 115); g.stroke();
    }
    g.fillStyle = "#17231b";
    g.beginPath(); g.arc(87, 111, 4, 0, Math.PI * 2); g.arc(169, 106, 4, 0, Math.PI * 2); g.fill();
    g.strokeStyle = "#17231b"; g.lineWidth = 11; g.lineCap = "round";
    g.beginPath(); g.moveTo(54, 70); g.lineTo(110, 86); g.moveTo(202, 74); g.lineTo(146, 84); g.stroke();
    if (masked) return;
    // Scar with stitches.
    g.lineWidth = 3; g.beginPath(); g.moveTo(194, 140); g.lineTo(216, 186); g.stroke();
    for (let i = 0; i < 4; i++) { const y = 148 + i * 11, x = 198 + i * 5; g.beginPath(); g.moveTo(x - 7, y + 3); g.lineTo(x + 7, y - 3); g.stroke(); }
    // Torn open mouth with teeth and a blood drip.
    g.fillStyle = "#3a0a0a";
    g.beginPath(); g.moveTo(86, 168); g.quadraticCurveTo(128, 156, 170, 166);
    g.lineTo(160, 182); g.lineTo(150, 202); g.lineTo(136, 192); g.lineTo(120, 206); g.lineTo(104, 194); g.lineTo(94, 184); g.closePath(); g.fill();
    g.fillStyle = "#e8e2c4";
    for (let i = 0; i < 5; i++) g.fillRect(98 + i * 13, 166 - Math.abs(i - 2), 9, 11);
    g.fillRect(112, 190, 8, 9); g.fillRect(138, 186, 8, 9);
    g.fillStyle = "#8f1212";
    g.beginPath(); g.moveTo(146, 196); g.lineTo(156, 196); g.lineTo(154, 240); g.lineTo(148, 240); g.closePath(); g.fill();
    g.beginPath(); g.arc(151, 243, 6, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.moveTo(96, 186); g.lineTo(102, 186); g.lineTo(100, 212); g.closePath(); g.fill();
  });
}

interface Rig {
  root: Group; pelvis: Group; spine: Group; torso: Group; head: Group;
  shoulders: Record<number, Group>; elbows: Record<number, Group>;
  thighs: Record<number, Group>; knees: Record<number, Group>; feet: Record<number, Group>;
}

interface Outfit {
  coat: Mat; pants: Mat; boots: Mat; masked?: boolean;
  /** Per side (-1 is the figure's right, 1 its left). */
  sleeve: Record<number, Mat>; forearm: Record<number, Mat>; glove: Record<number, Mat>;
}

function buildBody(outfit: Outfit): Rig {
  const root = new THREE.Group(), skin = material(SKIN);
  const pelvis = group(root, [0, 1.43, 0]);
  box(pelvis, [1.18, 0.28, 0.65], outfit.pants, [0, 0, 0]);
  const spine = group(pelvis, [0, 0.08, 0]);
  // Everything above the waist uses the boss models' figure coordinates.
  const torso = group(spine, [0, -1.51, 0]);
  const chest = mesh(torso, new THREE.CylinderGeometry(0.8, 0.67, 1.18, 4), outfit.coat, [0, 2.1, 0], true);
  chest.rotation.y = Math.PI / 4;
  chest.scale.set(1.12, 1, 0.76);
  tube(torso, 0.23, 0.19, skin, [0, 2.78, 0]);

  const head = group(torso, [0, 3.14, 0]);
  tube(head, 0.47, 0.68, skin, [0, 0, 0]);
  tube(head, 0.25, 0.14, skin, [0, 0.4, 0]);
  for (const side of [-1, 1]) oval(head, [0.1, 0.15, 0.1], skin, [side * 0.47, -0.02, 0]);
  mesh(head, new THREE.CylinderGeometry(0.477, 0.477, 0.68, 32, 1, true, -1.08, 2.16), new THREE.MeshStandardMaterial({ map: zombieFace(!!outfit.masked) }), [0, 0, 0]);

  const rig: Rig = { root, pelvis, spine, torso, head, shoulders: {}, elbows: {}, thighs: {}, knees: {}, feet: {} };
  for (const side of [-1, 1]) {
    const shoulder = group(torso, [side * 0.73, 2.5, 0]);
    oval(shoulder, [0.22, 0.22, 0.22], outfit.sleeve[side], [0, 0, 0]);
    limb(shoulder, [0, 0, 0], [0, -0.5, 0], 0.38, outfit.sleeve[side]);
    const elbow = group(shoulder, [0, -0.5, 0]);
    oval(elbow, [0.2, 0.2, 0.2], outfit.forearm[side], [0, 0, 0]);
    limb(elbow, [0, 0, 0], [0, -0.46, 0], 0.32, outfit.forearm[side]);
    hand(elbow, [0, -0.6, 0], outfit.glove[side], [0, Math.PI / 2, 0]);

    const thigh = group(pelvis, [side * 0.34, -0.03, 0]);
    thigh.rotation.z = side * 0.08;
    limb(thigh, [0, 0, 0], [0, -0.6, 0], 0.55, outfit.pants, 0.62);
    const knee = group(thigh, [0, -0.6, 0]);
    oval(knee, [0.28, 0.25, 0.31], outfit.pants, [0, 0, 0]);
    limb(knee, [0, 0, 0], [0, -0.55, 0], 0.54, outfit.pants, 0.62);
    const foot = group(knee, [0, -0.55, 0]);
    box(foot, [0.62, 0.3, 0.84], outfit.boots, [0, -0.06, 0.12]);
    box(foot, [0.63, 0.07, 0.85], material(0x19231c), [0, -0.195, 0.12]);

    Object.assign(rig.shoulders, { [side]: shoulder });
    Object.assign(rig.elbows, { [side]: elbow });
    Object.assign(rig.thighs, { [side]: thigh });
    Object.assign(rig.knees, { [side]: knee });
    Object.assign(rig.feet, { [side]: foot });
  }
  return rig;
}

function splat(parent: Group, at: Point, size: [number, number], rotation = 0) {
  const blot = oval(parent, [size[0], size[1], 0.015], material(BLOOD), at);
  blot.rotation.z = rotation;
  return blot;
}

function headset(head: Group, cup: Mat, band: Mat, overTop = true) {
  for (const side of [-1, 1]) {
    tube(head, 0.19, 0.13, cup, [side * 0.53, 0, 0], "x");
    tube(head, 0.12, 0.04, band, [side * 0.61, 0, 0], "x");
  }
  if (overTop) curve(head, [[-0.53, 0.15, 0], [-0.45, 0.48, 0], [0, 0.62, 0], [0.45, 0.48, 0], [0.53, 0.15, 0]], 0.045, band);
  curve(head, [[0.56, -0.12, 0.1], [0.5, -0.3, 0.35], [0.2, -0.32, 0.52]], 0.025, band);
  oval(head, [0.05, 0.04, 0.05], band, [0.18, -0.32, 0.53]);
}

function makeBlackDivision(): Rig {
  const camo = () => pattern("#2c2f2d", ["#151817", "#3d413e", "#1d201e", "#4b4e4a"], 4021);
  const coat = camo(), pants = camo(), black = material(0x161a19), glove = material(0x111514);
  const rig = buildBody({ coat, pants, boots: black, masked: true,
    sleeve: { [-1]: coat, 1: coat }, forearm: { [-1]: coat, 1: coat }, glove: { [-1]: glove, 1: glove } });
  const { torso, head } = rig;
  vest(torso, 0x1e2120, 1, 3);
  box(torso, [0.5, 0.2, 0.08], material(0x111312), [0, 2.4, 0.56]);
  splat(torso, [0.22, 2.36, 0.6], [0.12, 0.17], 0.4);
  splat(torso, [-0.05, 2.74, 0.27], [0.15, 0.08]);

  // High-cut helmet with NVG shroud and side rails over coyote ear pro.
  const dome = mesh(head, new THREE.SphereGeometry(0.57, 28, 18, 0, Math.PI * 2, 0, Math.PI / 2), black, [0, 0.16, -0.02]);
  dome.scale.y = 0.86;
  tube(head, 0.575, 0.1, black, [0, 0.17, -0.02]);
  const shroud = box(head, [0.22, 0.15, 0.09], material(0x2e3331, 0.35), [0, 0.5, 0.44]);
  shroud.rotation.x = -0.55;
  for (const side of [-1, 1]) box(head, [0.06, 0.1, 0.46], material(0x262b29, 0.3), [side * 0.57, 0.22, -0.02]);
  headset(head, material(0x9a7b52), material(0x1b1f1d), false);
  // Half-face respirator with the slatted grey filter.
  const rubber = material(0x1a1d1c);
  box(head, [0.64, 0.36, 0.2], rubber, [0, -0.17, 0.47]);
  box(head, [0.36, 0.38, 0.1], material(0x8d8f8a), [0, -0.15, 0.62]);
  for (let i = 0; i < 6; i++) box(head, [0.28, 0.025, 0.03], material(0x3c403d), [0, -0.29 + i * 0.055, 0.68], false);
  for (const side of [-1, 1]) {
    tube(head, 0.07, 0.1, rubber, [side * 0.3, -0.2, 0.55], "x");
    curve(head, [[side * 0.32, -0.06, 0.45], [side * 0.47, 0.06, 0.25], [side * 0.5, 0.12, 0.05]], 0.025, rubber);
  }
  splat(head, [0.2, -0.38, 0.475], [0.05, 0.1]);
  splat(head, [-0.22, -0.4, 0.47], [0.04, 0.06]);
  for (const side of [-1, 1]) box(rig.knees[side], [0.5, 0.3, 0.1], black, [0, -0.02, 0.33]);
  return rig;
}

function makePmc(): Rig {
  const coat = pattern("#887c5b", ["#5c5739", "#a69469", "#4b4834", "#c2b38a"], 977);
  const pants = pattern("#4f5440", ["#3c4032", "#5c604c"], 211);
  const skin = material(SKIN), glove = material(0x2a2822);
  const rig = buildBody({ coat, pants, boots: material(0x76603f),
    sleeve: { [-1]: coat, 1: coat }, forearm: { [-1]: skin, 1: coat }, glove: { [-1]: skin, 1: glove } });
  const { torso, head } = rig;
  vest(torso, 0x86734d, 2, 3);
  // Rolled, torn sleeve and a bite on the bare forearm.
  tube(rig.elbows[-1], 0.22, 0.12, coat, [0, -0.05, 0]);
  splat(rig.elbows[-1], [0, -0.28, 0.17], [0.07, 0.09]);
  box(rig.shoulders[1], [0.04, 0.2, 0.26], material(0x2f4766), [0.2, -0.18, 0]);
  splat(torso, [-0.24, 2.42, 0.69], [0.12, 0.16], -0.3);
  splat(torso, [0, 2.73, 0.27], [0.14, 0.08]);
  // Backwards cap under an olive headset.
  const cap = material(0x5b5e43);
  const crown = mesh(head, new THREE.SphereGeometry(0.5, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), cap, [0, 0.27, 0]);
  crown.scale.y = 0.72;
  tube(head, 0.5, 0.12, cap, [0, 0.3, 0]);
  box(head, [0.58, 0.05, 0.36], cap, [0, 0.29, -0.62]);
  box(head, [0.22, 0.08, 0.04], material(0x2e3025), [0, 0.38, 0.47], false);
  headset(head, material(0x4d513c), material(0x2d3026));
  return rig;
}

function makeScav(): Rig {
  const track = new THREE.MeshStandardMaterial({ color: 0x1e2742, roughness: 0.5 });
  const stripe = material(0xe1dfd4), skin = material(SKIN);
  const rig = buildBody({ coat: track, pants: track, boots: material(0xb8b3a4),
    sleeve: { [-1]: track, 1: track }, forearm: { [-1]: track, 1: track }, glove: { [-1]: skin, 1: skin } });
  const { torso, head } = rig;
  // Three white stripes down each sleeve and leg.
  for (const side of [-1, 1]) for (const z of [-0.07, 0, 0.07]) {
    box(rig.shoulders[side], [0.02, 0.5, 0.03], stripe, [side * 0.2, -0.26, z], false);
    box(rig.elbows[side], [0.02, 0.46, 0.03], stripe, [side * 0.17, -0.23, z], false);
    box(rig.thighs[side], [0.02, 0.6, 0.03], stripe, [side * 0.285, -0.3, z], false);
    box(rig.knees[side], [0.02, 0.55, 0.03], stripe, [side * 0.28, -0.28, z], false);
  }
  box(torso, [0.04, 1.12, 0.02], material(0xa8a89e, 0.4), [0, 2.1, 0.44], false);
  curve(torso, [[-0.52, 2.7, 0.12], [-0.43, 2.58, 0.45], [0, 2.5, 0.52], [0.43, 2.58, 0.45], [0.52, 2.7, 0.12]], 0.09, track);
  // Cheap olive chest rig hanging low.
  const rigMat = material(0x5a5b3b);
  box(torso, [1.0, 0.42, 0.12], rigMat, [0, 1.85, 0.48]);
  for (let i = 0; i < 4; i++) {
    box(torso, [0.22, 0.34, 0.14], rigMat, [-0.36 + i * 0.24, 1.83, 0.6]);
    box(torso, [0.23, 0.08, 0.03], material(0x3f402a), [-0.36 + i * 0.24, 1.96, 0.68], false);
  }
  for (const side of [-1, 1]) curve(torso, [[side * 0.32, 2.05, 0.5], [side * 0.36, 2.6, 0.42], [side * 0.4, 2.76, 0.05], [side * 0.36, 2.5, -0.45]], 0.04, rigMat);
  splat(torso, [0.24, 2.36, 0.46], [0.16, 0.22], 0.5);
  splat(torso, [0, 2.73, 0.27], [0.15, 0.08]);
  beanie(head, 0x1d1d1f);
  return rig;
}

interface ArmStyle { base: number; swing: number; elbow: number; reach: boolean }
interface WalkStyle {
  period: number; stride: number; limp: number; lean: number; tilt: number;
  twitchEvery: number; twitchAmp: number; arms: Record<number, ArmStyle>;
}

const STYLES: Record<InfectedVariant, WalkStyle> = {
  pmc: { period: 1.5, stride: 0.42, limp: 0.2, lean: 0.12, tilt: 0.16, twitchEvery: 4.1, twitchAmp: 0.22,
    arms: { [-1]: { base: -1.42, swing: 0.08, elbow: -0.08, reach: true }, 1: { base: -1.52, swing: 0.08, elbow: -0.05, reach: true } } },
  scav: { period: 1.75, stride: 0.38, limp: 0.65, lean: 0.16, tilt: -0.24, twitchEvery: 3.3, twitchAmp: 0.28,
    arms: { [-1]: { base: 0.08, swing: 0.3, elbow: -0.12, reach: false }, 1: { base: -1.5, swing: 0.07, elbow: -0.1, reach: true } } },
  "black-division": { period: 1.3, stride: 0.46, limp: 0.08, lean: 0.2, tilt: 0.1, twitchEvery: 2.6, twitchAmp: 0.32,
    arms: { [-1]: { base: -1.25, swing: 0.1, elbow: -0.45, reach: true }, 1: { base: -1.45, swing: 0.09, elbow: -0.3, reach: true } } },
};

const SOLE: Point[] = [[0, -0.23, -0.3], [0, -0.23, 0.54]];

function walker(rig: Rig, style: WalkStyle): InfectedFigure {
  const point = new THREE.Vector3();
  function update(time: number) {
    const phase = time / style.period * Math.PI * 2;
    const s = Math.sin(phase);
    for (const side of [-1, 1]) {
      // The figure's right leg (-1) limps: shorter stride and it barely lifts.
      const limp = side < 0 ? style.limp : 0;
      const legPhase = phase + (side > 0 ? 0 : Math.PI);
      const thigh = -style.stride * (1 - limp * 0.5) * Math.sin(legPhase);
      const knee = 0.05 + 0.4 * (1 - limp) * Math.max(0, Math.cos(legPhase));
      rig.thighs[side].rotation.x = thigh;
      rig.knees[side].rotation.x = knee;
      rig.feet[side].rotation.x = -(thigh + knee) * 0.85 + limp * 0.25;

      const arm = style.arms[side];
      rig.shoulders[side].rotation.set(
        arm.reach ? arm.base + arm.swing * Math.sin(phase * 0.5 + side) : arm.base + arm.swing * Math.sin(legPhase),
        0,
        side * (arm.reach ? -0.06 : 0.08),
      );
      rig.elbows[side].rotation.x = arm.reach
        ? arm.elbow + 0.06 * Math.sin(phase + side * 1.3)
        : arm.elbow - 0.18 * Math.max(0, -Math.sin(legPhase));
    }
    rig.pelvis.rotation.set(0, -0.1 * s, 0.05 * s);
    rig.spine.rotation.set(style.lean + 0.03 * Math.sin(phase * 2), 0.14 * s, -0.04 * s);

    // A short, violent head jerk every few seconds.
    const since = time % style.twitchEvery;
    const twitch = since < 0.32 ? style.twitchAmp * Math.sin(since * 55) * (1 - since / 0.32) : 0;
    rig.head.rotation.set(-style.lean * 0.7 + 0.04 * Math.sin(phase * 2), -0.08 * s + twitch * 0.5, style.tilt + 0.04 * s + twitch);

    // Keep the lowest sole on the ground so the body bobs with each step.
    rig.pelvis.position.y = 1.43;
    rig.root.updateMatrixWorld(true);
    let lowest = Infinity;
    for (const side of [-1, 1]) for (const sole of SOLE) {
      rig.feet[side].localToWorld(point.set(...sole));
      rig.root.worldToLocal(point);
      lowest = Math.min(lowest, point.y);
    }
    rig.pelvis.position.y -= lowest;
    rig.root.updateMatrixWorld(true);
  }
  update(0);
  return { root: rig.root, update };
}

export function buildInfectedModel(variant: InfectedVariant): InfectedFigure {
  const rig = variant === "pmc" ? makePmc() : variant === "scav" ? makeScav() : makeBlackDivision();
  // A slight quarter turn so the outstretched arms read instead of pointing
  // straight into the lens.
  rig.root.rotation.y = 0.38;
  return walker(rig, STYLES[variant]);
}
