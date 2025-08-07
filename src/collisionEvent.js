// collisionHandler.js
import * as THREE from "three"; // Three.js 라이브러리 가져오기
import RAPIER from "@dimforge/rapier3d-compat"; // Rapier 물리 엔진 가져오기 (사용되지 않지만 포함)

// 병합 규칙을 정의하는 객체: 충돌 시 다음 단계로 진화할 아이템을 지정
export const MERGE_MAP = {
  rice: "chili",
  chili: "garlic",
  garlic: "darkgarlic",
  darkgarlic: "plum",
  plum: "apple",
  apple: "peach"
};

// 충돌 이벤트를 처리하고 아이템 병합 로직을 수행하는 함수
export function handleCollisions(world, eventQueue, dynamicBodies, scene, spawnItem, removalQueue) {
  // 이벤트 큐에서 모든 충돌 이벤트를 처리
  eventQueue.drainCollisionEvents((handle1, handle2) => {
    // 충돌한 두 충돌체(collider)를 가져옴
    const colliderA = world.getCollider(handle1);
    const colliderB = world.getCollider(handle2);
    if (!colliderA || !colliderB) return; // 충돌체가 없으면 함수 종료

    // 충돌체의 부모인 리지드바디(rigid body)를 가져옴
    const rigidBodyA = colliderA.parent();
    const rigidBodyB = colliderB.parent();
    if (!rigidBodyA || !rigidBodyB) return; // 리지드바디가 없으면 함수 종료

    // 리지드바디 핸들을 이용해 dynamicBodies 배열에서 해당 객체(아이템)를 찾음
    const objA = dynamicBodies.find(o => o.body.handle === rigidBodyA.handle);
    const objB = dynamicBodies.find(o => o.body.handle === rigidBodyB.handle);

    /*
    if (!objA || !objB) {
      console.warn("❌ dynamicBodies에서 못 찾음");
      return;
    }*/

    //console.log("🔍 타입 비교:", objA.type, objB.type);

    // 두 객체 중 하나라도 이미 제거 대기열에 있으면 병합 처리 건너뛰기
    if (removalQueue.includes(objA) || removalQueue.includes(objB)) {
      console.log("🚫 제거 대기 중이라 스킵됨");
      return;
    }

    // 두 객체의 타입이 다르면 병합하지 않음
    if (objA.type !== objB.type) return;

    // 병합 규칙에 따라 다음 단계의 아이템 타입을 결정
    const nextType = MERGE_MAP[objA.type];
    if (!nextType) return; // 다음 타입이 없으면 함수 종료

    console.log(`💥 병합됨: ${objA.type} → ${nextType}`);

    // 병합된 두 객체를 제거 대기열에 추가
    removalQueue.push(objA, objB);

    // 병합된 아이템이 생성될 위치를 두 객체 사이의 중간 지점으로 계산
    const mid = new THREE.Vector3()
      .addVectors(objA.mesh.position, objB.mesh.position)
      .multiplyScalar(0.5)
      .add(new THREE.Vector3(0, 0.5, 0)); // 약간 위로 올림

    spawnItem(nextType, mid); // 새로운 아이템을 생성
  });
}