import * as THREE from "three";

// Procedural minifigures based on the corresponding public/eft_boss_*.webp art.
// Local axes: +Z is the face, +X is the figure's left. Weapons use +X as barrel.
export type BossModelId = "glukhar" | "goons" | "jaeger" | "kaban" | "killa" | "kollontay" | "partisan" | "sanitar" | "special-cultists" | "tagilla" | "wedgie" | "zryachiy";
type Point = [number, number, number];
type Parent = THREE.Group;
type Mat = THREE.Material;
const YELLOW = 0xffc51b;
const INK = 0x17231b;

function material(color: number, metalness = 0): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: metalness ? 0.55 : 0.8, metalness });
}

function mesh(parent: Parent, geometry: THREE.BufferGeometry, mat: Mat, at: Point, edges = false) {
  const object = new THREE.Mesh(geometry, mat);
  object.position.set(...at);
  object.castShadow = object.receiveShadow = true;
  if (edges) object.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 35), new THREE.LineBasicMaterial({ color: INK })));
  parent.add(object);
  return object;
}

function box(parent: Parent, size: Point, mat: Mat, at: Point, edges = true) {
  return mesh(parent, new THREE.BoxGeometry(...size), mat, at, edges);
}

function oval(parent: Parent, size: Point, mat: Mat, at: Point) {
  const object = mesh(parent, new THREE.SphereGeometry(1, 24, 16), mat, at);
  object.scale.set(...size);
  return object;
}

function tube(parent: Parent, radius: number, length: number, mat: Mat, at: Point, axis: "x" | "y" | "z" = "y") {
  const object = mesh(parent, new THREE.CylinderGeometry(radius, radius, length, 24), mat, at);
  if (axis === "x") object.rotation.z = Math.PI / 2;
  if (axis === "z") object.rotation.x = Math.PI / 2;
  return object;
}

function limb(parent: Parent, from: Point, to: Point, width: number, mat: Mat, depth = width) {
  const start = new THREE.Vector3(...from), end = new THREE.Vector3(...to);
  const object = box(parent, [width, start.distanceTo(end), depth], mat, [0, 0, 0]);
  object.position.copy(start.clone().add(end).multiplyScalar(0.5));
  object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.sub(start).normalize());
  return object;
}

function curve(parent: Parent, points: Point[], radius: number, mat: Mat) {
  return mesh(parent, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))), 32, radius, 8, false), mat, [0, 0, 0]);
}

function texture(draw: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  draw(canvas.getContext("2d")!);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  return map;
}

function decal(parent: Parent, width: number, height: number, at: Point, draw: (ctx: CanvasRenderingContext2D) => void) {
  return mesh(parent, new THREE.PlaneGeometry(width, height), new THREE.MeshStandardMaterial({ map: texture(draw), transparent: true, roughness: 0.8 }), at);
}

function label(parent: Parent, text: string, width: number, height: number, at: Point, color = "#eee5c6") {
  return decal(parent, width, height, at, g => {
    g.fillStyle = color; g.font = "bold 62px sans-serif";
    g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(text, 128, 128, 246);
  });
}

function camo(desert = false) {
  const map = texture(g => {
    g.fillStyle = desert ? "#a08b52" : "#74804a";
    g.fillRect(0, 0, 256, 256);
    const colors = desert ? ["#726037", "#c0ae72", "#93804e"] : ["#304b2b", "#526534", "#9b995d", "#425635"];
    let seed = 51;
    const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
    for (let i = 0; i < 55; i++) {
      const x = rand() * 256, y = rand() * 256;
      g.fillStyle = colors[i % colors.length];
      g.beginPath();
      for (let j = 0; j < 9; j++) {
        const angle = j / 8 * Math.PI * 2, r = 10 + rand() * 22;
        const px = x + Math.cos(angle) * r, py = y + Math.sin(angle) * r;
        if (j === 0) g.moveTo(px, py); else g.lineTo(px, py);
      }
      g.closePath(); g.fill();
    }
  });
  return new THREE.MeshStandardMaterial({ map, roughness: 0.9 });
}

function hand(parent: Parent, at: Point, mat: Mat, rotation: Point = [0, 0, 0]) {
  const group = new THREE.Group(); group.position.set(...at); group.rotation.set(...rotation); parent.add(group);
  mesh(group, new THREE.TorusGeometry(0.145, 0.075, 10, 24, Math.PI * 1.55), mat, [0, 0, 0]);
  box(group, [0.16, 0.2, 0.18], mat, [-0.1, -0.03, -0.02], false);
  return group;
}

function arm(parent: Parent, shoulder: Point, elbow: Point, wrist: Point, sleeve: Mat, glove: Mat, bare = false) {
  limb(parent, shoulder, elbow, bare ? 0.36 : 0.38, sleeve);
  oval(parent, [0.2, 0.2, 0.2], sleeve, elbow);
  limb(parent, elbow, wrist, 0.32, sleeve);
  hand(parent, wrist, glove);
}

interface BodyOptions { coat: Mat; pants: Mat; boots?: Mat; width?: number; seated?: boolean; }
function body(parent: Parent, { coat, pants, boots = material(0x263029), width = 1, seated = false }: BodyOptions) {
  const torso = mesh(parent, new THREE.CylinderGeometry(0.8, 0.67, 1.18, 4), coat, [0, 2.1, 0], true);
  torso.rotation.y = Math.PI / 4;
  torso.scale.set(1.12 * width, 1, 0.76 * width);
  box(parent, [1.18 * width, 0.28, 0.65], pants, [0, 1.43, 0]);
  for (const side of [-1, 1]) {
    const hip: Point = [side * 0.34 * width, 1.4, 0];
    const knee: Point = seated ? [side * 0.55, 1.23, 0.85] : [side * 0.44 * width, 0.8, side * 0.07];
    const ankle: Point = seated ? [side * 0.6, 0.26, 1.02] : [side * 0.53 * width, 0.25, side * 0.1];
    limb(parent, hip, knee, 0.55 * width, pants, 0.62);
    oval(parent, [0.28 * width, 0.25, 0.31], pants, knee);
    limb(parent, knee, ankle, 0.54 * width, pants, 0.62);
    box(parent, [0.62 * width, 0.3, 0.84], boots, [ankle[0], 0.19, ankle[2] + 0.12]);
    box(parent, [0.63 * width, 0.07, 0.85], material(0x19231c), [ankle[0], 0.055, ankle[2] + 0.12]);
  }
  tube(parent, 0.23, 0.19, material(YELLOW), [0, 2.78, 0]);
}

function head(parent: Parent, options: { beard?: number; hair?: number; bald?: boolean } = {}) {
  const group = new THREE.Group(); group.position.set(0, 3.14, 0); parent.add(group);
  tube(group, 0.47, 0.68, material(YELLOW), [0, 0, 0]);
  for (const side of [-1, 1]) oval(group, [0.1, 0.15, 0.1], material(YELLOW), [side * 0.47, -0.02, 0]);
  const face = texture(g => {
    g.fillStyle = "#ffca1c"; g.fillRect(0, 0, 256, 256);
    g.fillStyle = "#17231b";
    for (const x of [84, 173]) { g.beginPath(); g.ellipse(x, 109, 12, 15, 0, 0, Math.PI * 2); g.fill(); }
    g.strokeStyle = "#17231b"; g.lineWidth = 12; g.lineCap = "round";
    g.beginPath(); g.moveTo(56, 73); g.lineTo(111, 84); g.moveTo(200, 73); g.lineTo(145, 84); g.stroke();
    g.lineWidth = 6; g.beginPath(); g.moveTo(96, 191); g.quadraticCurveTo(128, 172, 162, 191); g.stroke();
    if (options.bald) { g.beginPath(); g.moveTo(78, 181); g.quadraticCurveTo(74, 149, 97, 144); g.moveTo(178, 181); g.quadraticCurveTo(184, 153, 164, 145); g.stroke(); }
  });
  mesh(group, new THREE.CylinderGeometry(0.477, 0.477, 0.68, 32, 1, true, -1.08, 2.16), new THREE.MeshStandardMaterial({ map: face }), [0, 0, 0]);
  if (options.hair !== undefined) {
    const hair = material(options.hair);
    const cap = mesh(group, new THREE.SphereGeometry(0.5, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), hair, [0, 0.25, -0.02]);
    cap.scale.y = 0.65;
    box(group, [0.83, 0.48, 0.25], hair, [0, 0.02, -0.34], false);
    for (let i = 0; i < 5; i++) {
      const lock = oval(group, [0.12, 0.1, 0.32], hair, [-0.34 + i * 0.16, 0.3, 0.1]);
      lock.rotation.z = -0.3;
    }
  }
  if (options.beard !== undefined) {
    const beard = material(options.beard);
    oval(group, [0.44, 0.28, 0.27], beard, [0, -0.27, 0.22]);
    for (const side of [-1, 1]) oval(group, [0.14, 0.27, 0.16], beard, [side * 0.35, -0.08, 0.21]);
    curve(group, [[-0.24, -0.12, 0.45], [0, -0.07, 0.51], [0.24, -0.12, 0.45]], 0.07, beard);
    curve(group, [[-0.13, -0.22, 0.486], [0, -0.19, 0.505], [0.13, -0.22, 0.486]], 0.022, material(YELLOW));
    for (const x of [-0.22, 0, 0.22]) curve(group, [[x, -0.3, 0.45], [x * 0.8, -0.45, 0.36]], 0.013, material(INK));
  }
  return group;
}

