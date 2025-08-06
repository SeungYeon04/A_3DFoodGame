import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d-compat";

export default class FruitFactory {
  constructor(scene, world, dynamicBodies) {
    this.scene = scene;
    this.world = world;
    this.dynamicBodies = dynamicBodies;
  }

  spawnItem(type = "box", position = new THREE.Vector3(0, 5, 0)) {
    const material = new THREE.MeshStandardMaterial({
      metalness: 0.5,
      roughness: 0
    });

    let mesh, colliderDesc;

    switch (type) {
      case "sphere":
        mesh = new THREE.Mesh(new THREE.SphereGeometry(1), material);
        colliderDesc = RAPIER.ColliderDesc.ball(1);
        break;
      case "cylinder":
        mesh = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 2, 16), material);
        colliderDesc = RAPIER.ColliderDesc.cylinder(1, 1);
        break;
      case "torus":
        mesh = new THREE.Mesh(new THREE.TorusKnotGeometry(), material);
        colliderDesc = RAPIER.ColliderDesc.trimesh(
          new Float32Array(mesh.geometry.attributes.position.array),
          new Uint32Array(mesh.geometry.index.array)
        );
        break;
      default:
        mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material);
        colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5);
        break;
    }

    mesh.castShadow = true;
    mesh.position.copy(position);
    this.scene.add(mesh);
    
    const body = this.world.createRigidBody(
    RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(position.x, position.y, position.z)
      .setCanSleep(false)
      .setLinearDamping(1.5)      // 더 강하게 감쇠
      .setAngularDamping(2.0)     // 회전 감쇠 강화
  );


   colliderDesc
    .setMass(2)  // 무게 증가 → 충격에 더 안정적
    .setRestitution(0) // 반발력 제거
    .setFriction(1)
    .setRestitutionCombineRule(RAPIER.CoefficientCombineRule.Min)
    .setFrictionCombineRule(RAPIER.CoefficientCombineRule.Min)

    this.world.createCollider(colliderDesc, body);

    this.dynamicBodies.push([mesh, body]);
  }

  
  findSafeSpawnY(type = "box", spacing = 0.1) {
  // 예상 높이 (대충 오브젝트 높이 + 여유)
  const objectHeight = 2;

  let testY = 2;
  let safe = false;

  while (!safe && testY < 100) {
    safe = true;

    for (const [, body] of this.dynamicBodies) {
      const pos = body.translation();
      if (Math.abs(pos.x - 0) < 1 && Math.abs(pos.z - 0) < 1) {
        const bottom = pos.y - 1;
        const top = pos.y + 1;

        if (testY + objectHeight / 2 >= bottom - spacing &&
            testY - objectHeight / 2 <= top + spacing) {
          safe = false;
          testY += objectHeight + spacing;
          break;
        }
      }
    }
  }

  return testY;
}

}
