import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";

/**
 * Lego Shturman - stylized minifig built procedurally with Three.js.
 * Reference: public/eft_boss_shturman.webp
 *
 * Interaction: horizontal-only spin (Y axis). Works with mouse drag
 * and single-finger touch drag. No vertical tilt, no pan, no zoom.
 */

const OUTLINE = 0x142615;

function makeFaceTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#ffcc19";
  g.fillRect(0, 0, 256, 256);
  g.fillStyle = "#17351c";
  for (const x of [85, 171]) {
    g.beginPath();
    g.ellipse(x, 112, 12, 15, 0, 0, Math.PI * 2);
    g.fill();
  }
  g.strokeStyle = "#17351c";
  g.lineWidth = 13;
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(57, 76); g.lineTo(110, 86);
  g.moveTo(199, 76); g.lineTo(146, 86);
  g.stroke();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeCamoTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#69723b";
  g.fillRect(0, 0, 256, 256);
  const blobs = ["#25462b", "#465e30", "#8b8150", "#364c28"];
  let seed = 37;
  const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < 46; i++) {
    g.fillStyle = blobs[i % blobs.length];
    g.globalAlpha = 0.85;
    const x = random() * 256;
    const y = random() * 256;
    const r = 12 + random() * 30;
    g.beginPath();
    g.ellipse(x, y, r, r * (0.55 + random() * 0.5), random() * Math.PI, 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 1);
  return tex;
}

function outlined(mesh: THREE.Mesh, color = OUTLINE): THREE.LineSegments {
  // EdgesGeometry is already in the mesh's local space, so the line must
  // keep an identity transform or the outline renders offset (doubled).
  const edges = new THREE.EdgesGeometry(mesh.geometry, 30);
  const line = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({ color })
  );
  mesh.add(line);
  return line;
}

function box(
  w: number,
  h: number,
  d: number,
  mat: THREE.Material,
  x = 0,
  y = 0,
  z = 0,
  outline = true
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  if (outline) outlined(m);
  return m;
}

interface Shturman3DProps {
  height?: number;
  /** Seamless mode for the page header: no backdrop, border, platform or buttons. */
  transparent?: boolean;
  showControls?: boolean;
  autoSpinDefault?: boolean;
}