function beanie(headGroup: Parent, color: number, patch = false) {
  const mat = material(color);
  const cap = mesh(headGroup, new THREE.SphereGeometry(0.53, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), mat, [0, 0.28, 0]);
  cap.scale.y = 0.76;
  tube(headGroup, 0.54, 0.2, mat, [0, 0.31, 0]);
  if (patch) box(headGroup, [0.18, 0.15, 0.035], material(0x95834b), [0, 0.32, 0.542]);
  for (let i = 0; i < 10; i++) {
    const angle = i / 10 * Math.PI * 2;
    curve(headGroup, [[Math.sin(angle) * 0.5, 0.4, Math.cos(angle) * 0.5], [Math.sin(angle) * 0.32, 0.6, Math.cos(angle) * 0.32]], 0.009, material(0x494c31));
  }
}

function vest(parent: Parent, color: number, rows = 2, columns = 3, width = 1) {
  const cloth = material(color), dark = material(0x333923);
  box(parent, [1.16 * width, 0.96, 0.14], cloth, [0, 2.11, 0.45]);
  box(parent, [1.13 * width, 1.02, 0.12], cloth, [0, 2.12, -0.45]);
  for (const side of [-1, 1]) box(parent, [0.17, 1.1, 0.13], cloth, [side * 0.46 * width, 2.17, 0.43]);
  for (let row = 0; row < rows; row++) for (let col = 0; col < columns; col++) {
    const x = (col - (columns - 1) / 2) * 0.34 * width, y = 1.86 + row * 0.38;
    box(parent, [0.29 * width, 0.33, 0.16], cloth, [x, y, 0.58]);
    box(parent, [0.3 * width, 0.11, 0.035], dark, [x, y + 0.09, 0.678]);
    box(parent, [0.06, 0.09, 0.025], cloth, [x, y + 0.01, 0.704], false);
  }
}

function backpack(parent: Parent, color = 0x45513a) {
  const mat = material(color);
  box(parent, [1.04, 1.18, 0.47], mat, [0, 2.16, -0.66]);
  box(parent, [0.68, 0.5, 0.13], mat, [0, 1.98, -0.96]);
  for (const side of [-1, 1]) box(parent, [0.1, 1.05, 0.06], material(INK), [side * 0.36, 2.16, -0.92]);
}

function rifle(kind: "ak" | "scope" | "shotgun" | "pistol" = "ak") {
  const group = new THREE.Group(), steel = material(0x36443b, 0.25), black = material(0x151e19), wood = material(0x875321);
  if (kind === "pistol") {
    box(group, [0.65, 0.18, 0.16], steel, [0.14, 0, 0]);
    box(group, [0.18, 0.38, 0.16], black, [-0.09, -0.2, 0]);
    tube(group, 0.055, 0.4, steel, [0.62, 0, 0], "x");
    tube(group, 0.032, 0.005, black, [0.823, 0, 0], "x");
    return group;
  }
  box(group, [0.7, 0.21, 0.19], wood, [-0.85, -0.07, 0]);
  box(group, [0.1, 0.32, 0.23], black, [-1.21, -0.09, 0]);
  box(group, [0.85, 0.23, 0.22], steel, [-0.1, 0, 0]);
  box(group, [0.16, 0.32, 0.16], black, [-0.3, -0.2, 0]);
  box(group, [0.64, 0.2, 0.23], kind === "shotgun" ? black : wood, [0.63, 0, 0]);
  tube(group, 0.055, 1.05, steel, [1.33, 0.015, 0], "x");
  tube(group, 0.078, 0.14, steel, [1.86, 0.015, 0], "x");
  tube(group, 0.04, 0.006, black, [1.934, 0.015, 0], "x");
  if (kind === "shotgun") {
    tube(group, 0.06, 0.87, steel, [0.77, -0.085, 0], "x");
    for (let i = 0; i < 7; i++) box(group, [0.025, 0.22, 0.25], steel, [0.35 + i * 0.08, 0, 0], false);
  } else {
    for (let i = 0; i < 5; i++) {
      const mag = box(group, [0.24, 0.14, 0.16], steel, [0.14 + i * i * 0.009, -0.15 - i * 0.105, 0]);
      mag.rotation.z = i * 0.1;
    }
    box(group, [0.07, 0.22, 0.07], black, [1.65, 0.09, 0]);
  }
  if (kind === "scope") {
    for (const x of [-0.2, 0.3]) box(group, [0.07, 0.17, 0.1], black, [x, 0.19, 0]);
    tube(group, 0.095, 0.7, steel, [0.02, 0.32, 0], "x");
    tube(group, 0.13, 0.2, black, [0.43, 0.32, 0], "x");
    tube(group, 0.102, 0.006, material(0x638477), [0.533, 0.32, 0], "x");
  }
  return group;
}

function holdRifle(parent: Parent, kind: "ak" | "scope" | "shotgun", at: Point, angle: number, sleeve: Mat, glove: Mat, scale = 0.85) {
  const gun = rifle(kind); gun.position.set(...at); gun.rotation.z = angle; gun.scale.setScalar(scale); parent.add(gun);
  const grip = (p: Point): Point => {
    const v = new THREE.Vector3(...p).multiplyScalar(scale).applyAxisAngle(new THREE.Vector3(0, 0, 1), angle).add(new THREE.Vector3(...at));
    return [v.x, v.y, v.z];
  };
  arm(parent, [-0.73, 2.5, 0], [-0.83, 1.94, 0.35], grip([-0.3, -0.24, 0.02]), sleeve, glove);
  arm(parent, [0.73, 2.5, 0], [0.87, 1.99, 0.35], grip([0.68, -0.08, 0.03]), sleeve, glove);
  return gun;
}

function helmet(parent: Parent, welding = false) {
  const shell = material(welding ? 0x292d2c : 0x343f38), plate = material(0x4c5450, 0.2), black = material(0x090e0b);
  const headGroup = new THREE.Group(); headGroup.position.y = 3.14; parent.add(headGroup);
  oval(headGroup, [0.59, 0.58, 0.54], shell, [0, 0.12, -0.02]);
  box(headGroup, [1.02, 0.72, 0.38], shell, [0, -0.03, 0.03]);
  box(headGroup, [0.92, 0.83, 0.18], plate, [0, -0.03, 0.48]);
  box(headGroup, [0.76, 0.29, 0.08], black, [0, 0.04, 0.59]);
  box(headGroup, [0.65, 0.18, 0.02], material(0x030806), [0, 0.04, 0.636]);
  box(headGroup, [0.027, 0.17, 0.01], material(0x747d73), [-0.28, 0.04, 0.65], false);
  for (const side of [-1, 1]) tube(headGroup, 0.09, 0.08, shell, [side * 0.56, 0.08, 0.25], "x");
  if (welding) label(headGroup, "УБЕЙ", 0.72, 0.22, [0, 0.28, 0.578], "#a6211b");
  else for (const x of [-0.22, -0.07, 0.08]) {
    box(headGroup, [0.075, 0.25, 0.012], material(0x8a9387), [x, 0.3, 0.578], false);
    box(headGroup, [0.075, 0.3, 0.012], material(0x8a9387), [x, -0.3, 0.578], false);
    curve(headGroup, [[x, 0.46, 0.38], [x, 0.67, 0.03], [x, 0.5, -0.36]], 0.035, material(0x7b857a));
  }
}

function makeKilla() {
  const root = new THREE.Group(), suit = material(0x29332e), skin = material(YELLOW);
  body(root, { coat: suit, pants: suit }); vest(root, 0x655e31, 1, 4); helmet(root);
  label(root, "KILLA", 0.88, 0.26, [0, 2.42, 0.534]);
  arm(root, [-0.73, 2.5, 0], [-0.96, 2.06, 0.23], [-1.12, 2.55, 0.61], suit, skin);
  arm(root, [0.73, 2.5, 0], [0.88, 2.04, 0.02], [0.83, 1.58, 0.24], suit, skin);
  for (const offset of [-0.075, 0.075]) {
    curve(root, [[0.84 + offset, 2.56, 0.17], [1.06 + offset, 2.05, 0.18], [0.99 + offset, 1.65, 0.28]], 0.026, material(0xdedfd3));
    curve(root, [[-0.84 + offset, 2.55, 0.14], [-1.1 + offset, 2.08, 0.32], [-1.23 + offset, 2.49, 0.61]], 0.024, material(0xdedfd3));
  }
  const pistol = rifle("pistol"); pistol.position.set(-1.1, 2.69, 0.62); pistol.rotation.z = 1.8; root.add(pistol);
  const backGun = rifle(); backGun.position.set(0.55, 2.39, -0.63); backGun.rotation.z = 1.36; backGun.scale.setScalar(0.8); root.add(backGun);
  return root;
}

