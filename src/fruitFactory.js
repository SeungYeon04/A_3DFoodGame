import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d-compat";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

const loader = new GLTFLoader();

// ⚠️ 일부러 여러 번 덮어쓰기 하는 구조 (마지막만 사용됨)
const ITEM_CONFIGS = {
  
  peach: {
    glb: "/models/peach.glb",
    scale: 0.5,
    collider: { type: "peach", radius: 0.3, halfHeight: 0.6 },
  },
  apple: {
    glb: "/models/apple.glb",
    scale: 0.4,    
    collider: { type: "apple", radius: 0.15, halfHeight: 0.3 }, // 자두
  },
  plum: {
    glb: "/models/plum.glb",
    scale: 0.4,
    collider: { type: "plum", radius: 0.15, halfHeight: 0.3 }, // 쌀 
  },
  garlic: {
    glb: "/models/garlic.glb",
    scale: 0.4,
    collider: { type: "garlic", radius: 0.15, halfHeight: 0.3 }, // 쌀 
  },
  chili: {
    glb: "/models/chili.glb",
    scale: 0.6,
    collider: { type: "chili", radius: 0.15, halfHeight: 0.3  },
  },
  rice: {
    glb: "/models/rice.glb",
    scale: 0.4,
    collider: { type: "rice", radius: 0.15, halfHeight: 0.3 }, // 쌀 
  },
  
};

export default class FruitFactory {
  constructor(scene, world, dynamicBodies) {
    this.scene = scene;
    this.world = world;
    this.dynamicBodies = dynamicBodies;
  }

  spawnItem(type = "rice", position = new THREE.Vector3(0, 10, 0)) {
    const config = ITEM_CONFIGS[type];
    if (!config) {
      console.warn(`❌ unknown item type: ${type}`);
      return;
    }

    loader.load(
      config.glb,
      (gltf) => {
        const mesh = gltf.scene;
        mesh.scale.setScalar(config.scale);
        mesh.position.copy(position);
        mesh.castShadow = true;
        this.scene.add(mesh);

        const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
          .setTranslation(position.x, position.y, position.z)
          .setCanSleep(false)
          .setLinearDamping(2.0)   // 낙하 중 좌우 이동 최소화
          .setAngularDamping(2.0); // 낙하 중 회전 최소화

        const body = this.world.createRigidBody(bodyDesc);

        const colliderDesc = RAPIER.ColliderDesc.cylinder(
          config.collider.halfHeight,
          config.collider.radius
        )
          .setMass(2)
          .setRestitution(0.1)
          .setFriction(1.0)
          .setRestitutionCombineRule(RAPIER.CoefficientCombineRule.Min)
          .setFrictionCombineRule(RAPIER.CoefficientCombineRule.Min);

        this.dynamicBodies.push([mesh, body]);
        this.world.createCollider(colliderDesc, body);


        // ✅ 직선 낙하 → 회전력 없음 (충돌로만 반응)
      },
      undefined,
      (err) => {
        console.error("❌ 모델 로드 실패", err);
      }
    );
  }
}
