import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";

/**
 * Lego Reshala - stylized minifig built procedurally with Three.js.
 * Reference: public/eft_boss_reshala.webp
 *
 * Interaction: horizontal-only spin (Y axis). Works with mouse drag
 * and single-finger touch drag. No vertical tilt, no pan, no zoom.
 */

const JACKET = 0x3f3d2e;
const JACKET_DARK = 0x2a2920;
const OUTLINE = 0x1c2a1e;
const SKIN = 0xe2ac7d;
const LEGO_YELLOW = 0xffc81a;
const GOLD = 0xe8b10c;
const GOLD_DARK = 0x9a7306;
const HAIR = 0x1d2120;
const BOOT = 0x4c4c33;
const GUNMETAL = 0x3a3f36;

function makeFaceTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 512;
  const g = c.getContext("2d")!;

  g.clearRect(0, 0, 512, 512);

  // Beard / stubble: bottom ~48% with soft top edge
  const beardGrad = g.createLinearGradient(0, 230, 0, 500);
  beardGrad.addColorStop(0, "rgba(141,134,123,0)");
  beardGrad.addColorStop(0.25, "rgba(141,134,123,0.85)");
  beardGrad.addColorStop(1, "rgba(122,115,105,0.95)");
  g.fillStyle = beardGrad;
  g.beginPath();
  g.roundRect(40, 230, 432, 250, 60);
  g.fill();

  // Stubble noise dots
  g.fillStyle = "rgba(90,85,75,0.35)";
  for (let i = 0; i < 350; i++) {
    const x = 60 + Math.random() * 392;
    const y = 280 + Math.random() * 180;
    g.fillRect(x, y, 2.5, 2.5);
  }

  // Eyes
  g.fillStyle = "#191d1c";
  g.beginPath();
  g.ellipse(185, 232, 22, 26, 0, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.ellipse(327, 232, 22, 26, 0, 0, Math.PI * 2);
  g.fill();

  // Angry brows: thick slanted bars (kept below the hairline)
  g.strokeStyle = "#191d1c";
  g.lineCap = "round";
  g.lineWidth = 26;
  g.beginPath();
  g.moveTo(115, 162);
  g.lineTo(235, 187);
  g.stroke();
  g.beginPath();
  g.moveTo(397, 162);
  g.lineTo(277, 187);
  g.stroke();

  // Frown: outer + inner mouth lines
  g.lineWidth = 18;
  g.beginPath();
  g.arc(256, 400, 85, Math.PI * 1.18, Math.PI * 1.82);
  g.stroke();
  g.lineWidth = 10;
  g.beginPath();
  g.arc(256, 418, 55, Math.PI * 1.18, Math.PI * 1.82);
  g.stroke();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function makeCamoTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#b3a37e";
  g.fillRect(0, 0, 256, 256);
  const blobs = ["#8a7c55", "#6d6547", "#cfc096", "#9c8f68"];
  for (let i = 0; i < 46; i++) {
    g.fillStyle = blobs[i % blobs.length];
    g.globalAlpha = 0.85;
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const r = 12 + Math.random() * 30;
    g.beginPath();
    g.ellipse(x, y, r, r * (0.55 + Math.random() * 0.5), Math.random() * Math.PI, 0, Math.PI * 2);
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

interface Reshala3DProps {
  height?: number;
  /** Seamless mode for the page header: no backdrop, border, platform or buttons. */
  transparent?: boolean;
  showControls?: boolean;
  autoSpinDefault?: boolean;
}

export function Reshala3D({
  height = 460,
  transparent = false,
  showControls = true,
  autoSpinDefault = true,
}: Reshala3DProps) {
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
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.touchAction = "pan-y";
    renderer.domElement.style.cursor = "grab";
    renderer.domElement.style.display = "block";
    mount.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(30, W / H, 0.1, 100);
    camera.position.set(0, 2.0, 7.4);
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

    // Materials
    const camoTex = makeCamoTexture();
    const faceTex = makeFaceTexture();
    const jacketMat = new THREE.MeshStandardMaterial({ color: JACKET, roughness: 0.8 });
    const jacketDarkMat = new THREE.MeshStandardMaterial({ color: JACKET_DARK, roughness: 0.85 });
    const camoMat = new THREE.MeshStandardMaterial({ map: camoTex, roughness: 0.85 });
    const skinMat = new THREE.MeshStandardMaterial({ color: SKIN, roughness: 0.55 });
    const yellowMat = new THREE.MeshStandardMaterial({ color: LEGO_YELLOW, roughness: 0.35 });
    const hairMat = new THREE.MeshStandardMaterial({ color: HAIR, roughness: 0.7 });
    const bootMat = new THREE.MeshStandardMaterial({ color: BOOT, roughness: 0.9 });
    const goldMat = new THREE.MeshStandardMaterial({ color: GOLD, roughness: 0.3, metalness: 0.65 });
    const goldDarkMat = new THREE.MeshStandardMaterial({ color: GOLD_DARK, roughness: 0.5, metalness: 0.4 });
    const gunmetalMat = new THREE.MeshStandardMaterial({ color: GUNMETAL, roughness: 0.6, metalness: 0.3 });
    const blackMat = new THREE.MeshStandardMaterial({ color: 0x101010, roughness: 0.7 });

    // Figure root (this is what spins - Y only)
    const fig = new THREE.Group();
    scene.add(fig);
    spinRef.current = fig;
    fig.rotation.y = -0.35;

    // ---- Legs (slight A-stance like reference) ----
    const legL = new THREE.Group();
    const legR = new THREE.Group();
    legL.position.set(-0.34, 0, 0);
    legR.position.set(0.34, 0, 0);
    legL.rotation.z = 0.09;
    legR.rotation.z = -0.09;
    fig.add(legL, legR);

    for (const [grp] of [[legL], [legR]] as const) {
      const leg = box(0.56, 1.0, 0.62, camoMat, 0, 0.78, 0);
      const boot = box(0.6, 0.3, 0.78, bootMat, 0, 0.15, 0.06);
      grp.add(leg, boot);
    }

    // Hips
    const hips = box(1.24, 0.32, 0.64, camoMat, 0, 1.42, 0);
    fig.add(hips);

    // ---- Torso: Lego taper (wider shoulders) ----
    const torsoGeo = new THREE.CylinderGeometry(0.78, 0.6, 1.15, 4, 1);
    const torso = new THREE.Mesh(torsoGeo, jacketMat);
    torso.rotation.y = Math.PI / 4; // flat faces front
    torso.scale.set(1.08, 1, 0.62);
    torso.position.set(0, 2.15, 0);
    torso.castShadow = true;
    torso.receiveShadow = true;
    fig.add(torso);
    outlined(torso);

    // Zipper + collar + pocket slashes
    fig.add(box(0.07, 0.95, 0.03, jacketDarkMat, 0, 2.12, 0.42, false));
    const zipPull = box(0.09, 0.12, 0.05, gunmetalMat, 0, 2.2, 0.43, false);
    fig.add(zipPull);
    // collar flaps
    const collarL = box(0.34, 0.28, 0.1, jacketDarkMat, -0.28, 2.72, 0.3);
    collarL.rotation.z = 0.35;
    collarL.rotation.x = -0.2;
    const collarR = collarL.clone();
    collarR.position.x = 0.28;
    collarR.rotation.z = -0.35;
    fig.add(collarL, collarR);
    // black tee triangle
    const tee = box(0.3, 0.34, 0.04, blackMat, 0, 2.68, 0.36, false);
    tee.rotation.x = -0.1;
    fig.add(tee);
    // pocket slashes
    const pocketL = box(0.05, 0.34, 0.02, blackMat, -0.42, 1.95, 0.4, false);
    pocketL.rotation.z = 0.5;
    const pocketR = box(0.05, 0.34, 0.02, blackMat, 0.42, 1.95, 0.4, false);
    pocketR.rotation.z = -0.5;
    fig.add(pocketL, pocketR);
    // waistband
    fig.add(box(1.28, 0.12, 0.68, jacketDarkMat, 0, 1.62, 0, false));

    // ---- Right arm: down by side (his right) ----
    const armR = new THREE.Group();
    armR.position.set(-0.88, 2.6, 0);
    armR.rotation.z = 0.14;
    fig.add(armR);
    const upperR = box(0.36, 0.85, 0.38, jacketMat, 0, -0.42, 0);
    armR.add(upperR);
    // cuff
    armR.add(box(0.38, 0.1, 0.4, jacketDarkMat, 0, -0.82, 0, false));
    // Lego C-hand: cylinder + notch illusion via torus
    const handR = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.3, 24), yellowMat);
    handR.position.set(0, -1.05, 0.02);
    handR.castShadow = true;
    armR.add(handR);
    outlined(handR);

    // ---- Left arm: extended forward holding gold Deagle ----
    const armL = new THREE.Group();
    armL.position.set(0.88, 2.6, 0);
    armL.rotation.x = -1.25; // raise forward
    armL.rotation.z = -0.12;
    fig.add(armL);
    const upperL = box(0.36, 0.85, 0.38, jacketMat, 0, -0.42, 0);
    armL.add(upperL);
    armL.add(box(0.38, 0.1, 0.4, jacketDarkMat, 0, -0.82, 0, false));
    const handL = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.3, 24), yellowMat);
    handL.position.set(0, -1.05, 0.02);
    handL.rotation.x = Math.PI / 2; // grip orientation
    handL.castShadow = true;
    armL.add(handL);
    outlined(handL);

    // Gold Desert Eagle in left hand. The arm group is pitched forward
    // (rotation.x = -1.25), so counter-rotate the gun to aim it forward.
    const gun = new THREE.Group();
    gun.position.set(0, -1.08, 0.28);
    gun.rotation.x = 1.25;
    armL.add(gun);
    const slide = box(0.2, 0.2, 0.85, goldMat, 0, 0.12, 0.25);
    const grip = box(0.18, 0.45, 0.24, goldMat, 0, -0.18, -0.05);
    grip.rotation.x = 0.15;
    const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.1, 20), goldDarkMat);
    muzzle.rotation.x = Math.PI / 2;
    muzzle.position.set(0, 0.12, 0.7);
    const bore = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.12, 16), blackMat);
    bore.rotation.x = Math.PI / 2;
    bore.position.set(0, 0.12, 0.7);
    const rearSight = box(0.16, 0.08, 0.1, goldDarkMat, 0, 0.24, -0.12, false);
    const serr = box(0.21, 0.1, 0.12, goldDarkMat, 0, 0.13, -0.05, false);
    gun.add(slide, grip, muzzle, bore, rearSight, serr);

    // ---- Head ----
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.18, 20), yellowMat);
    neck.position.set(0, 2.8, 0);
    fig.add(neck);

    const headGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.62, 32);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.set(0, 3.18, 0);
    head.castShadow = true;
    fig.add(head);
    outlined(head);

    // Face decal: curved cylinder segment hugging the head so the face
    // stays put (no floating plane) while spinning. Centered on +z.
    const FACE_ARC = 2.0;
    const face = new THREE.Mesh(
      new THREE.CylinderGeometry(0.49, 0.49, 0.62, 24, 1, true, -FACE_ARC / 2, FACE_ARC),
      new THREE.MeshStandardMaterial({ map: faceTex, transparent: true, roughness: 0.6 })
    );
    face.position.set(0, 3.18, 0);
    fig.add(face);

    // Ears (yellow nubs like reference)
    for (const sx of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.12, 16), yellowMat);
      ear.rotation.z = Math.PI / 2;
      ear.position.set(sx * 0.5, 3.15, 0);
      fig.add(ear);
    }

    // Hair: buzz-cut cap + back
    const hairCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.46),
      hairMat
    );
    hairCap.position.set(0, 3.28, -0.02);
    hairCap.scale.set(1.02, 0.9, 1.02);
    hairCap.castShadow = true;
    fig.add(hairCap);
    const hairBack = box(0.9, 0.5, 0.3, hairMat, 0, 3.2, -0.35);
    fig.add(hairBack);

    // ---- AK slung on back (diagonal) ----
    const ak = new THREE.Group();
    ak.position.set(-0.15, 2.2, -0.55);
    ak.rotation.z = 0.7;
    ak.rotation.y = 0.15;
    fig.add(ak);
    const stock = box(0.16, 0.5, 0.18, gunmetalMat, 0, 0.85, 0);
    stock.rotation.z = 0.25;
    const body = box(0.14, 0.7, 0.16, gunmetalMat, 0, 0.15, 0);
    const mag = box(0.12, 0.35, 0.14, jacketDarkMat, 0, -0.1, 0.08);
    mag.rotation.x = 0.4;
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.7, 12), gunmetalMat);
    barrel.position.set(0, -0.5, 0);
    const handguard = box(0.15, 0.3, 0.17, new THREE.MeshStandardMaterial({ color: 0x5a4a33, roughness: 0.8 }), 0, -0.3, 0);
    ak.add(stock, body, mag, barrel, handguard);

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
    const timer = new THREE.Timer();
    const animate = () => {
      raf = requestAnimationFrame(animate);
      timer.update();
      const dt = Math.min(timer.getDelta(), 0.05);
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
      camera.updateProjectionMatrix();
      renderer.setSize(w, H);
    };
    window.addEventListener("resize", onResize);
    const resizeObs = new ResizeObserver(onResize);
    resizeObs.observe(mount);

    return () => {
      cancelAnimationFrame(raf);
      timer.dispose();
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
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          const m = o.material as THREE.Material | THREE.Material[];
          if (Array.isArray(m)) m.forEach((x) => x.dispose());
          else m.dispose();
        }
      });
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height, transparent]);

  return (
    <div className="w-full select-none">
      <div
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
      <div className="mt-2 flex items-center justify-between gap-2 text-xs text-gray-400">
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

export default Reshala3D;
