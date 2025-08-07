import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d-compat";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

const loader = new GLTFLoader();

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

export default class FruitFactory {
  constructor(scene, world, dynamicBodies) {
    this.scene = scene;
    this.world = world;
    this.dynamicBodies = dynamicBodies;
    this.isSpawning = false; // 🔒 중복 방지용
    this.spawnLock = false; 
  }

  async spawnItem(type = "rice", position = new THREE.Vector3(0, 10, 0), isPreview = false) {
    const config = ITEM_CONFIGS[type];
    if (!config) {
      console.warn(`❌ unknown item type: ${type}`);
      return;
    }

   if (this.isSpawning) {
      if (isPreview) {
        // 🔁 프리뷰는 기다려서 다시 시도
        while (this.isSpawning) {
          await new Promise((r) => setTimeout(r, 10));
        }
        return this.spawnItem(type, position, isPreview); // 재귀 시도
      } else {
        console.warn("⏳ spawnItem 중복 방지됨");
        return;
      }
    }

    this.isSpawning = true; // ✅ 락 걸기

    try {
      return await new Promise((resolve, reject) => {
        loader.load(
          config.glb,
          (gltf) => {
            const mesh = gltf.scene;
            mesh.scale.setScalar(config.scale);
            mesh.position.copy(position);
            mesh.castShadow = true;

            if (config.color) {
              mesh.traverse((child) => {
                if (child.isMesh) {
                  child.material = new THREE.MeshStandardMaterial({ color: config.color });
                }
              });
            }

            this.scene.add(mesh);

            const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
              .setTranslation(position.x, position.y, position.z)
              .setCanSleep(false)
              .setLinearDamping(0.5)
              .setAngularDamping(0.2);

            const body = this.world.createRigidBody(bodyDesc);
            body.userData = { type };

            if (isPreview) body.setEnabled(false); // 미리보기는 물리 꺼두기

            let colliderDesc;
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
              colliderDesc.setTranslation(0, config.collider.offsetY, 0);
            }

            if (config.collider.rotation) {
              const [rx, ry, rz] = config.collider.rotation;
              const quat = new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz));
              colliderDesc.setRotation({ x: quat.x, y: quat.y, z: quat.z, w: quat.w });
            }

            colliderDesc
              .setMass(2)
              .setRestitution(0.1)
              .setFriction(0.1)
              .setRestitutionCombineRule(RAPIER.CoefficientCombineRule.Min)
              .setFrictionCombineRule(RAPIER.CoefficientCombineRule.Min)
              .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);

            this.world.createCollider(colliderDesc, body);

            const finalObj = { mesh, body, type };
            if (!isPreview) this.dynamicBodies.push(finalObj);

            resolve(finalObj);
          },
          undefined,
          (err) => {
            console.error("❌ 모델 로드 실패", err);
            reject(err);
          }
        );
      });
    } finally {
      this.isSpawning = false; // ✅ 락 해제
    }
  }
}
