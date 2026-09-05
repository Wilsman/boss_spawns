import * as THREE from "three";

export interface SlamArm {
  side: number;
  shoulder: THREE.Vector3;
  upper: THREE.Mesh;
  joint: THREE.Mesh;
  forearm: THREE.Mesh;
  hand: THREE.Group;
  wrapping?: THREE.Group;
  upperLength: number;
  forearmLength: number;
}

interface SlamAnimation {
  update(dt: number): void;
  bounds: THREE.Box3;
}

const animations = new WeakMap<THREE.Group, SlamAnimation>();
export const getTagillaSlam = (model: THREE.Group) => animations.get(model);

export function createTagillaSlam(root: THREE.Group, torso: THREE.Group, waist: THREE.Group, axe: THREE.Group, arms: SlamArm[]) {
  root.updateMatrixWorld(true);
  // Animate the weapon in figure space; hands are solved back into torso space.
  root.attach(axe);
  const ready = {
    position: axe.position.clone(), rotation: axe.quaternion.clone(),
    waist: waist.quaternion.clone(), lowGrip: -1.25, highGrip: 0.55,
  };
  function pose(position: [number, number, number], direction: [number, number, number], lean: number, twist: number, lowGrip: number, highGrip: number) {
    const axis = new THREE.Vector3(...direction).normalize();
    const normal = new THREE.Vector3(1, 0, 0).addScaledVector(axis, -axis.x).normalize();
    const across = new THREE.Vector3().crossVectors(normal, axis).normalize();
    return {
      position: new THREE.Vector3(...position),
      rotation: new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(axis, across, normal)),
      waist: new THREE.Quaternion().setFromEuler(new THREE.Euler(lean, twist, -0.04)),
      lowGrip, highGrip,
    };
  }
  const wound = pose([0.55, 3.05, 0.6], [0.35, 0.92, -0.2], -0.08, -0.72, -0.85, 0.35);
  const overhead = pose([0.05, 3.65, 0.65], [0, 0.98, -0.2], -0.12, -0.1, -0.6, 0.22);
  const impact = pose([0.05, 1.9, 2.25], [0, -0.75, 0.66], 0.5, 0.04, -1.3, -0.7);

  // Find the actual lowest axe vertex at the slam pose, including blade bevels.
  const contact = new THREE.Vector3(0, Infinity, 0);
  const vertex = new THREE.Vector3();
  const inverseAxe = axe.matrixWorld.clone().invert();
  axe.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    const toAxe = new THREE.Matrix4().multiplyMatrices(inverseAxe, object.matrixWorld);
    const positions = object.geometry.getAttribute("position");
    for (let i = 0; i < positions.count; i++) {
      vertex.fromBufferAttribute(positions, i).applyMatrix4(toAxe).applyQuaternion(impact.rotation).add(impact.position);
      if (vertex.y < contact.y) contact.copy(vertex);
    }
  });
  impact.position.y += 0.015 - contact.y;
  contact.y = 0.015;

  const frames = [
    { time: 0, pose: ready },
    { time: 0.65, pose: ready },
    { time: 1.55, pose: wound },
    { time: 2.25, pose: overhead },
    { time: 2.5, pose: overhead },
    { time: 2.92, pose: impact },
    { time: 3.55, pose: impact },
    { time: 4.5, pose: overhead },
    { time: 5.65, pose: ready },
    { time: 6.2, pose: ready },
  ];
  const up = new THREE.Vector3(0, 1, 0);
  const inverseTorso = new THREE.Matrix4();
  const weaponToTorso = new THREE.Matrix4();
  const handRotation = new THREE.Quaternion();
  const wrist = new THREE.Vector3(), elbow = new THREE.Vector3(), direction = new THREE.Vector3(), bend = new THREE.Vector3();
  function segment(mesh: THREE.Mesh, from: THREE.Vector3, to: THREE.Vector3, length: number) {
    direction.subVectors(to, from);
    mesh.position.copy(from);
    mesh.scale.y = direction.length() / length;
    mesh.quaternion.setFromUnitVectors(up, direction.normalize());
  }
  function applyPose(time: number) {
    const index = frames.findIndex((frame, i) => i > 0 && time <= frame.time);
    const next = frames[index < 0 ? frames.length - 1 : index];
    const previous = frames[Math.max(0, (index < 0 ? frames.length - 1 : index) - 1)];
    const t = THREE.MathUtils.clamp((time - previous.time) / (next.time - previous.time), 0, 1);
    const blend = next.pose === impact && previous.pose === overhead ? t * t : t * t * (3 - 2 * t);
    axe.position.lerpVectors(previous.pose.position, next.pose.position, blend);
    axe.quaternion.slerpQuaternions(previous.pose.rotation, next.pose.rotation, blend);
    waist.quaternion.slerpQuaternions(previous.pose.waist, next.pose.waist, blend);
    root.updateMatrixWorld(true);
    inverseTorso.copy(torso.matrixWorld).invert();
    weaponToTorso.multiplyMatrices(inverseTorso, axe.matrixWorld);
    handRotation.setFromRotationMatrix(weaponToTorso);
    for (const arm of arms) {
      const grip = arm.side < 0 ? "lowGrip" : "highGrip";
      const gripX = THREE.MathUtils.lerp(previous.pose[grip], next.pose[grip], blend);
      arm.hand.position.set(gripX, 0, 0).applyMatrix4(weaponToTorso);
      arm.hand.quaternion.copy(handRotation);
      wrist.set(gripX, -0.17, 0).applyMatrix4(weaponToTorso);
      direction.subVectors(wrist, arm.shoulder);
      const distance = Math.max(direction.length(), 0.001);
      direction.divideScalar(distance);
      // Bend elbows outward, keeping the returning forearm outside the chest.
      bend.set(arm.side * 1.5, 3.02, 0.65).sub(arm.shoulder);
      bend.addScaledVector(direction, -bend.dot(direction)).normalize();
      const stretch = Math.max(1, distance / (arm.upperLength + arm.forearmLength) + 0.001);
      const upperLength = arm.upperLength * stretch, lowerLength = arm.forearmLength * stretch;
      const along = THREE.MathUtils.clamp((upperLength ** 2 - lowerLength ** 2 + distance ** 2) / (2 * distance), -upperLength, upperLength);
      const height = Math.sqrt(Math.max(0, upperLength ** 2 - along ** 2));
      elbow.copy(arm.shoulder).addScaledVector(direction, along).addScaledVector(bend, height);
      segment(arm.upper, arm.shoulder, elbow, arm.upperLength);
      arm.joint.position.copy(elbow);
      segment(arm.forearm, elbow, wrist, arm.forearmLength);
      if (arm.wrapping) {
        arm.wrapping.position.copy(elbow);
        arm.wrapping.quaternion.copy(arm.forearm.quaternion);
        arm.wrapping.scale.y = arm.forearm.scale.y;
      }
    }
  }

  // One reusable burst: angular debris and bright chips thrown up from contact.
  const particles = new THREE.Group();
  const debris = Array.from({ length: 44 }, (_, i) => {
    const spark = i % 3 === 0;
    const material = new THREE.MeshStandardMaterial({
      color: spark ? 0xffc477 : 0x77766c, roughness: 0.9,
      emissive: spark ? 0xff852b : 0x000000, emissiveIntensity: spark ? 1.8 : 0,
      transparent: true, opacity: 0,
    });
    const chip = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 0), material);
    const size = spark ? 0.022 : 0.035 + (i % 5) * 0.009;
    chip.scale.set(size, size * (spark ? 2.8 : 0.7), size);
    particles.add(chip);
    const angle = i * 2.39996, speed = 0.65 + (i % 7) * 0.18;
    return { chip, material, velocity: new THREE.Vector3(Math.cos(angle) * speed, 1.7 + (i % 6) * 0.32, Math.sin(angle) * speed), life: 0.65 + (i % 5) * 0.13 };
  });
  particles.visible = false;
  // Bounds include the overhead reach and forward strike through a full turn.
  const bounds = new THREE.Box3().setFromObject(root);
  for (const frame of frames) {
    applyPose(frame.time);
    bounds.union(new THREE.Box3().setFromObject(root));
  }
  bounds.expandByScalar(0.15);
  applyPose(0);
  root.add(particles);
  let elapsed = 0;
  animations.set(root, {
    bounds,
    update(dt) {
      elapsed = (elapsed + dt) % 6.2;
      applyPose(elapsed);
      const age = elapsed - 2.92;
      particles.visible = age >= 0 && age < 1.2;
      if (!particles.visible) return;
      for (const { chip, material, velocity, life } of debris) {
        chip.visible = age < life;
        chip.position.copy(contact).addScaledVector(velocity, age);
        chip.position.y = Math.max(0.025, contact.y + velocity.y * age - 4.9 * age * age);
        chip.rotation.set(age * 6, age * 9, age * 4);
        material.opacity = Math.max(0, 1 - age / life);
      }
    },
  });
}
