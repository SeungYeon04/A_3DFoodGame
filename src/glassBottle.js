// glassBottle.js
import * as THREE from "three"; // Three.js 라이브러리 가져오기

// 유리병(충돌벽)을 생성하고 Three.js 씬과 Rapier 물리 월드에 추가하는 함수
export default function GlassBottle(scene, world, RAPIER) {
  // 유리 재질을 정의
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x88ccee, // 색상
    transparent: true, // 투명 여부
    opacity: 0.3, // 투명도
    roughness: 0.1, // 거칠기
  });

  // 벽의 두께, 너비, 높이, 깊이를 정의
  const wallT = 0.2, w = 8, h = 10, d = 4;

  // 각 벽의 크기 및 위치 정보를 담은 배열
  const wallConfigs = [
    [w, h, wallT, 0, h / 2, -d / 2], // 뒤쪽 벽 (너비, 높이, 두께, x, y, z)
    [w, h, wallT, 0, h / 2, d / 2],  // 앞쪽 벽
    [wallT, h, d, -w / 2, h / 2, 0], // 왼쪽 벽
    [wallT, h, d, w / 2, h / 2, 0],  // 오른쪽 벽
    [w, wallT, d, 0, wallT / 2, 0]
  ];

  // 물리 시뮬레이션에서 움직이지 않는 키네마틱(kinematic) 리지드바디를 생성
  const staticBody = world.createRigidBody(
    RAPIER.RigidBodyDesc.kinematicPositionBased()
  );

  // wallConfigs 배열을 순회하며 각 벽을 생성
  wallConfigs.forEach(([x, y, z, px, py, pz]) => {
    // Three.js 메시(시각적 객체)를 생성하고 씬에 추가
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(x, y, z), glassMat);
    mesh.position.set(px, py, pz);
    scene.add(mesh);

    // Rapier 충돌체를 생성하고 설정
    const collider = RAPIER.ColliderDesc.cuboid(x / 2, y / 2, z / 2)
      .setTranslation(px, py, pz) // 위치 설정
      .setRestitution(0) // 반발 계수 (탄성)
      .setFriction(1); // 마찰 계수

    // 생성된 충돌체를 리지드바디에 연결하여 물리 세계에 추가
    world.createCollider(collider, staticBody);
  });

  // ✅ 생성된 리지드바디를 반환
  return staticBody;
}