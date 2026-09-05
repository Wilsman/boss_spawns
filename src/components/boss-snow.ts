import * as THREE from "three";

/** Scene-space snow: the wind stays steady when the figure is rotated. */
export function createBossSnow(scene: THREE.Scene) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 32;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, "rgba(255,255,255,0.95)");
  gradient.addColorStop(0.3, "rgba(235,245,255,0.75)");
  gradient.addColorStop(1, "rgba(235,245,255,0)");
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 32, 32);
  const map = new THREE.CanvasTexture(canvas);
  const group = new THREE.Group(); scene.add(group);
  let seed = 83;
  const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const layers = [0, 1].map(layer => {
    const count = layer === 0 ? 150 : 45;
    const positions = new Float32Array(count * 3), speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = random() * 5.6 - 2.8;
      positions[i * 3 + 1] = random() * 4.8;
      positions[i * 3 + 2] = random() * 3.6 - 1.8;
      speeds[i] = 0.55 + random() * 0.7;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
    const material = new THREE.PointsMaterial({ map, size: layer === 0 ? 0.043 : 0.078, color: 0xdcecf4, transparent: true, opacity: layer === 0 ? 0.55 : 0.38, depthWrite: false, sizeAttenuation: true });
    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    group.add(points);
    return { geometry, material, positions, speeds, count };
  });
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const syncMotion = () => { group.visible = !motion.matches; };
  syncMotion();
  motion.addEventListener("change", syncMotion);
  let elapsed = 0;
  return {
    update(dt: number) {
      if (!group.visible) return;
      elapsed += dt;
      const wind = 0.36 + Math.sin(elapsed * 0.43) * 0.13 + Math.sin(elapsed * 1.1) * 0.05;
      for (const { geometry, positions, speeds, count } of layers) {
        for (let i = 0; i < count; i++) {
          const p = i * 3;
          positions[p] += (wind + Math.sin(elapsed * 0.8 + i) * 0.09) * dt;
          positions[p + 1] -= speeds[i] * dt;
          positions[p + 2] += Math.sin(elapsed * 0.5 + i * 1.7) * 0.06 * dt;
          if (positions[p + 1] < 0) { positions[p + 1] = 4.8; positions[p] = random() * 5.6 - 2.8; }
          if (positions[p] > 2.8) positions[p] = -2.8;
        }
        geometry.attributes.position.needsUpdate = true;
      }
    },
    dispose() {
      motion.removeEventListener("change", syncMotion);
      scene.remove(group);
      for (const { geometry, material } of layers) { geometry.dispose(); material.dispose(); }
      map.dispose();
    },
  };
}