function makeKollontay() {
  const root = new THREE.Group();
  const armor = material(0x252c30), trim = material(0x11191d), steel = material(0x525c60, 0.4);
  const urbanMap = texture(g => {
    g.fillStyle = "#8caaae"; g.fillRect(0, 0, 256, 256);
    const colors = ["#d6dfd6", "#415d6d", "#243a47", "#748b88"];
    for (let i = 0; i < 64; i++) {
      const x = (i * 73) % 288 - 24, y = (i * 47) % 256;
      g.fillStyle = colors[i % colors.length];
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + 43, y - 9);
      g.lineTo(x + 69, y + 3); g.lineTo(x + 34, y + 13);
      g.lineTo(x + 13, y + 25); g.lineTo(x - 18, y + 18); g.closePath(); g.fill();
    }
  });
  const uniform = new THREE.MeshStandardMaterial({ map: urbanMap, roughness: 0.95 });
  body(root, { coat: uniform, pants: uniform, boots: trim, width: 1.08 });
  vest(root, 0x2c3435, 1, 3, 1.08);
  box(root, [0.97, 0.4, 0.19], armor, [0, 2.43, 0.49]);
  box(root, [0.67, 0.42, 0.16], armor, [0, 1.34, 0.44]);
  box(root, [1.32, 0.16, 0.76], trim, [0, 1.56, 0]);
  box(root, [0.23, 0.18, 0.055], steel, [0, 1.56, 0.414]);
  for (const side of [-1, 1]) {
    box(root, [0.33, 0.44, 0.31], armor, [side * 0.72, 1.67, 0.02]);
    box(root, [0.61, 0.13, 0.7], trim, [side * 0.48, 0.91, side * 0.07]);
    box(root, [0.49, 0.4, 0.17], armor, [side * 0.48, 0.84, side * 0.07 + 0.36]);
    box(root, [0.43, 0.48, 0.14], armor, [side * 0.55, 0.45, side * 0.1 + 0.34]);
    for (const y of [0.32, 0.52]) box(root, [0.58, 0.065, 0.67], trim, [side * 0.55, y, side * 0.1]);
    for (let i = 0; i < 3; i++) {
      const plate = box(root, [0.46, 0.16, 0.62], armor, [side * (0.74 + i * 0.065), 2.66 - i * 0.13, 0]);
      plate.rotation.z = side * 0.24;
    }
    curve(root, [[side * 0.28, 2.76, -0.2], [side * 0.47, 2.71, 0.06], [side * 0.46, 2.56, 0.43]], 0.09, armor);
  }
  for (let i = 0; i < 10; i++) {
    tube(root, 0.034, 0.17, material(0x737844), [-0.5 + i * 0.11, 1.57, 0.425]);
    tube(root, 0.036, 0.04, material(0xafa06a, 0.4), [-0.5 + i * 0.11, 1.67, 0.425]);
  }

  const mask = new THREE.Group(); mask.position.y = 3.15; root.add(mask);
  oval(mask, [0.54, 0.53, 0.49], trim, [0, 0, 0]);
  const dome = mesh(mask, new THREE.SphereGeometry(0.59, 28, 18, 0, Math.PI * 2, 0, Math.PI / 2), armor, [0, 0.12, -0.03]);
  dome.scale.y = 0.88;
  tube(mask, 0.59, 0.08, trim, [0, 0.13, -0.03]);
  const visor = mesh(mask, new THREE.CylinderGeometry(0.61, 0.64, 0.64, 32, 1, true, -1.22, 2.44), material(0x18252c, 0.45), [0, -0.16, 0]);
  visor.material.side = THREE.DoubleSide;
  for (const y of [-0.49, 0.17]) {
    const radius = y < 0 ? 0.64 : 0.61;
    curve(mask, Array.from({ length: 13 }, (_, i): Point => {
      const angle = -1.22 + i / 12 * 2.44;
      return [Math.sin(angle) * radius, y, Math.cos(angle) * radius];
    }), 0.023, steel);
  }
  for (const side of [-1, 1]) {
    tube(mask, 0.084, 0.08, steel, [side * 0.58, 0.14, 0.2], "x");
    tube(mask, 0.038, 0.088, trim, [side * 0.58, 0.14, 0.2], "x");
  }

  const gun = new THREE.Group(); gun.position.set(0.02, 2.43, 0.92); gun.scale.setScalar(0.86); root.add(gun);
  const wood = material(0xb85920);
  box(gun, [0.69, 0.23, 0.2], trim, [-0.86, -0.05, 0]);
  box(gun, [0.12, 0.34, 0.25], armor, [-1.2, -0.08, 0]);
  box(gun, [0.91, 0.25, 0.23], steel, [-0.1, 0, 0]);
  box(gun, [0.17, 0.36, 0.17], trim, [-0.3, -0.22, 0]);
  box(gun, [0.62, 0.22, 0.25], wood, [0.65, 0, 0]);
  tube(gun, 0.36, 0.27, trim, [0.22, -0.4, 0], "z");
  tube(gun, 0.28, 0.012, armor, [0.22, -0.4, 0.143], "z");
  tube(gun, 0.15, 0.015, trim, [0.22, -0.4, 0.158], "z");
  tube(gun, 0.06, 1.02, steel, [1.4, 0.025, 0], "x");
  tube(gun, 0.039, 0.77, armor, [1.31, 0.15, 0], "x");
  tube(gun, 0.086, 0.2, armor, [1.92, 0.025, 0], "x");
  tube(gun, 0.046, 0.009, trim, [2.024, 0.025, 0], "x");
  box(gun, [0.07, 0.3, 0.08], steel, [1.78, 0.14, 0]);
  box(gun, [0.25, 0.12, 0.15], trim, [-0.15, 0.2, 0]);
  for (let i = 0; i < 4; i++) box(gun, [0.04, 0.06, 0.26], armor, [0.44 + i * 0.12, 0.12, 0], false);
  arm(root, [-0.79, 2.5, 0], [-0.94, 2.09, 0.45], [-0.238, 2.241, 0.92], uniform, trim);
  arm(root, [0.79, 2.5, 0], [1.05, 2.18, 0.47], [0.605, 2.344, 0.92], uniform, trim);
  limb(root, [-0.91, 2.1, 0.59], [-0.43, 2.22, 0.94], 0.37, armor, 0.16);
  limb(root, [1.04, 2.19, 0.61], [0.73, 2.31, 0.94], 0.37, armor, 0.16);
  return root;
}

function makeGlukhar() {
  const root = new THREE.Group(), upper = new THREE.Group();
  const shirt = material(0x30392a), pants = material(0x44473a), boots = material(0x373c30);
  const skin = material(YELLOW), glove = material(0x1a231c), rig = material(0x858772), woodland = camo();
  upper.position.set(0, -0.57, 0.13); upper.rotation.x = 0.09; root.add(upper);
  const torso = mesh(upper, new THREE.CylinderGeometry(0.8, 0.67, 1.18, 4), shirt, [0, 2.1, 0], true);
  torso.rotation.y = Math.PI / 4; torso.scale.set(1.18, 1, 0.8);
  tube(upper, 0.23, 0.19, skin, [0, 2.78, 0]);
  const h = head(upper, { bald: true });
  const hair = material(0x302b24);
  const crop = mesh(h, new THREE.SphereGeometry(0.49, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), hair, [0, 0.29, -0.09]);
  crop.scale.set(0.81, 0.18, 0.79);
  box(h, [0.77, 0.29, 0.17], hair, [0, 0.15, -0.4], false);
  for (const side of [-1, 1]) box(h, [0.07, 0.22, 0.18], hair, [side * 0.44, 0.13, -0.14], false);
  box(upper, [1.09, 0.77, 0.12], rig, [0, 1.96, 0.47]);
  box(upper, [1.11, 0.99, 0.17], woodland, [0, 2.1, -0.48]);
  for (const side of [-1, 1]) {
    box(upper, [0.25, 0.97, 0.16], woodland, [side * 0.49, 2.23, 0.43]);
    curve(upper, [[side * 0.49, 2.63, 0.44], [side * 0.52, 2.79, 0], [side * 0.49, 2.62, -0.47]], 0.13, woodland);
    box(upper, [0.37, 0.4, 0.18], rig, [side * 0.29, 1.84, 0.61]);
    box(upper, [0.38, 0.1, 0.03], material(0x60634e), [side * 0.29, 1.97, 0.715]);
  }
  box(root, [1.21, 0.28, 0.68], pants, [0, 1.01, 0.2]);
  for (const side of [-1, 1]) {
    const hip: Point = [side * 0.35, 1.06, 0.19];
    const knee: Point = [side * 0.65, side < 0 ? 0.94 : 0.68, 0.94];
    const ankle: Point = [side * 0.57, 0.24, side < 0 ? 0.4 : -0.19];
    limb(root, hip, knee, 0.58, pants, 0.63);
    oval(root, [0.3, 0.28, 0.32], pants, knee);
    limb(root, knee, ankle, 0.5, pants, 0.56);
    box(root, [0.6, 0.31, 0.83], boots, [ankle[0], 0.2, ankle[2] + 0.14]);
    box(root, [0.62, 0.08, 0.85], glove, [ankle[0], 0.055, ankle[2] + 0.14]);
    for (let i = 0; i < 3; i++) box(root, [0.31, 0.025, 0.04], rig, [ankle[0], 0.365, ankle[2] + 0.18 + i * 0.1], false);
  }

  const gun = new THREE.Group(); gun.position.set(0.03, 2.26, 0.94); gun.rotation.y = -0.32; gun.scale.setScalar(0.88); upper.add(gun);
  const steel = material(0x404a42, 0.35);
  box(gun, [0.97, 0.35, 0.27], steel, [-0.25, 0, 0]);
  box(gun, [0.44, 0.32, 0.25], glove, [-0.94, -0.05, 0]);
  box(gun, [0.12, 0.43, 0.3], boots, [-1.17, -0.06, 0]);
  box(gun, [0.23, 0.48, 0.22], glove, [-0.49, -0.33, 0]);
  box(gun, [0.17, 0.34, 0.18], glove, [0.09, -0.25, 0]);
  box(gun, [0.83, 0.32, 0.29], steel, [0.65, 0, 0]);
  box(gun, [0.15, 0.28, 0.17], glove, [0.7, -0.24, 0]);
  for (let i = 0; i < 7; i++) box(gun, [0.045, 0.36, 0.33], glove, [0.3 + i * 0.105, 0, 0], false);
  tube(gun, 0.082, 0.5, steel, [1.27, 0.04, 0], "x");
  tube(gun, 0.14, 0.32, boots, [1.6, 0.04, 0], "x");
  tube(gun, 0.081, 0.01, glove, [1.766, 0.04, 0], "x");
  for (const x of [-0.42, 0.12]) box(gun, [0.08, 0.21, 0.13], glove, [x, 0.26, 0]);
  tube(gun, 0.12, 0.71, steel, [-0.18, 0.41, 0], "x");
  tube(gun, 0.19, 0.23, glove, [0.27, 0.41, 0], "x");
  tube(gun, 0.151, 0.012, material(0x64837a, 0.45), [0.392, 0.41, 0], "x");
  tube(gun, 0.075, 0.15, glove, [-0.14, 0.55, 0]);
  for (const side of [-1, 1]) {
    const shoulder: Point = [side * 0.78, 2.51, 0];
    const sleeveEnd: Point = [side * 0.89, 2.28, 0.12];
    const elbow: Point = [side * 1.01, 1.98, 0.41];
    const grip = new THREE.Vector3(side < 0 ? 0.09 : 0.7, -0.24, 0).multiplyScalar(0.88).applyEuler(gun.rotation).add(gun.position);
    const wrist: Point = [grip.x, grip.y, grip.z];
    limb(upper, shoulder, sleeveEnd, 0.46, shirt);
    limb(upper, sleeveEnd, elbow, 0.4, skin);
    oval(upper, [0.22, 0.22, 0.22], skin, elbow);
    const forearm = limb(upper, elbow, wrist, 0.37, skin);
    hand(upper, wrist, glove);
    const ink = new THREE.Group(); ink.position.copy(forearm.position); ink.quaternion.copy(forearm.quaternion); upper.add(ink);
    decal(ink, 0.31, 0.37, [0, 0, 0.191], g => {
      g.strokeStyle = "#343d29"; g.lineWidth = 12; g.lineJoin = "miter";
      g.beginPath(); g.moveTo(128, 222); g.lineTo(101, 119); g.lineTo(28, 53);
      g.lineTo(95, 77); g.lineTo(128, 26); g.lineTo(161, 77);
      g.lineTo(228, 53); g.lineTo(155, 119); g.closePath(); g.stroke();
      g.beginPath(); g.moveTo(49, 103); g.lineTo(75, 170); g.lineTo(103, 145);
      g.moveTo(207, 103); g.lineTo(181, 170); g.lineTo(153, 145); g.stroke();
    });
  }
  return root;
}