export function Shturman3D({
  height = 460,
  transparent = false,
  showControls = true,
  autoSpinDefault = true,
}: Shturman3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const spinRef = useRef<THREE.Group | null>(null);
  const velRef = useRef(0);
  const draggingRef = useRef(false);
  const lastXRef = useRef(0);
  const idleRef = useRef(0);
  const autoSpinRef = useRef(autoSpinDefault);
  const [autoSpin, setAutoSpin] = useState(autoSpinDefault);

  const nudge = useCallback((dir: 1 | -1) => {
    if (spinRef.current) spinRef.current.rotation.y += dir * (Math.PI / 8);
    idleRef.current = 0;
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = mount.clientWidth || 360;
    const H = height;

    const scene = new THREE.Scene();
    scene.background = null;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.touchAction = "pan-y";
    renderer.domElement.style.cursor = "grab";
    renderer.domElement.style.display = "block";
    mount.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(30, W / H, 0.1, 100);
    camera.position.set(0, 2.1, 8.6);
    camera.lookAt(0, 1.85, 0);

    // Lights
    scene.add(new THREE.HemisphereLight(0xfff6e0, 0x2a2f22, 1.05));
    const key = new THREE.DirectionalLight(0xffffff, 2.0);
    key.position.set(3.5, 6, 4);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -4;
    key.shadow.camera.right = 4;
    key.shadow.camera.top = 6;
    key.shadow.camera.bottom = -2;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x9db8ff, 0.7);
    rim.position.set(-4, 3, -4);
    scene.add(rim);
    const fill = new THREE.DirectionalLight(0xffd9a0, 0.35);
    fill.position.set(-2, 2, 5);
    scene.add(fill);

    // Ground shadow catcher
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(2.2, 48),
      new THREE.ShadowMaterial({ opacity: 0.32 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0.001;
    ground.receiveShadow = true;
    scene.add(ground);

    const disc = new THREE.Mesh(
      new THREE.CylinderGeometry(1.7, 1.8, 0.12, 48),
      new THREE.MeshStandardMaterial({ color: 0x141412, roughness: 0.9 })
    );
    disc.position.y = -0.06;
    disc.receiveShadow = true;
    // In transparent (header) mode the page background shows through, so
    // skip the display platform and keep only the soft contact shadow.
    if (!transparent) scene.add(disc);

    const camoTex = makeCamoTexture();
    const faceTex = makeFaceTexture();
    const material = (color: number) => new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
    const jacket = material(0x3e5037);
    const dark = material(0x253922);
    const olive = material(0x576035);
    const rollMat = material(0xa4a365);
    const metal = material(0x354730);
    const black = material(0x101b12);
    const camo = new THREE.MeshStandardMaterial({ map: camoTex, roughness: 0.85 });
    const fig = new THREE.Group();
    scene.add(fig);
    spinRef.current = fig;
    fig.rotation.y = -0.35;

    const sphere = (parent: THREE.Group, mat: THREE.Material, x: number, y: number, z: number, sx: number, sy: number, sz: number) => {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), mat);
      mesh.position.set(x, y, z);
      mesh.scale.set(sx, sy, sz);
      mesh.castShadow = true;
      parent.add(mesh);
      return mesh;
    };
    const link = (from: number[], to: number[], width: number, depth: number, mat: THREE.Material) => {
      const start = new THREE.Vector3(...from);
      const end = new THREE.Vector3(...to);
      const mesh = box(width, start.distanceTo(end), depth, mat);
      mesh.position.copy(start.clone().add(end).multiplyScalar(0.5));
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.sub(start).normalize());
      fig.add(mesh);
    };
    // Reference stance: left leg reaches back and out, right knee braces forward.
    const legs = [
      { hip: [-0.34, 1.45, 0], knee: [-0.69, 0.88, -0.13], ankle: [-1.03, 0.27, -0.24], turn: -0.27 },
      { hip: [0.34, 1.45, 0], knee: [0.69, 0.91, 0.21], ankle: [0.76, 0.27, 0.36], turn: 0.08 },
    ];
    for (const { hip, knee, ankle, turn } of legs) {
      link(hip, knee, 0.61, 0.66, camo);
      sphere(fig, camo, knee[0], knee[1], knee[2], 0.31, 0.31, 0.33);
      link(knee, ankle, 0.58, 0.64, camo);
      const boot = new THREE.Group();
      boot.position.set(ankle[0], 0, ankle[2]);
      boot.rotation.y = turn;
      boot.add(box(0.65, 0.31, 0.87, olive, 0, 0.19, 0.12));
      boot.add(box(0.66, 0.07, 0.88, dark, 0, 0.055, 0.12));
      fig.add(boot);
    }
    fig.add(box(1.25, 0.32, 0.65, camo, 0, 1.4));
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.7, 1.2, 4), jacket);
    torso.rotation.y = Math.PI / 4;
    torso.scale.set(1.13, 1, 0.72);
    torso.position.y = 2.12;
    torso.castShadow = true;
    outlined(torso);
    fig.add(torso);
    fig.add(box(0.055, 1.05, 0.035, dark, 0, 2.08, 0.425));
    for (const side of [-1, 1]) {
      fig.add(box(0.39, 0.17, 0.08, dark, side * 0.34, 1.76, 0.42));
      fig.add(box(0.32, 0.1, 0.09, jacket, side * 0.34, 1.79, 0.44));
      fig.add(box(0.14, 0.86, 0.09, olive, side * 0.46, 2.25, 0.4));
    }
    // A real backpack and horizontal rolled sleeping mat, visible from the rear.
    fig.add(box(1.22, 1.35, 0.57, olive, 0, 2.15, -0.56));
    fig.add(box(0.8, 0.6, 0.16, jacket, 0, 1.95, -0.91));
    for (const side of [-1, 1]) {
      fig.add(box(0.13, 1.24, 0.08, dark, side * 0.42, 2.15, -0.89));
      fig.add(box(0.2, 0.18, 0.09, rollMat, side * 0.42, 1.92, -0.95));
    }
    const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 1.46, 32), rollMat);
    roll.rotation.z = Math.PI / 2;
    roll.position.set(0, 2.96, -0.66);
    roll.castShadow = true;
    fig.add(roll);
    for (const x of [-0.5, 0.5]) {
      const strap = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.09, 32), dark);
      strap.rotation.z = Math.PI / 2;
      strap.position.set(x, 2.96, -0.66);
      fig.add(strap);
    }
    for (const side of [-1, 1]) {
      const seam = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.022, 8, 32), olive);
      seam.rotation.y = Math.PI / 2;
      seam.position.set(side * 0.738, 2.96, -0.66);
      fig.add(seam);
    }
    const headStart = fig.children.length;
    // Hood shell has an open front; its rim frames the yellow eyes and mask.
    const hood = new THREE.Mesh(new THREE.SphereGeometry(0.72, 32, 24, 0, Math.PI * 2, 0.68, Math.PI - 0.68), jacket);
    hood.rotation.x = Math.PI / 2;
    hood.scale.set(1, 0.92, 1.1);
    hood.position.set(0, 3.22, 0);
    hood.castShadow = true;
    fig.add(hood);
    const rimHood = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.065, 10, 40), dark);
    rimHood.scale.y = 1.14;
    rimHood.position.set(0, 3.22, 0.51);
    fig.add(rimHood);
    const face = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.65, 32, 1, true, -1.05, 2.1), new THREE.MeshStandardMaterial({ map: faceTex, roughness: 0.6 }));
    face.position.set(0, 3.22, 0.05);
    fig.add(face);
    sphere(fig, dark, 0, 3.02, 0.32, 0.47, 0.28, 0.3);
    link([-0.26, 2.95, 0.57], [0.05, 2.85, 0.55], 0.025, 0.025, jacket);

    // Keep his gaze forward along the sights.
    const headParts = fig.children.slice(headStart);
    const headPivot = new THREE.Group();
    headPivot.position.set(0, 3.05, 0);
    fig.add(headPivot);
    for (const part of headParts) {
      part.position.sub(headPivot.position);
      headPivot.add(part);
    }
    // A slight cheek lean brings his right eye toward the optic.
    headPivot.position.add(new THREE.Vector3(-0.13, -0.08, 0.04));
    headPivot.rotation.z = 0.12;

    // Shoulder the stock on his right, leaving the receiver clear of the mask.
    // The trigger elbow stays outside the torso; the support elbow tucks below.
    link([-0.73, 2.52, 0.05], [-0.94, 2.14, 0.42], 0.36, 0.38, jacket);
    sphere(fig, jacket, -0.94, 2.14, 0.42, 0.2, 0.2, 0.2);
    link([-0.94, 2.14, 0.42], [-0.46, 2.43, 0.9], 0.3, 0.32, jacket);
    link([0.73, 2.53, 0.05], [0.49, 2.08, 0.68], 0.36, 0.38, jacket);
    sphere(fig, jacket, 0.49, 2.08, 0.68, 0.2, 0.2, 0.2);
    link([0.49, 2.08, 0.68], [-0.38, 2.56, 1.49], 0.3, 0.32, jacket);

    // Small curved grips wrap the pistol grip and cradle the fore-end.
    const glove = (x: number, y: number, z: number, support: boolean) => {
      const hand = new THREE.Group();
      hand.position.set(x, y, z);
      const fingers = new THREE.Mesh(new THREE.TorusGeometry(0.125, 0.065, 10, 20, Math.PI * 1.55), olive);
      if (support) fingers.rotation.z = Math.PI * 0.72;
      else fingers.rotation.x = Math.PI / 2;
      hand.add(fingers);
      hand.add(box(0.13, 0.19, 0.17, olive, support ? 0.1 : -0.1, -0.04, 0, false));
      fig.add(hand);
    };
    glove(-0.46, 2.46, 0.9, false);
    glove(-0.43, 2.65, 1.49, true);
    // Scoped rifle: stock, receiver, curved magazine, barrel and optic.
    const rifle = new THREE.Group();
    rifle.position.set(-0.43, 2.7, 1.1);
    rifle.scale.setScalar(0.85);
    rifle.rotation.y = -Math.PI / 2;
    fig.add(rifle);
    rifle.add(box(0.66, 0.23, 0.19, olive, -0.72, -0.04));
    rifle.add(box(0.1, 0.32, 0.23, dark, -1.07, -0.07));
    rifle.add(box(0.95, 0.3, 0.24, metal));
    rifle.add(box(0.57, 0.27, 0.26, olive, 0.73));
    rifle.add(box(0.15, 0.33, 0.18, dark, -0.24, -0.28));
    for (let i = 0; i < 5; i++) {
      const mag = box(0.25, 0.15, 0.18, metal, 0.23 + i * i * 0.009, -0.19 - i * 0.115);
      mag.rotation.z = i * 0.12;
      rifle.add(mag);
    }
    const tube = (radius: number, length: number, x: number, y: number, mat: THREE.Material) => {
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 24), mat);
      mesh.rotation.z = Math.PI / 2;
      mesh.position.set(x, y, 0);
      mesh.castShadow = true;
      rifle.add(mesh);
    };
    tube(0.055, 0.84, 1.39, 0.015, metal);
    tube(0.09, 0.16, 1.85, 0.015, dark);
    tube(0.043, 0.006, 1.933, 0.015, black);
    rifle.add(box(0.065, 0.26, 0.07, dark, 1.68, 0.12));
    for (const x of [-0.25, 0.27]) rifle.add(box(0.08, 0.18, 0.14, dark, x, 0.24));
    tube(0.105, 0.7, 0, 0.39, metal);
    tube(0.16, 0.23, 0.43, 0.39, dark);
    tube(0.125, 0.01, 0.55, 0.39, material(0x547668));
    tube(0.13, 0.14, -0.42, 0.39, dark);
    rifle.add(box(0.11, 0.15, 0.13, dark, 0, 0.53));

    // ---- Horizontal-only drag (mouse + touch) ----
    const el = renderer.domElement;
    const onDown = (e: PointerEvent) => {
      draggingRef.current = true;
      lastXRef.current = e.clientX;
      velRef.current = 0;
      idleRef.current = 0;
      el.setPointerCapture(e.pointerId);
      el.style.cursor = "grabbing";
    };
    const onMove = (e: PointerEvent) => {
      if (!draggingRef.current || !spinRef.current) return;
      const dx = e.clientX - lastXRef.current;
      lastXRef.current = e.clientX;
      const d = dx * 0.0085;
      spinRef.current.rotation.y += d;
      velRef.current = d;
      idleRef.current = 0;
    };
    const onUp = () => {
      draggingRef.current = false;
      el.style.cursor = "grab";
    };
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);

    let raf = 0;
    const clock = new THREE.Clock();
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      idleRef.current += dt;
      const spin = spinRef.current;
      if (spin && !draggingRef.current) {
        // inertia
        if (Math.abs(velRef.current) > 0.0001) {
          spin.rotation.y += velRef.current;
          velRef.current *= 0.94;
        } else if (autoSpinRef.current && idleRef.current > 1.2) {
          spin.rotation.y += dt * 0.5; // gentle turntable
        }
      }
      renderer.render(scene, camera);
    };
    // keep the turntable flag in sync with the toggle button
    const syncAuto = () => {
      autoSpinRef.current = mount.dataset.autospin !== "off";
    };
    syncAuto();
    const obs = new MutationObserver(syncAuto);
    obs.observe(mount, { attributes: true, attributeFilter: ["data-autospin"] });
    animate();

    const onResize = () => {
      const w = mount.clientWidth || W;
      camera.aspect = w / H;
      camera.position.z = Math.max(10, 11 / camera.aspect);
      camera.updateProjectionMatrix();
      renderer.setSize(w, H);
    };
    window.addEventListener("resize", onResize);
    const resizeObs = new ResizeObserver(onResize);
    resizeObs.observe(mount);
    onResize();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      resizeObs.disconnect();
      obs.disconnect();
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      camoTex.dispose();
      faceTex.dispose();
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.LineSegments) {
          o.geometry.dispose();
          const m = o.material as THREE.Material | THREE.Material[];
          if (Array.isArray(m)) m.forEach((x) => x.dispose());
          else m.dispose();
        }
      });
      disc.geometry.dispose();
      disc.material.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height, transparent]);

  return (
    <div className="w-full select-none">
      <div
        role="img"
        aria-label="Interactive 3D Shturman with hood, backpack and scoped rifle"
        ref={mountRef}
        data-autospin={autoSpin ? "on" : "off"}
        className={
          transparent
            ? "w-full overflow-hidden bg-transparent"
            : "w-full overflow-hidden rounded-xl border border-white/[0.09] bg-[radial-gradient(ellipse_at_center,#23231c_0%,#101010_70%)]"
        }
        style={{ height, touchAction: "pan-y" }}
      />
      {showControls && (
      <div className="mt-2 flex items-center justify-between flex-wrap gap-2 text-xs text-gray-400">
        <span>Drag to spin (horizontal only) - works on mobile</span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => nudge(-1)}
            className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-white hover:bg-white/10"
            aria-label="Rotate left"
          >
            ◀
          </button>
          <button
            type="button"
            onClick={() => nudge(1)}
            className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-white hover:bg-white/10"
            aria-label="Rotate right"
          >
            ▶
          </button>
          <button
            type="button"
            onClick={() => setAutoSpin((v) => !v)}
            className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-white hover:bg-white/10"
          >
            {autoSpin ? "Pause spin" : "Auto spin"}
          </button>
        </div>
      </div>
      )}
    </div>
  );
}

export default Shturman3D;

