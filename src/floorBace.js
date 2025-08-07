import * as THREE from "three"; // Three.js 라이브러리 가져오기
import RAPIER from "@dimforge/rapier3d-compat"; // Rapier 물리 엔진 가져오기

// 바닥(Ground) 객체를 생성하는 클래스
export default class Ground {
  // 생성자: Three.js 씬과 Rapier 물리 월드를 받아 초기화
  constructor(scene, world) {
    this.scene = scene; // Three.js 씬
    this.world = world; // Rapier 물리 월드
    this._create(); // 바닥 생성 함수 호출
  }

  // 바닥의 시각적 객체와 물리적 객체를 생성하는 함수
  _create() {
    const floorMat = new THREE.MeshStandardMaterial({ color: 0xffffff }); // 바닥 재질 설정 (흰색)
    const floorMesh = new THREE.Mesh(
      new THREE.BoxGeometry(100, 1, 100), // 바닥의 크기를 정의하는 지오메트리
      floorMat
    );
    floorMesh.receiveShadow = true; // 그림자를 받을 수 있도록 설정
    floorMesh.position.y = -1; // Y축 위치를 -1로 설정하여 아래로 내림
    this.scene.add(floorMesh); // Three.js 씬에 바닥 메시 추가

    // Rapier 물리 엔진에 고정된(fixed) 리지드바디 생성
    const floorBody = this.world.createRigidBody(
      RAPIER.RigidBodyDesc.fixed().setTranslation(0, -1, 0) // 물리 바디의 위치 설정
    );
    const floorShape = RAPIER.ColliderDesc.cuboid(50, 0.5, 50); // 바닥의 충돌체(collider)를 큐보이드 형태로 정의
    this.world.createCollider(floorShape, floorBody); // 충돌체를 물리 바디에 연결하여 물리 월드에 추가
  }
}