function makeKaban() {
  const root = new THREE.Group(), coat = material(0x46513c), pants = material(0x384b3c), skin = material(YELLOW), orange = material(0xa94719);
  body(root, { coat, pants, width: 1.35 }); head(root, { bald: true });
  box(root, [1.02, 1.13, 0.12], orange, [0, 2.1, 0.62]);
  for (let i = 0; i < 9; i++) box(root, [0.022, 1.06, 0.015], material(0x793717), [-0.44 + i * 0.11, 2.1, 0.69], false);
  for (const side of [-1, 1]) {
    box(root, [0.48, 1.77, 0.2], coat, [side * 0.69, 1.69, 0.48]);
    const lapel = box(root, [0.3, 0.65, 0.12], coat, [side * 0.6, 2.42, 0.66]); lapel.rotation.z = -side * 0.25;
    box(root, [0.33, 0.42, 0.06], coat, [side * 0.72, 1.22, 0.62]);
  }
  box(root, [1.1, 0.17, 0.12], material(0x685634), [0, 1.57, 0.64]);
  box(root, [0.34, 0.25, 0.04], material(0xd0a82e, 0.4), [0, 1.57, 0.72]);
  box(root, [0.23, 0.15, 0.02], coat, [0, 1.57, 0.748]);
  arm(root, [-0.99, 2.51, 0], [-1.2, 2.0, 0.2], [-1.15, 2.43, 0.67], coat, skin);
  arm(root, [0.99, 2.51, 0], [1.21, 2.06, 0.14], [0.81, 2.19, 0.72], coat, skin);
  const gun = rifle(); gun.scale.setScalar(0.82); gun.rotation.z = 1.88; gun.position.set(-1.28, 2.78, 0.57); root.add(gun);
  return root;
}

function makeSanitar() {
  const root = new THREE.Group(), blue = material(0x2d657c), darkBlue = material(0x244b59), glove = material(0x88b194);
  body(root, { coat: blue, pants: blue, boots: darkBlue });
  const h = head(root); beanie(h, 0xd2cb8c);
  curve(root, [[-0.57, 2.72, 0.12], [-0.49, 2.57, 0.46], [0, 2.32, 0.52], [0.49, 2.57, 0.46], [0.57, 2.72, 0.12]], 0.105, darkBlue);
  box(root, [0.045, 0.8, 0.02], darkBlue, [0, 1.98, 0.48], false);
  curve(root, [[-0.51, 2.68, 0.4], [-0.23, 2.1, 0.56], [0.7, 1.45, 0.49]], 0.08, material(0x77703a));
  box(root, [0.58, 0.65, 0.39], material(0x6e7138), [0.82, 1.4, 0.22]);
  box(root, [0.55, 0.29, 0.07], material(0x828046), [0.82, 1.59, 0.46]);
  arm(root, [-0.73, 2.5, 0], [-1.0, 2.11, 0.28], [-0.64, 2.94, 0.4], blue, material(YELLOW));
  const phone = box(root, [0.22, 0.51, 0.11], material(0x163c35), [-0.56, 2.99, 0.36]); phone.rotation.z = -0.28;
  arm(root, [0.73, 2.5, 0], [0.91, 2.0, 0.3], [0.46, 1.94, 0.82], blue, glove);
  const gun = rifle(); gun.position.set(-0.12, 2.07, 0.73); gun.rotation.z = 0.4; gun.scale.setScalar(0.91); root.add(gun);
  return root;
}

function bird(parent: Parent, at: Point) {
  const group = new THREE.Group(); group.position.set(...at); parent.add(group);
  const feathers = material(0x657967), dark = material(0x2c4436);
  oval(group, [0.29, 0.18, 0.16], feathers, [0, 0.23, 0]);
  oval(group, [0.13, 0.15, 0.13], feathers, [0.23, 0.4, 0]);
  const beak = mesh(group, new THREE.ConeGeometry(0.06, 0.18, 6), dark, [0.39, 0.4, 0]); beak.rotation.z = -Math.PI / 2;
  for (const z of [-0.112, 0.112]) oval(group, [0.026, 0.026, 0.014], material(0x080e09), [0.26, 0.44, z]);
  oval(group, [0.25, 0.11, 0.035], dark, [-0.04, 0.24, 0.15]);
  const tail = box(group, [0.35, 0.045, 0.15], dark, [-0.34, 0.14, 0]); tail.rotation.z = 0.25;
  for (const z of [-0.07, 0.07]) { limb(group, [0.02, 0.14, z], [0.04, 0, z], 0.026, dark); box(group, [0.15, 0.026, 0.026], dark, [0.06, 0, z]); }
}

function makePartisan() {
  const root = new THREE.Group(), coat = material(0x4c5c2d), pants = material(0x354b36), skin = material(YELLOW);
  body(root, { coat, pants }); head(root, { beard: 0x61715c, hair: 0x61715c }); vest(root, 0x666332, 2, 3); backpack(root);
  curve(root, [[-0.52, 2.7, 0.1], [-0.43, 2.57, 0.45], [0, 2.49, 0.53], [0.43, 2.57, 0.45], [0.52, 2.7, 0.1]], 0.095, material(0x394828));
  arm(root, [-0.73, 2.5, 0], [-1.0, 2.06, 0.19], [-1.14, 2.68, 0.45], coat, skin);
  bird(root, [-1.14, 2.87, 0.45]);
  arm(root, [0.73, 2.5, 0], [0.88, 1.98, 0.22], [0.65, 1.55, 0.66], coat, skin);
  const gun = rifle("scope"); gun.position.set(0, 1.57, 0.75); gun.rotation.z = 0.3; gun.scale.setScalar(0.86); root.add(gun);
  curve(root, [[-1.0, 1.3, 0.76], [-0.55, 0.85, 0.8], [0.48, 0.97, 0.76], [1.42, 1.98, 0.75]], 0.035, material(0x95703d));
  return root;
}

function dog(parent: Parent, at: Point) {
  const group = new THREE.Group(); group.position.set(...at); parent.add(group);
  const tan = material(0xb87c2d), black = material(0x29291e);
  oval(group, [0.34, 0.55, 0.33], tan, [0, 0.62, 0]);
  oval(group, [0.28, 0.38, 0.17], black, [0, 0.7, -0.19]);
  oval(group, [0.3, 0.3, 0.3], tan, [0, 1.2, 0.06]);
  oval(group, [0.2, 0.12, 0.26], tan, [0, 1.12, 0.33]);
  oval(group, [0.12, 0.075, 0.075], black, [0, 1.16, 0.54]);
  for (const side of [-1, 1]) {
    const ear = mesh(group, new THREE.ConeGeometry(0.13, 0.41, 4), tan, [side * 0.21, 1.54, 0.01]); ear.rotation.z = -side * 0.15;
    oval(group, [0.033, 0.038, 0.026], black, [side * 0.17, 1.28, 0.312]);
    limb(group, [side * 0.22, 0.67, 0.16], [side * 0.23, 0.12, 0.23], 0.14, tan);
    oval(group, [0.16, 0.1, 0.24], tan, [side * 0.23, 0.1, 0.35]);
  }
  oval(group, [0.09, 0.16, 0.04], material(0x9e3724), [0.05, 1.0, 0.47]);
  curve(group, [[0, 0.3, -0.2], [0.46, 0.17, -0.38], [0.56, 0.3, -0.31]], 0.08, black);
}

