// glassBottle.js
import * as THREE from "three";

export default function GlassBottle(scene, world, RAPIER) {
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x88ccee,
    transparent: true,
    opacity: 0.3,
    roughness: 0.1,
  });

  const wallT = 0.2, w = 8, h = 10, d = 4;

  const wallConfigs = [
    [w, h, wallT, 0, h / 2, -d / 2], // back
    [w, h, wallT, 0, h / 2, d / 2],  // front
    [wallT, h, d, -w / 2, h / 2, 0], // left
    [wallT, h, d, w / 2, h / 2, 0],  // right
  ];

  const staticBody = world.createRigidBody(
    RAPIER.RigidBodyDesc.kinematicPositionBased()
  );

  wallConfigs.forEach(([x, y, z, px, py, pz]) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(x, y, z), glassMat);
    mesh.position.set(px, py, pz);
    scene.add(mesh);

    const collider = RAPIER.ColliderDesc.cuboid(x / 2, y / 2, z / 2)
      .setTranslation(px, py, pz)
      .setRestitution(0)
      .setFriction(1);

    world.createCollider(collider, staticBody);
  });

  return staticBody; // ✅ RigidBody 반환
}
