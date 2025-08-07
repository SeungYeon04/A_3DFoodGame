import * as THREE from "three"; // Three.js 라이브러리 가져오기
import RAPIER from "@dimforge/rapier3d-compat"; // Rapier 물리 엔진 가져오기
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"; // GLTF 모델 로더 가져오기

const loader = new GLTFLoader(); // GLTFLoader 인스턴스 생성

export const ITEM_CONFIGS = {
  peach: {
    glb: "/models/peach.glb",
    scale: 1.8,
    collider: { type: "circle", radius: 1.7, offsetY: 1.7  },
  },
  apple: {
    glb: "/models/apple.glb",
    scale: 1.4,    
    collider: { type: "circle", radius: 1.45, offsetY: 1.3  }, 
  },
  plum: {
    glb: "/models/plum.glb",
    scale: 1.3,
    collider: { type: "circle", radius: 1.2, offsetY: 1.0  },  
  },
  darkgarlic: {
    glb: "/models/garlic.glb",
    color: "black",
    scale: 0.9,
        collider: {
        type: "capsule",
        radius: 0.7,         // 지름 = 0.4 (width, depth)
        halfHeight: 0.1,     // 몸통 길이 = 0.2
        offsetY: 0.7,        // 필요 시 약간 위로
        rotation: [0, 0, Math.PI / 2]
      }
  },
  garlic: {
    glb: "/models/garlic.glb",
    scale: 0.7,
        collider: {
        type: "capsule",
        radius: 0.5,         // 지름 = 0.4 (width, depth)
        halfHeight: 0.1,     // 몸통 길이 = 0.2
        offsetY: 0.5,        // 필요 시 약간 위로
        rotation: [0, 0, Math.PI / 2]
      }
  },
  chili: {
    glb: "/models/chili.glb",
    scale: 0.6,
    collider: {
        type: "capsule",
        radius: 0.2,         // 지름 = 0.4 (width, depth)
        halfHeight: 0.2,     // 몸통 길이 = 0.2
        offsetY: 0.4,        // 필요 시 약간 위로
        rotation: [0, 0, 0]
      }
  },
  rice: {
    glb: "/models/rice.glb",
    scale: 0.4,
    collider: {
    type: "capsule",
    radius: 0.2,         // 지름 = 0.4 (width, depth)
    halfHeight: 0.3,     // 몸통 길이 = 0.2
    offsetY: 0.3,        // 필요 시 약간 위로
    rotation: [0, Math.PI / 2, Math.PI / 2]
  }
  }
  
};

// 다양한 아이템(과일)을 생성하는 역할을 하는 클래스
export default class FruitFactory {
  // 생성자: 필요한 객체들을 받아 초기 상태 설정
  constructor(scene, world, dynamicBodies) {
    this.scene = scene; // Three.js 씬
    this.world = world; // Rapier 물리 월드
    this.dynamicBodies = dynamicBodies; // 동적 물리 객체 배열
    this.isSpawning = false; // 🔒 아이템 생성 중복 방지를 위한 플래그
    this.spawnLock = false; // 🔒 또 다른 잠금 플래그
  }

  // 아이템을 생성하는 비동기 함수
  async spawnItem(type = "rice", position = new THREE.Vector3(0, 10, 0), isPreview = false) {
    const config = ITEM_CONFIGS[type]; // 아이템 타입에 맞는 설정 가져오기
    if (!config) {
      console.warn(`❌ unknown item type: ${type}`); // 알 수 없는 타입 경고
      return;
    }

    if (this.isSpawning) { // 생성 중복 방지 로직
      if (isPreview) {
        // 🔁 미리보기의 경우, 생성 중일 때 잠시 기다렸다가 다시 시도
        while (this.isSpawning) {
          await new Promise((r) => setTimeout(r, 10));
        }
        return this.spawnItem(type, position, isPreview); // 재귀 호출로 재시도
      } else {
        console.warn("⏳ spawnItem 중복 방지됨"); // 일반 생성은 중복 시 무시
        return;
      }
    }

    this.isSpawning = true; // ✅ 아이템 생성 시작 시 잠금 설정

    try {
      return await new Promise((resolve, reject) => {
        // GLTF 모델을 로드
        loader.load(
          config.glb,
          (gltf) => {
            const mesh = gltf.scene; // 로드된 모델의 씬 그래프
            mesh.scale.setScalar(config.scale); // 설정된 크기로 스케일 조정
            mesh.position.copy(position); // 위치 설정
            mesh.castShadow = true; // 그림자 생성 설정

            if (config.color) { // 설정에 색상이 있으면 재질 변경
              mesh.traverse((child) => {
                if (child.isMesh) {
                  child.material = new THREE.MeshStandardMaterial({ color: config.color });
                }
              });
            }

            this.scene.add(mesh); // Three.js 씬에 메시 추가

            // Rapier 동적 리지드바디 생성
            const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
              .setTranslation(position.x, position.y, position.z) // 위치 설정
              .setCanSleep(false) // 잠자기 상태 비활성화
              .setLinearDamping(0.5) // 선형 감쇠 설정
              .setAngularDamping(0.2); // 각속도 감쇠 설정

            const body = this.world.createRigidBody(bodyDesc); // 물리 월드에 바디 생성
            body.userData = { type }; // 바디에 아이템 타입 정보 저장

            if (isPreview) body.setEnabled(false); // 미리보기는 물리 시뮬레이션 비활성화

            let colliderDesc; // 충돌체 설명자 변수
            // 설정에 따라 다른 형태의 충돌체 생성
            switch (config.collider.type) {
              case "circle":
                colliderDesc = RAPIER.ColliderDesc.ball(config.collider.radius);
                break;
              case "box":
                colliderDesc = RAPIER.ColliderDesc.cuboid(
                  config.collider.width / 2,
                  config.collider.height / 2,
                  config.collider.depth / 2
                );
                break;
              case "capsule":
                colliderDesc = RAPIER.ColliderDesc.capsule(
                  config.collider.halfHeight,
                  config.collider.radius
                );
                break;
            }

            if (config.collider.offsetY) {
              colliderDesc.setTranslation(0, config.collider.offsetY, 0); // Y축 오프셋 설정
            }

            if (config.collider.rotation) {
              // 설정된 회전 값으로 충돌체 회전 설정
              const [rx, ry, rz] = config.collider.rotation;
              const quat = new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz));
              colliderDesc.setRotation({ x: quat.x, y: quat.y, z: quat.z, w: quat.w });
            }

            // 충돌체 추가 속성 설정
            colliderDesc
              .setMass(2) // 질량 설정
              .setRestitution(0.1) // 반발 계수 설정
              .setFriction(0.1) // 마찰 계수 설정
              .setRestitutionCombineRule(RAPIER.CoefficientCombineRule.Min) // 반발 계수 병합 규칙 설정
              .setFrictionCombineRule(RAPIER.CoefficientCombineRule.Min) // 마찰 계수 병합 규칙 설정
              .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS); // 충돌 이벤트 활성화

            this.world.createCollider(colliderDesc, body); // 물리 월드에 충돌체 추가

            const finalObj = { mesh, body, type }; // 최종 객체 구성
            if (!isPreview) this.dynamicBodies.push(finalObj); // 미리보기가 아니면 동적 객체 배열에 추가

            resolve(finalObj); // 생성된 객체를 반환하며 Promise 완료
          },
          undefined,
          (err) => {
            console.error("❌ 모델 로드 실패", err); // 모델 로드 실패 시 에러 처리
            reject(err);
          }
        );
      });
    } finally {
      this.isSpawning = false; // ✅ 아이템 생성 완료 시 잠금 해제
    }
  }
}