function makeJaeger() {
  const root = new THREE.Group(), coat = material(0x656332), skin = material(YELLOW);
  body(root, { coat, pants: camo(), seated: true }); const h = head(root, { beard: 0x292e27 }); beanie(h, 0x77713b, true);
  vest(root, 0xa3813d, 2, 2); backpack(root, 0x656334);
  for (let i = 0; i < 3; i++) { tube(root, 0.046, 0.29, material(0x9e491d), [0.34 + i * 0.09, 2.39, 0.67]); tube(root, 0.048, 0.065, material(0xb99a42, 0.3), [0.34 + i * 0.09, 2.24, 0.67]); }
  holdRifle(root, "shotgun", [0, 1.83, 1.02], 0.27, coat, skin, 0.84);
  const wood = material(0x72441f);
  box(root, [1.14, 1.15, 0.9], wood, [0, 0.59, -0.06]);
  for (const y of [0.15, 0.52, 0.92]) box(root, [1.17, 0.05, 0.035], material(0x392818), [0, y, 0.414]);
  dog(root, [-1.16, 0, 0.49]);
  tube(root, 0.37, 0.35, material(0x33382e, 0.3), [1.16, 0.19, 0.62]);
  tube(root, 0.32, 0.015, material(0x111b16), [1.16, 0.376, 0.62]);
  const handle = mesh(root, new THREE.TorusGeometry(0.37, 0.024, 8, 24, Math.PI), material(0x242e25), [1.16, 0.3, 0.62]);
  handle.rotation.y = Math.PI / 2;
  return root;
}

function makeTagilla() {
  const root = new THREE.Group(), skin = material(YELLOW), pants = material(0x29322e), red = material(0xa91f17);
  body(root, { coat: material(0x45482c), pants }); vest(root, 0x45492b, 2, 2); helmet(root, true);
  arm(root, [-0.73, 2.5, 0], [-0.94, 1.98, 0.18], [-0.77, 1.62, 0.67], skin, red, true);
  arm(root, [0.73, 2.5, 0], [0.94, 2.08, 0.23], [0.73, 2.14, 0.78], skin, red, true);
  // Tattoo curves follow the outer upper arm.
  for (let i = 0; i < 4; i++) curve(root, [[-0.85, 2.47 - i * 0.08, 0.21], [-1.01, 2.4 - i * 0.08, 0.22], [-0.91, 2.33 - i * 0.08, 0.26]], 0.018, material(0x707342));
  const hammer = new THREE.Group(); hammer.position.set(0, 1.51, 0.79); hammer.rotation.z = 0.63; root.add(hammer);
  tube(hammer, 0.08, 3.03, red, [0, 0, 0], "x");
  for (const x of [-1.47, 0.91]) tube(hammer, 0.095, 0.16, material(0x6f1713), [x, 0, 0], "x");
  box(hammer, [0.38, 0.85, 0.4], material(0x424b48, 0.4), [1.41, 0, 0]);
  for (const y of [-0.42, 0.42]) box(hammer, [0.45, 0.1, 0.46], material(0x656e67, 0.4), [1.41, y, 0]);
  const backGun = rifle(); backGun.position.set(-0.34, 2.16, -0.58); backGun.rotation.z = 2.13; backGun.scale.setScalar(0.74); root.add(backGun);
  box(root, [0.52, 0.23, 0.07], material(0x1b251f), [-0.46, 0.75, 0.34]);
  return root;
}

function makeGoons() {
  const root = new THREE.Group(), yellow = material(YELLOW), olive = material(0x52643a), tan = material(0x9a8146);
  // Birdeye: swept hair, tan face wrap and chest rig.
  const birdeye = new THREE.Group(); birdeye.position.set(-1.28, 0, -0.36); birdeye.rotation.y = -0.18; root.add(birdeye);
  body(birdeye, { coat: tan, pants: camo(true) }); const bHead = head(birdeye, { hair: 0x584a28 });
  oval(bHead, [0.44, 0.21, 0.22], tan, [0, -0.18, 0.31]);
  const wrap = mesh(bHead, new THREE.ConeGeometry(0.36, 0.36, 3), tan, [0, -0.34, 0.32]); wrap.rotation.z = Math.PI;
  vest(birdeye, 0x8b7642, 2, 3); backpack(birdeye, 0x6c6338);
  holdRifle(birdeye, "scope", [-0.2, 2.13, 0.82], 2.14, tan, material(0x555331), 0.77);
  for (const x of [-0.08, 0.04]) box(birdeye, [0.065, 0.4, 0.06], material(0xac5b53), [x, 1.29, 0.42]);

  // Big Pipe: bandana, dark glasses, full beard and raised gloved hand.
  const pipe = new THREE.Group(); pipe.position.set(1.28, 0, -0.4); pipe.rotation.y = 0.18; root.add(pipe);
  body(pipe, { coat: olive, pants: camo() }); const pHead = head(pipe, { beard: 0x273d2e });
  const bandana = material(0x2f4231);
  mesh(pHead, new THREE.SphereGeometry(0.51, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), bandana, [0, 0.25, 0]);
  tube(pHead, 0.5, 0.16, bandana, [0, 0.25, 0]);
  for (const side of [-1, 1]) {
    const lens = box(pHead, [0.36, 0.2, 0.055], material(0x14251d, 0.25), [side * 0.2, 0.06, 0.445]); lens.rotation.z = side * 0.07;
  }
  box(pHead, [0.14, 0.04, 0.04], material(INK), [0, 0.08, 0.478]);
  label(pHead, "☠", 0.25, 0.2, [-0.12, 0.35, 0.467]);
  curve(pHead, [[0.4, 0.25, -0.22], [0.65, 0.12, -0.27], [0.6, -0.15, -0.25]], 0.08, bandana);
  vest(pipe, 0x4b6033, 2, 3);
  arm(pipe, [-0.73, 2.5, 0], [-0.92, 2.03, 0.1], [-0.77, 1.62, 0.23], yellow, material(0x293c2d), true);
  arm(pipe, [0.73, 2.5, 0], [1.02, 2.12, 0.18], [0.67, 2.91, 0.51], yellow, material(0x293c2d), true);
  for (let i = 0; i < 3; i++) box(pipe, [0.15, 0.026, 0.03], material(0xa5b7a1), [0.7, 2.86 + i * 0.07, 0.6], false);
  tube(pipe, 0.16, 0.47, tan, [0.83, 1.46, 0.05]);

  // Knight in front: skull faceplate, green sleeves, loaded plate carrier.
  const knight = new THREE.Group(); knight.position.set(0, 0, 0.42); root.add(knight);
  body(knight, { coat: olive, pants: camo() }); vest(knight, 0x736336, 2, 3);
  const mask = new THREE.Group(); mask.position.y = 3.14; knight.add(mask);
  oval(mask, [0.54, 0.59, 0.49], material(0x323b2c), [0, 0.04, 0]);
  const skull = material(0xb9b99a);
  oval(mask, [0.49, 0.53, 0.15], skull, [0, 0.06, 0.39]);
  for (const side of [-1, 1]) {
    oval(mask, [0.17, 0.13, 0.025], material(0x15251d), [side * 0.23, 0.12, 0.53]);
    box(mask, [0.1, 0.2, 0.03], material(0x323b2c), [side * 0.42, -0.25, 0.45]);
  }
  oval(mask, [0.075, 0.09, 0.026], material(0x17251b), [0, -0.07, 0.546]);
  for (const x of [-0.25, -0.125, 0, 0.125, 0.25]) box(mask, [0.025, 0.18, 0.023], material(0x323b2c), [x, -0.32, 0.503], false);
  holdRifle(knight, "ak", [0, 2.12, 0.94], 0.65, yellow, yellow, 0.86);
  tube(knight, 0.13, 0.055, material(0x374837), [0.63, 2.36, 1.06], "z");
  for (const side of [-1, 1]) box(knight, [0.56, 0.12, 0.66], material(0x2d412a), [side * 0.44, 0.98, side * 0.06]);
  return root;
}

