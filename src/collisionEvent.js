// collisionHandler.js
import * as THREE from "three";

export const MERGE_MAP = {
  rice: "chili",
  chili: "garlic",
  garlic: "darkgarlic",
  darkgarlic: "plum",
  plum: "apple",
  apple: "peach"
};

export function handleCollisions(world, eventQueue, dynamicBodies, scene, spawnItem, removalQueue) {
  eventQueue.drainCollisionEvents((handle1, handle2) => {
    const colliderA = world.getCollider(handle1);
    const colliderB = world.getCollider(handle2);
    if (!colliderA || !colliderB) return;

    const rigidBodyA = colliderA.parent();
    const rigidBodyB = colliderB.parent();
    if (!rigidBodyA || !rigidBodyB) return;

    const objA = dynamicBodies.find(o => o.body.handle === rigidBodyA.handle);
    const objB = dynamicBodies.find(o => o.body.handle === rigidBodyB.handle);
    if (!objA || !objB) return;

    if (removalQueue.includes(objA) || removalQueue.includes(objB)) return;

    if (objA.type !== objB.type) return;

    const nextType = MERGE_MAP[objA.type];
    if (!nextType) return;

    // 거리 조건 제거했음
    console.log(`💥 병합됨: ${objA.type} → ${nextType}`);

    removalQueue.push(objA, objB);

    const mid = new THREE.Vector3()
      .addVectors(objA.mesh.position, objB.mesh.position)
      .multiplyScalar(0.5)
      .add(new THREE.Vector3(0, 0.5, 0));

    spawnItem(nextType, mid);
  });
}
