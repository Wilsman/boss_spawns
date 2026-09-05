import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { buildBossModel, type BossModelId } from "./boss-models";
import { createBossSnow } from "./boss-snow";
import { getTagillaSlam } from "./tagilla-slam";

interface BossModel3DProps {
  boss: BossModelId;
  height?: number;
  /** Seamless mode for the page header: no backdrop, border, platform or buttons. */
  transparent?: boolean;
  showControls?: boolean;
  autoSpinDefault?: boolean;
}

export function BossModel3D({
  boss,
  height = 460,
  transparent = false,
  showControls = true,
  autoSpinDefault = true,
}: BossModel3DProps) {
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

    const fig = buildBossModel(boss);
    scene.add(fig);
    spinRef.current = fig;
    fig.rotation.y = -0.35;
    const bounds = new THREE.Box3().setFromObject(fig);
    const slam = getTagillaSlam(fig);
    if (slam) bounds.union(slam.bounds.clone().applyMatrix4(fig.matrix));
    const center = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3());
    // Fit the entire model through a full turn, including held props and groups.
    const radius = slam
      ? Math.hypot(Math.max(Math.abs(slam.bounds.min.x), Math.abs(slam.bounds.max.x)), Math.max(Math.abs(slam.bounds.min.z), Math.abs(slam.bounds.max.z)))
      : Math.hypot(size.x, size.z) / 2;
    if (slam) center.set(0, center.y, 0);
    const headerSlam = transparent && !!slam;
    // Keep his body at showcase scale; the full swing envelope is for the model page.
    if (headerSlam) center.set(0, 2.35, 0);
    const headerSanta = transparent && boss === "santa-claus";
    // The tree and presents inflate the full-scene bounds, which shrinks
    // Santa in the header. Frame his body at showcase scale instead; the
    // full scene is still shown on the model page.
    if (headerSanta) center.set(0, 1.75, 0);
    camera.lookAt(center);
    const headerShowcase = headerSlam || headerSanta;
    const fitCamera = (aspect: number) => {
      const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
      const vertical = (headerSlam ? 4.8 : headerSanta ? 3.8 : size.y) * 0.56 / Math.tan(halfFov);
      const horizontal = (headerSlam ? 1.1 : headerSanta ? 1.5 : radius) * 1.12 / (Math.tan(halfFov) * aspect);
      camera.position.set(center.x, center.y + 0.25, center.z + (Math.max(vertical, horizontal) + (headerShowcase ? 0.6 : radius)) * (headerShowcase ? 1.12 : 1));
      camera.lookAt(center);
    };
    fitCamera(W / H);
    disc.scale.set(Math.max(1, radius / 1.7), 1, Math.max(1, radius / 1.7));
    ground.scale.setScalar(Math.max(1, radius / 1.7));
    const snow = boss === "wedgie" || boss === "santa-claus" ? createBossSnow(scene) : null;
    const mist = boss === "shadow-of-tagilla" ? createBossMist(scene) : null;

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
      snow?.update(dt);
      mist?.update(dt);
      slam?.update(dt);
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
      fitCamera(camera.aspect);
      camera.updateProjectionMatrix();
      renderer.setSize(w, H);
    };
    window.addEventListener("resize", onResize);
    const resizeObs = new ResizeObserver(onResize);
    resizeObs.observe(mount);
    onResize();

    return () => {
      cancelAnimationFrame(raf);
      timer.dispose();
      snow?.dispose();
      mist?.dispose();
      window.removeEventListener("resize", onResize);
      resizeObs.disconnect();
      obs.disconnect();
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      const textures = new Set<THREE.Texture>();
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.LineSegments) {
          o.geometry.dispose();
          const m = o.material as THREE.Material | THREE.Material[];
          for (const mat of Array.isArray(m) ? m : [m]) {
            for (const value of Object.values(mat)) {
              if (value instanceof THREE.Texture) textures.add(value);
            }
            mat.dispose();
          }
        }
      });
      textures.forEach((texture) => texture.dispose());
      disc.geometry.dispose();
      disc.material.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boss, height, transparent]);

  return (
    <div className="w-full select-none">
      <div
        role="img"
        aria-label={`Interactive 3D ${boss} model`}
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

function createBossMist(scene: THREE.Scene) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  for (let i = 0; i < 9; i++) {
    const angle = i * 2.4, x = 64 + Math.cos(angle) * 21, y = 64 + Math.sin(angle) * 18;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, 38);
    gradient.addColorStop(0, "rgba(202,214,209,0.3)");
    gradient.addColorStop(0.45, "rgba(180,197,190,0.13)");
    gradient.addColorStop(1, "rgba(180,197,190,0)");
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 128, 128);
  }
  const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace;
  const group = new THREE.Group(); scene.add(group);
  const wisps = Array.from({ length: 14 }, (_, i) => {
    const material = new THREE.SpriteMaterial({ map, transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
    const sprite = new THREE.Sprite(material);
    const isLow = i < 10;
    sprite.scale.set(isLow ? 2.6 : 2.1, isLow ? 0.95 : 1.3, 1);
    group.add(sprite);
    return { sprite, material, phase: i / 14, duration: 22 + i % 5 * 3, height: isLow ? 0.3 + i % 4 * 0.22 : 1.55 + i % 3 * 0.4, depth: isLow ? -0.8 + i % 4 * 0.5 : -1.15, opacity: isLow ? 0.17 : 0.085 };
  });
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const syncMotion = () => { group.visible = !motion.matches; };
  syncMotion(); motion.addEventListener("change", syncMotion);
  let elapsed = 0;
  function update(dt: number) {
    if (!group.visible) return;
    elapsed += dt;
    for (const { sprite, material, phase, duration, height, depth, opacity } of wisps) {
      const progress = (phase + elapsed / duration) % 1;
      sprite.position.set(-1.9 + progress * 3.8, height + Math.sin(progress * Math.PI) * 0.18, depth + Math.sin(elapsed * 0.13 + phase * 6) * 0.12);
      material.opacity = opacity * Math.sin(progress * Math.PI) ** 2;
      material.rotation = Math.sin(elapsed * 0.08 + phase * 6) * 0.12;
    }
  }
  update(0);
  return {
    update,
    dispose() {
      motion.removeEventListener("change", syncMotion);
      scene.remove(group);
      for (const { material } of wisps) material.dispose();
      map.dispose();
    },
  };
}

export default BossModel3D;