function makeSpecialCultists() {
  const root = new THREE.Group(), black = material(0x141b1e), cloth = material(0x303436);
  const armor = material(0x293b39), steel = material(0x4a5555, 0.35), bone = material(0xa4a798);
  const oni = new THREE.Group(); oni.name = "Oni"; oni.position.set(-1.36, 0, -0.38); oni.rotation.y = -0.23; root.add(oni);
  const ghost = new THREE.Group(); ghost.name = "Ghost"; ghost.position.set(1.36, 0, -0.38); ghost.rotation.y = 0.23; root.add(ghost);
  const harbinger = new THREE.Group(); harbinger.name = "Harbinger"; harbinger.position.z = 0.66; root.add(harbinger);

  function weapon(parent: Parent, kind: "sniper" | "carbine" | "machine-gun", at: Point, angle: number, sleeve: Mat) {
    const gun = new THREE.Group(); gun.position.set(...at); gun.rotation.z = angle; gun.scale.setScalar(0.76); parent.add(gun);
    box(gun, [0.82, 0.25, 0.23], steel, [-0.13, 0, 0]);
    box(gun, [0.63, 0.12, 0.15], black, [-0.84, -0.02, 0]);
    box(gun, [0.11, 0.32, 0.22], black, [-1.16, -0.1, 0]);
    box(gun, [0.17, 0.34, 0.18], black, [-0.3, -0.22, 0]);
    box(gun, [0.74, 0.23, 0.25], armor, [0.64, 0, 0]);
    for (let i = 0; i < 6; i++) box(gun, [0.035, 0.27, 0.28], black, [0.35 + i * 0.12, 0, 0], false);
    if (kind === "machine-gun") {
      box(gun, [0.58, 0.54, 0.42], armor, [0.17, -0.38, 0.1]);
      box(gun, [0.61, 0.09, 0.45], steel, [0.17, -0.15, 0.1]);
      tube(gun, 0.065, 1.33, steel, [1.66, 0.04, 0], "x");
      tube(gun, 0.09, 0.15, black, [2.34, 0.04, 0], "x");
      tube(gun, 0.043, 0.008, black, [2.419, 0.04, 0], "x");
      for (const z of [-0.13, 0.13]) limb(gun, [1.38, -0.04, z], [2.12, -0.16, z], 0.035, steel);
      curve(gun, [[-0.25, 0.17, 0], [-0.25, 0.42, 0], [0.23, 0.42, 0], [0.23, 0.17, 0]], 0.035, black);
    } else {
      const magazine = box(gun, [0.25, 0.5, 0.19], black, [0.13, -0.34, 0]); magazine.rotation.z = -0.12;
      const length = kind === "sniper" ? 1.2 : 0.54;
      tube(gun, 0.065, length, steel, [1.02 + length / 2, 0.02, 0], "x");
      tube(gun, 0.115, 0.61, black, [1.28 + length, 0.02, 0], "x");
      tube(gun, 0.058, 0.008, steel, [1.59 + length, 0.02, 0], "x");
      box(gun, [0.09, 0.15, 0.11], black, [-0.12, 0.2, 0]);
      if (kind === "sniper") {
        tube(gun, 0.11, 0.75, black, [-0.08, 0.32, 0], "x");
        tube(gun, 0.16, 0.18, steel, [0.36, 0.32, 0], "x");
        tube(gun, 0.128, 0.01, material(0x4c777b, 0.45), [0.455, 0.32, 0], "x");
      } else {
        box(gun, [0.31, 0.22, 0.23], black, [-0.09, 0.32, 0]);
        box(gun, [0.018, 0.13, 0.15], material(0x607d79, 0.4), [0.075, 0.34, 0]);
      }
    }
    function grip(x: number, y: number): Point {
      const p = new THREE.Vector3(x, y, 0).multiplyScalar(0.76).applyEuler(gun.rotation).add(gun.position);
      return [p.x, p.y, p.z];
    }
    arm(parent, [-0.73, 2.5, 0], [-0.96, 2.02, 0.35], grip(-0.3, -0.22), sleeve, black);
    arm(parent, [0.73, 2.5, 0], [0.94, 1.96, 0.38], grip(0.68, -0.1), sleeve, black);
  }

  body(oni, { coat: cloth, pants: black, boots: black }); vest(oni, 0x263735, 2, 3); backpack(oni, 0x253635);
  tube(oni, 0.3, 0.23, black, [0, 2.8, 0]);
  const oniHead = new THREE.Group(); oniHead.position.y = 3.14; oni.add(oniHead);
  tube(oniHead, 0.47, 0.71, black, [0, 0, 0]);
  const skullMap = texture(g => {
    g.fillStyle = "#192125"; g.fillRect(0, 0, 256, 256);
    g.fillStyle = "#a8ad9f";
    g.beginPath(); g.moveTo(39, 112); g.lineTo(81, 132); g.lineTo(128, 117);
    g.lineTo(175, 132); g.lineTo(217, 112); g.lineTo(200, 187);
    g.lineTo(169, 226); g.lineTo(87, 226); g.lineTo(56, 187); g.closePath(); g.fill();
    g.fillStyle = "#242c2b"; g.beginPath(); g.moveTo(128, 139); g.lineTo(109, 171); g.lineTo(147, 171); g.closePath(); g.fill();
    g.strokeStyle = "#242c2b"; g.lineWidth = 7;
    g.beginPath(); g.moveTo(70, 185); g.quadraticCurveTo(128, 207, 187, 185); g.stroke();
    for (let x = 81; x < 189; x += 18) { g.beginPath(); g.moveTo(x, 182); g.lineTo(x - 3, 220); g.stroke(); }
    g.fillStyle = "#8b7855";
    for (const x of [77, 180]) { g.fillRect(x - 23, 78, 46, 17); g.fillStyle = "#151d1c"; g.fillRect(x - 8, 79, 13, 16); g.fillStyle = "#8b7855"; }
  });
  mesh(oniHead, new THREE.CylinderGeometry(0.478, 0.478, 0.71, 32, 1, true, -1.06, 2.12), new THREE.MeshStandardMaterial({ map: skullMap, roughness: 0.95 }), [0, 0, 0]);
  beanie(oniHead, 0x283c3b);
  for (const side of [-1, 1]) {
    box(oniHead, [0.18, 0.39, 0.27], armor, [side * 0.52, 0.08, -0.02]);
    box(oniHead, [0.09, 0.25, 0.18], black, [side * 0.64, 0.08, -0.02]);
  }
  curve(oniHead, [[-0.54, 0.16, 0], [-0.43, 0.61, 0], [0, 0.72, 0], [0.43, 0.61, 0], [0.54, 0.16, 0]], 0.048, black);
  curve(oniHead, [[-0.59, -0.04, 0.1], [-0.56, -0.22, 0.38], [-0.27, -0.24, 0.53]], 0.028, steel);
  weapon(oni, "sniper", [-0.39, 2.2, 0.86], -1.72, cloth);

  body(ghost, { coat: armor, pants: material(0x263130), boots: black }); vest(ghost, 0x39423a, 2, 3); backpack(ghost, 0x303c32);
  tube(ghost, 0.3, 0.23, black, [0, 2.8, 0]);
  const ghostHead = new THREE.Group(); ghostHead.position.y = 3.14; ghost.add(ghostHead);
  oval(ghostHead, [0.54, 0.51, 0.5], black, [0, 0.02, 0]);
  const dome = mesh(ghostHead, new THREE.SphereGeometry(0.61, 28, 18, 0, Math.PI * 2, 0, Math.PI / 2), armor, [0, 0.14, -0.03]); dome.scale.y = 0.88;
  tube(ghostHead, 0.61, 0.11, black, [0, 0.15, -0.03]);
  const visor = mesh(ghostHead, new THREE.CylinderGeometry(0.63, 0.65, 0.63, 32, 1, true, -1.16, 2.32), material(0x233637, 0.5), [0, -0.14, 0]); visor.material.side = THREE.DoubleSide;
  for (const y of [-0.46, 0.18]) curve(ghostHead, Array.from({ length: 13 }, (_, i): Point => {
    const angle = -1.16 + i / 12 * 2.32;
    return [Math.sin(angle) * 0.65, y, Math.cos(angle) * 0.65];
  }), 0.022, steel);
  for (const side of [-1, 1]) {
    tube(ghostHead, 0.1, 0.1, steel, [side * 0.6, 0.16, 0.17], "x");
    box(ghost, [0.44, 0.28, 0.54], armor, [side * 0.78, 2.53, 0]);
    box(ghost, [0.46, 0.35, 0.13], black, [side * 0.44, 0.85, side * 0.07 + 0.34]);
  }
  box(ghostHead, [0.15, 0.19, 0.23], steel, [-0.6, 0.33, 0.04]);
  curve(ghostHead, [[-0.36, 0.08, 0.56], [-0.39, -0.1, 0.55], [-0.38, -0.31, 0.56]], 0.012, material(0x6a7c77));
  weapon(ghost, "machine-gun", [0.25, 1.98, 0.96], -1.23, armor);

  body(harbinger, { coat: cloth, pants: black, boots: black });
  const face = head(harbinger, { bald: true }); face.scale.setScalar(0.93);
  const hood = mesh(harbinger, new THREE.SphereGeometry(0.66, 28, 20, 0, Math.PI * 2, 0.79, Math.PI - 0.79), cloth, [0, 3.16, 0]);
  hood.rotation.x = Math.PI / 2; hood.scale.set(1, 1.02, 1.25); hood.material.side = THREE.DoubleSide;
  curve(harbinger, [[-0.43, 2.76, 0.4], [-0.56, 3.12, 0.46], [-0.36, 3.62, 0.41], [0, 3.86, 0.24], [0.36, 3.62, 0.41], [0.56, 3.12, 0.46], [0.43, 2.76, 0.4]], 0.095, cloth);
  curve(harbinger, [[0, 3.87, 0.25], [0, 3.92, -0.12], [0, 3.57, -0.67], [0, 2.89, -0.55]], 0.015, material(0x555350));
  box(harbinger, [0.77, 0.13, 0.25], black, [0, 3.38, 0.4], false);
  const robe = mesh(harbinger, new THREE.CylinderGeometry(0.64, 0.95, 1.31, 8, 1, true), cloth, [0, 1.04, 0], true); robe.scale.z = 0.73; robe.material.side = THREE.DoubleSide;
  for (const side of [-1, 1]) {
    curve(harbinger, [[side * 0.51, 2.72, 0.34], [side * 0.41, 2.46, 0.5], [side * 0.18, 2.29, 0.51]], 0.11, black);
    curve(harbinger, [[side * 0.32, 1.58, 0.43], [side * 0.43, 1.02, 0.55], [side * 0.53, 0.4, 0.56]], 0.022, black);
    box(harbinger, [0.43, 0.27, 0.055], black, [side * 0.36, 1.76, 0.45]);
  }
  curve(harbinger, [[-0.4, 2.68, 0.48], [0.02, 2.19, 0.55], [0.48, 1.64, 0.49]], 0.065, black);
  tube(harbinger, 0.045, 0.11, bone, [-0.3, 2.56, 0.57]);
  weapon(harbinger, "carbine", [0.02, 2.04, 0.88], -0.56, cloth);
  return root;
}

