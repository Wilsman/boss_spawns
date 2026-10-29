import { useEffect, useRef } from "react";
import * as THREE from "three";
import { buildInfectedModel, type InfectedVariant } from "./infected-models";

interface InfectedModel3DProps {
  variant: InfectedVariant;
  height?: number;
  /** False freezes the walk on one frame (reduced motion). */
  animate?: boolean;
}

// Fixed, front-on camera: the infected walks straight at the viewer and the
// fog drifts past at walking pace. No turntable or drag.
export function InfectedModel3D({ variant, height = 250, animate = true }: InfectedModel3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const W = mount.clientWidth || 260;
    const H = height;

    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.display = "block";
    mount.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(30, W / H, 0.1, 100);
    const target = new THREE.Vector3(0, 1.9, 0.3);
    const fit = (aspect: number) => {
      // Fit ~4.5 units of height, or 3 of width on very narrow mounts.
      const halfFov = THREE.MathUtils.degToRad(15);
      const distance = Math.max(2.25 / Math.tan(halfFov), 1.5 / (Math.tan(halfFov) * aspect));
      camera.position.set(0, 2.6, target.z + distance);
      camera.lookAt(target);
    };
    fit(W / H);

    scene.add(new THREE.HemisphereLight(0xa8b8c0, 0x0b0d0c, 1.05));
    const key = new THREE.DirectionalLight(0xe2eaff, 2.2);
    key.position.set(2, 7, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    Object.assign(key.shadow.camera, { left: -3, right: 3, top: 5, bottom: -1 });
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x8a9c88, 0.45);
    fill.position.set(0, 1, 6);
    scene.add(fill);
    const coolRim = new THREE.DirectionalLight(0x7fa8ff, 1.1);
    coolRim.position.set(4, 4, -4);
    scene.add(coolRim);
    // Flickering emergency light behind the figure's right shoulder.
    const warmRim = new THREE.DirectionalLight(0xff4a1a, 1.2);
    warmRim.position.set(-4, 3, -3);
    scene.add(warmRim);

    const ground = new THREE.Mesh(new THREE.CircleGeometry(2.4, 48), new THREE.ShadowMaterial({ opacity: 0.4 }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0.001;
    ground.receiveShadow = true;
    scene.add(ground);

    const figure = buildInfectedModel(variant);
    scene.add(figure.root);
    const fog = createFog(scene, camera);

    let raf = 0;
    let elapsed = 0.4;
    const timer = new THREE.Timer();
    const frame = () => {
      timer.update();
      const dt = Math.min(timer.getDelta(), 0.05);
      if (animate) {
        raf = requestAnimationFrame(frame);
        elapsed += dt;
      }
      figure.update(elapsed);
      fog.update(elapsed);
      const flicker = Math.sin(elapsed * 2.3) * 0.5 + Math.sin(elapsed * 17.1) * 0.25 + (Math.sin(elapsed * 0.9) > 0.93 ? -0.9 : 0);
      warmRim.intensity = Math.max(0.2, 1.2 + flicker * 0.45);
      renderer.render(scene, camera);
    };
    frame();

    const onResize = () => {
      const w = mount.clientWidth || W;
      camera.aspect = w / H;
      fit(camera.aspect);
      camera.updateProjectionMatrix();
      renderer.setSize(w, H);
      if (!animate) renderer.render(scene, camera);
    };
    const resizeObs = new ResizeObserver(onResize);
    resizeObs.observe(mount);

    return () => {
      cancelAnimationFrame(raf);
      timer.dispose();
      fog.dispose();
      resizeObs.disconnect();
      const textures = new Set<THREE.Texture>();
      scene.traverse(object => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) {
          for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
          material.dispose();
        }
      });
      textures.forEach(texture => texture.dispose());
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [variant, height, animate]);

  return <div ref={mountRef} className="w-full overflow-hidden bg-transparent" style={{ height }} aria-hidden="true" />;
}

// Low fog banks sliding towards the camera at about walking speed.
function createFog(scene: THREE.Scene, camera: THREE.Camera) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  for (let i = 0; i < 9; i++) {
    const angle = i * 2.4, x = 64 + Math.cos(angle) * 21, y = 64 + Math.sin(angle) * 16;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, 38);
    gradient.addColorStop(0, "rgba(190,206,200,0.32)");
    gradient.addColorStop(0.45, "rgba(170,188,182,0.13)");
    gradient.addColorStop(1, "rgba(170,188,182,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
  }
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  const group = new THREE.Group();
  scene.add(group);
  const wisps = Array.from({ length: 16 }, (_, i) => {
    const material = new THREE.SpriteMaterial({ map, transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(2.4 + (i % 3) * 0.5, 0.8 + (i % 4) * 0.15, 1);
    group.add(sprite);
    return { sprite, material, phase: i / 16, x: ((i * 37) % 9) / 8 * 4.4 - 2.2, y: 0.15 + (i % 4) * 0.14 };
  });
  const travel = 4.8, speed = 0.7;
  const edge = new THREE.Vector3();
  return {
    update(time: number) {
      camera.updateMatrixWorld();
      for (const { sprite, material, phase, x, y } of wisps) {
        const progress = (phase + time * speed / travel) % 1;
        sprite.position.set(x + Math.sin(time * 0.2 + phase * 9) * 0.25, y, -3.4 + progress * travel);
        // Fade wisps out as they approach the frame edge so they never get cut off by it.
        edge.copy(sprite.position).project(camera);
        const centreX = edge.x;
        edge.copy(sprite.position);
        edge.x += sprite.scale.x / 2;
        edge.project(camera);
        const halfWidth = Math.min(Math.abs(edge.x - centreX), 0.9);
        const inside = THREE.MathUtils.clamp((1 - Math.abs(centreX)) / Math.max(halfWidth, 0.05), 0, 1);
        const edgeFade = inside * inside * (3 - 2 * inside);
        material.opacity = 0.2 * Math.sin(progress * Math.PI) ** 2 * edgeFade;
      }
    },
    dispose() {
      scene.remove(group);
      for (const { material } of wisps) material.dispose();
      map.dispose();
    },
  };
}

export default InfectedModel3D;