function makeWedgie() {
  const root = new THREE.Group();
  const coat = material(0x303a3e), trim = material(0x18272d), armor = material(0x253137);
  const steel = material(0x526167, 0.35), glove = material(0x273338), black = material(0x0c171d);
  body(root, { coat, pants: material(0x35434a), boots: trim, width: 1.08 });
  backpack(root, 0x303b3d);
  vest(root, 0x344146, 1, 3);
  // Heavy open parka, stitched panels and frost on the shoulders.
  for (const side of [-1, 1]) {
    box(root, [0.32, 1.43, 0.18], coat, [side * 0.59, 1.92, 0.43]);
    const lapel = box(root, [0.29, 0.67, 0.17], trim, [side * 0.53, 2.5, 0.44]);
    lapel.rotation.z = side * 0.2;
    curve(root, [[side * 0.48, 2.69, 0.56], [side * 0.44, 2.17, 0.58], [side * 0.49, 1.33, 0.54]], 0.018, material(0x8b8872));
    box(root, [0.29, 0.32, 0.07], trim, [side * 0.6, 1.48, 0.56]);
    box(root, [0.48, 0.31, 0.07], armor, [side * 0.44, 0.85, side * 0.07 + 0.33]);
  }
  // Individual low-poly tufts give the collar volume all the way around.
  const furColors = [0x5d6055, 0x77776a, 0x444d47, 0x949485];
  for (let i = 0; i < 38; i++) {
    const angle = -Math.PI * 0.6 + i / 37 * Math.PI * 1.2;
    const x = Math.sin(angle) * 0.74, z = -Math.cos(angle) * 0.46;
    const y = 2.73 + Math.cos(angle) * 0.16;
    const tuft = mesh(root, new THREE.IcosahedronGeometry(0.145, 0), material(furColors[i % 4]), [x, y, z]);
    tuft.scale.set(0.85, 1.1 + (i % 3) * 0.17, 0.85);
    tuft.rotation.set(i * 0.7, i * 0.9, -x * 0.6);
  }
  box(root, [0.65, 0.36, 0.045], black, [0, 2.43, 0.54]);
  decal(root, 0.6, 0.3, [0, 2.43, 0.567], g => {
    g.strokeStyle = "#a63c32"; g.lineWidth = 15;
    g.beginPath(); g.arc(69, 128, 57, 0.6, 5.7); g.stroke();
    g.fillStyle = "#d1d6ca"; g.font = "bold 36px sans-serif";
    g.fillText("BLACK", 62, 117); g.fillText("DIVISION", 62, 159);
  });

  const face = new THREE.Group(); face.position.y = 3.15; root.add(face);
  oval(face, [0.47, 0.44, 0.43], trim, [0, -0.02, 0]);
  // Respirator: distinct round eyepieces, central grille and side filter canister.
  oval(face, [0.33, 0.32, 0.18], armor, [0, -0.15, 0.35]);
  for (const side of [-1, 1]) {
    tube(face, 0.145, 0.105, steel, [side * 0.22, 0.04, 0.419], "z");
    tube(face, 0.113, 0.012, black, [side * 0.22, 0.04, 0.477], "z");
    tube(face, 0.083, 0.014, material(0x263e49, 0.5), [side * 0.22, 0.04, 0.487], "z");
    curve(face, [[side * 0.33, -0.04, 0.4], [side * 0.27, -0.13, 0.44]], 0.013, material(0x9e493e));
  }
  oval(face, [0.155, 0.2, 0.1], steel, [0, -0.28, 0.49]);
  for (let i = 0; i < 7; i++) box(face, [0.012, 0.105, 0.014], black, [-0.072 + i * 0.024, -0.245, 0.586], false);
  tube(face, 0.064, 0.019, black, [0, -0.37, 0.582], "z");
  tube(face, 0.029, 0.022, steel, [0, -0.37, 0.595], "z");
  const filter = tube(face, 0.145, 0.23, armor, [0.36, -0.23, 0.29], "x"); filter.rotation.z += 0.25;
  tube(face, 0.13, 0.02, steel, [0.49, -0.2, 0.29], "x");
  // Armored dome, side rails and folded optics mounted above the mask.
  const dome = mesh(face, new THREE.SphereGeometry(0.55, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), coat, [0, 0.2, -0.015]);
  dome.scale.y = 0.87;
  tube(face, 0.54, 0.1, trim, [0, 0.22, 0]);
  for (const side of [-1, 1]) {
    box(face, [0.09, 0.16, 0.36], steel, [side * 0.53, 0.29, 0.015]);
    curve(face, [[side * 0.29, 0.25, 0.46], [side * 0.25, 0.57, 0.18], [side * 0.23, 0.6, -0.15]], 0.023, steel);
    tube(face, 0.118, 0.13, trim, [side * 0.36, 0.23, 0.48], "z");
    tube(face, 0.088, 0.01, material(0x6b756e), [side * 0.36, 0.23, 0.551], "z");
  }
  box(face, [0.2, 0.42, 0.16], trim, [0, 0.46, 0.42]);
  for (const y of [0.33, 0.49, 0.65]) box(face, [0.23, 0.055, 0.05], steel, [0, y, 0.516]);
  tube(face, 0.055, 0.06, black, [0, 0.28, 0.575], "z");

  // Compact suppressed weapon held below the face, with both hands on it.
  const gun = new THREE.Group(); gun.position.set(0.03, 2.08, 0.87); gun.rotation.z = -0.26; root.add(gun);
  box(gun, [0.95, 0.28, 0.23], armor, [0.02, 0, 0]);
  box(gun, [0.42, 0.14, 0.15], trim, [-0.61, -0.04, 0]);
  box(gun, [0.09, 0.28, 0.2], trim, [-0.84, -0.09, 0]);
  box(gun, [0.18, 0.29, 0.19], glove, [-0.27, -0.23, 0]);
  box(gun, [0.2, 0.48, 0.19], trim, [0.12, -0.32, 0]);
  box(gun, [0.43, 0.22, 0.25], coat, [0.67, 0, 0]);
  tube(gun, 0.09, 0.64, steel, [1.19, 0, 0], "x");
  tube(gun, 0.065, 0.007, black, [1.514, 0, 0], "x");
  box(gun, [0.24, 0.18, 0.19], trim, [0.08, 0.24, 0]);
  box(gun, [0.11, 0.1, 0.12], material(0x62858b, 0.4), [0.21, 0.25, 0]);
  tube(gun, 0.058, 0.28, steel, [0.66, 0.18, 0.13], "x");
  for (let i = 0; i < 8; i++) box(gun, [0.032, 0.04, 0.26], steel, [-0.34 + i * 0.12, 0.16, 0], false);
  const grip = (x: number, y: number): Point => {
    const p = new THREE.Vector3(x, y, 0.03).applyAxisAngle(new THREE.Vector3(0, 0, 1), -0.26).add(gun.position);
    return [p.x, p.y, p.z];
  };
  arm(root, [-0.8, 2.51, 0], [-0.96, 2.03, 0.34], grip(-0.27, -0.2), coat, glove);
  arm(root, [0.8, 2.51, 0], [0.93, 1.91, 0.34], grip(0.64, -0.12), coat, glove);
  for (const side of [-1, 1]) {
    box(root, [0.25, 0.28, 0.055], armor, [side * 0.89, 2.31, 0.22]);
    curve(root, [[side * 0.76, 2.62, 0.02], [side * 0.87, 2.44, 0.14]], 0.024, material(0x91a3a4));
  }
  return root;
}

function makeZryachiy() {
  const root = new THREE.Group();
  const figure = new THREE.Group(); figure.position.set(-0.5, 0, 0.72); root.add(figure);
  const woodland = camo(), olive = material(0x505d36), dark = material(0x253026);
  const bone = material(0x9a9275), glove = material(0x596541);
  body(figure, { coat: woodland, pants: woodland, boots: dark });
  vest(figure, 0x4a5637, 2, 3); backpack(figure, 0x414b31);
  for (const side of [-1, 1]) {
    box(figure, [0.43, 0.33, 0.09], dark, [side * 0.44, 0.84, side * 0.07 + 0.33]);
    box(figure, [0.45, 0.5, 0.13], woodland, [side * 0.37, 1.34, 0.33]);
  }
  // An open ghillie hood frames the printed skull balaclava.
  const hood = mesh(figure, new THREE.SphereGeometry(0.64, 28, 20, 0, Math.PI * 2, 0.74, Math.PI - 0.74), olive, [0, 3.15, 0]);
  hood.rotation.x = Math.PI / 2;
  hood.scale.set(1, 0.92, 1.12);
  const hoodRim = mesh(figure, new THREE.TorusGeometry(0.435, 0.075, 10, 32), dark, [0, 3.12, 0.465]);
  hoodRim.scale.y = 1.16;
  tube(figure, 0.445, 0.72, dark, [0, 3.12, 0.03]);
  const mask = texture(g => {
    g.fillStyle = "#252c28"; g.fillRect(0, 0, 256, 256);
    g.fillStyle = "#c5c6b7";
    g.beginPath(); g.ellipse(128, 119, 98, 103, 0, 0, Math.PI * 2); g.fill();
    // Broken vertical print keeps the skull looking like cloth rather than armor.
    g.strokeStyle = "#62685d"; g.lineWidth = 2;
    for (let x = 34; x < 230; x += 7) {
      g.beginPath(); g.moveTo(x, 29 + (x % 13)); g.lineTo(x - 3, 224 - (x % 17)); g.stroke();
    }
    g.fillStyle = "#202921";
    for (const x of [78, 180]) {
      g.beginPath(); g.ellipse(x, 111, 37, 26, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = "#c7a55f";
      g.beginPath(); g.ellipse(x, 111, 27, 15, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = "#26362e";
      g.fillRect(x - 17, 108, 34, 5);
      g.fillStyle = "#a8c2b5"; g.fillRect(x - 3, 108, 6, 5);
      g.fillStyle = "#202921";
    }
    g.beginPath(); g.moveTo(128, 139); g.lineTo(112, 162); g.lineTo(142, 162); g.closePath(); g.fill();
    g.fillRect(121, 12, 13, 64);
    g.strokeStyle = "#252c28"; g.lineWidth = 5;
    g.beginPath(); g.moveTo(64, 190); g.quadraticCurveTo(128, 209, 194, 190); g.stroke();
    for (let x = 74; x < 193; x += 18) { g.beginPath(); g.moveTo(x, 178); g.lineTo(x, 220); g.stroke(); }
  });
  mesh(figure, new THREE.CylinderGeometry(0.454, 0.454, 0.72, 32, 1, true, -1.05, 2.1), new THREE.MeshStandardMaterial({ map: mask, roughness: 0.95 }), [0, 3.12, 0.03]);

  // Branched antlers, tapering to points, lashed across the top of the hood.
  const antler = material(0x827b5f);
  const branch = (from: Point, to: Point, base: number, tip: number) => {
    const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to);
    const part = mesh(figure, new THREE.CylinderGeometry(tip, base, a.distanceTo(b), 7), antler, [0, 0, 0]);
    part.position.copy(a.clone().add(b).multiplyScalar(0.5));
    part.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.sub(a).normalize());
  };
  for (const side of [-1, 1]) {
    branch([side * 0.3, 3.63, 0.1], [side * 0.48, 3.94, 0.02], 0.09, 0.065);
    branch([side * 0.48, 3.94, 0.02], [side * 0.56, 4.25, 0], 0.065, 0.045);
    branch([side * 0.56, 4.25, 0], [side * 0.42, 4.65, -0.04], 0.045, 0.003);
    branch([side * 0.48, 3.95, 0.02], [side * 0.8, 4.15, 0.04], 0.045, 0.003);
    branch([side * 0.54, 4.19, 0.01], [side * 0.78, 4.49, -0.02], 0.035, 0.003);
    branch([side * 0.53, 4.27, 0], [side * 0.27, 4.42, 0.02], 0.03, 0.003);
    tube(figure, 0.105, 0.075, bone, [side * 0.31, 3.67, 0.17], "z");
  }
  curve(figure, [[-0.5, 4.03, 0.04], [0, 3.99, 0.025], [0.52, 4.16, 0.02]], 0.009, dark);
  curve(figure, [[-0.53, 4.27, 0], [0, 4.23, 0.01], [0.5, 4.34, 0]], 0.008, dark);

  holdRifle(figure, "scope", [0.05, 2.02, 0.9], -0.38, woodland, glove, 0.9);
  // Loose strips cover shoulders, hood, back, sleeves and trousers.
  const stripMats = [0x414f30, 0x6c7445, 0x797348, 0x37492f, 0x56543a].map(materialColor => material(materialColor));
  let seed = 127;
  const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const strip = (at: Point, length: number, angle: number) => {
    const ribbon = box(figure, [0.07 + random() * 0.055, length, 0.016], stripMats[Math.floor(random() * stripMats.length)], at, false);
    ribbon.rotation.set((random() - 0.5) * 0.6, angle, (random() - 0.5) * 0.8);
  };
  for (let i = 0; i < 42; i++) {
    const angle = i / 42 * Math.PI * 2;
    // Keep the opening clear so the skull and eyes remain readable.
    if (Math.cos(angle) < 0.55) strip([Math.sin(angle) * 0.6, 3.3 + random() * 0.3, Math.cos(angle) * 0.53], 0.22 + random() * 0.28, angle);
  }
  for (const side of [-1, 1]) {
    for (let i = 0; i < 23; i++) {
      strip([side * (0.62 + random() * 0.39), 2.05 + random() * 0.59, random() * 0.72 - 0.29], 0.18 + random() * 0.3, random());
    }
    for (let i = 0; i < 16; i++) strip([side * (0.3 + random() * 0.35), 0.5 + random() * 0.88, random() * 0.66 - 0.22], 0.18 + random() * 0.28, random());
  }
  for (let i = 0; i < 24; i++) strip([(random() - 0.5) * 1.15, 1.64 + random() * 1.14, -0.92], 0.2 + random() * 0.3, random());
  curve(figure, [[-0.32, 2.72, 0.51], [0, 2.6, 0.57], [0.32, 2.72, 0.51]], 0.026, material(0x6b5437));
  for (let i = 0; i < 5; i++) {
    const tooth = mesh(figure, new THREE.ConeGeometry(0.038, 0.16, 6), bone, [-0.24 + i * 0.12, 2.59 + Math.abs(i - 2) * 0.03, 0.57]);
    tooth.rotation.z = Math.PI + (i - 2) * 0.16;
  }

  // A compact, weathered lighthouse diorama behind the figure.
  const tower = new THREE.Group(); tower.position.set(0.85, 0, -1.26); root.add(tower);
  const stone = material(0x696a5e), metal = material(0x394e4c, 0.25);
  const plasterMap = texture(g => {
    g.fillStyle = "#b8a28b"; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 75; i++) {
      g.fillStyle = i % 2 ? "rgba(72,66,54,.16)" : "rgba(222,211,177,.19)";
      g.fillRect(random() * 256, random() * 256, 2 + random() * 7, 5 + random() * 34);
    }
    g.strokeStyle = "rgba(72,66,54,.26)"; g.lineWidth = 1;
    for (const y of [52, 118, 191]) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); }
  });
  const plaster = new THREE.MeshStandardMaterial({ map: plasterMap, roughness: 0.95 });
  for (let i = 0; i < 12; i++) {
    const angle = i / 12 * Math.PI * 2;
    const rock = mesh(tower, new THREE.IcosahedronGeometry(0.44, 0), stone, [Math.sin(angle) * 0.77, 0.13, Math.cos(angle) * 0.69]);
    rock.scale.set(1, 0.55 + random() * 0.3, 1); rock.rotation.y = angle;
  }
  mesh(tower, new THREE.CylinderGeometry(0.47, 0.63, 3.7, 32), plaster, [0, 2.16, 0]);
  tube(tower, 0.89, 0.99, plaster, [-0.25, 0.85, 0.13]);
  tube(tower, 0.92, 0.075, stone, [-0.25, 1.38, 0.13]);
  tube(tower, 0.93, 0.12, stone, [-0.25, 0.35, 0.13]);
  box(tower, [0.29, 0.57, 0.055], material(0x39403a), [-0.28, 0.72, 1.022]);
  // Stacked narrow windows sit radially on the tapering walls.
  for (const y of [1.72, 2.46, 3.22, 3.76]) for (const angle of [0, Math.PI * 0.7, Math.PI * 1.4]) {
    const r = 0.63 - (y - 0.31) / 3.7 * 0.16;
    const window = new THREE.Group(); window.position.set(Math.sin(angle) * (r + 0.009), y, Math.cos(angle) * (r + 0.009)); window.rotation.y = angle; tower.add(window);
    box(window, [0.17, 0.31, 0.045], stone, [0, 0, 0]);
    box(window, [0.115, 0.25, 0.018], material(0x283b3b), [0, 0, 0.029]);
    box(window, [0.12, 0.018, 0.02], stone, [0, 0.02, 0.042]);
  }
  tube(tower, 0.63, 0.1, stone, [0, 4.05, 0]);
  // Balcony rails and a glazed lantern with a warm, steady beacon.
  for (let i = 0; i < 16; i++) {
    const angle = i / 16 * Math.PI * 2;
    tube(tower, 0.014, 0.24, metal, [Math.sin(angle) * 0.59, 4.2, Math.cos(angle) * 0.59]);
  }
  const rail = mesh(tower, new THREE.TorusGeometry(0.59, 0.018, 6, 32), metal, [0, 4.32, 0]); rail.rotation.x = Math.PI / 2;
  const glass = new THREE.MeshStandardMaterial({ color: 0x8daaa6, transparent: true, opacity: 0.28, roughness: 0.3, depthWrite: false });
  tube(tower, 0.35, 0.49, glass, [0, 4.37, 0]);
  tube(tower, 0.09, 0.32, new THREE.MeshStandardMaterial({ color: 0xffe1a1, emissive: 0xffc16e, emissiveIntensity: 1.1 }), [0, 4.37, 0]);
  for (let i = 0; i < 8; i++) {
    const angle = i / 8 * Math.PI * 2;
    tube(tower, 0.018, 0.5, metal, [Math.sin(angle) * 0.35, 4.37, Math.cos(angle) * 0.35]);
  }
  tube(tower, 0.39, 0.055, metal, [0, 4.64, 0]);
  mesh(tower, new THREE.SphereGeometry(0.39, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), metal, [0, 4.66, 0]);
  tube(tower, 0.026, 0.23, metal, [0, 5.1, 0]);
  return root;
}

export function buildBossModel(boss: BossModelId): THREE.Group {
  switch (boss) {
    case "glukhar": return makeGlukhar();
    case "goons": return makeGoons();
    case "jaeger": return makeJaeger();
    case "kaban": return makeKaban();
    case "killa": return makeKilla();
    case "kollontay": return makeKollontay();
    case "partisan": return makePartisan();
    case "sanitar": return makeSanitar();
    case "special-cultists": return makeSpecialCultists();
    case "tagilla": return makeTagilla();
    case "wedgie": return makeWedgie();
    case "zryachiy": return makeZryachiy();
  }
}
