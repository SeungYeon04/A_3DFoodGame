import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d-compat";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

const loader = new GLTFLoader();

const ITEM_CONFIGS = {
  peach: {
    glb: "/models/peach.glb",
    scale: 1.5,
    collider: { type: "circle", radius: 1.5, offsetY: 1.5  },
  },
  apple: {
    glb: "/models/apple.glb",
    scale: 1.3,    
    collider: { type: "circle", radius: 1.3, offsetY: 1.2  }, 
  },
  plum: {
    glb: "/models/plum.glb",
    scale: 0.9,
    collider: { type: "circle", radius: 0.9, offsetY: 0.8  },  
  },
  garlic: {
    glb: "/models/garlic.glb",
    scale: 0.7,
    collider: { type: "circle", radius: 0.7, offsetY: 0.3  }, 
  },
  chili: {
    glb: "/models/chili.glb",
    scale: 0.6,
    collider: { type: "line", radius: 0.15, halfHeight: 0.3  },
  },
  rice: {
    glb: "/models/rice.glb",
    scale: 0.4,
    collider: { type: "line", radius: 0.15, halfHeight: 0.3 }, // 쌀 
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
        .setTranslation(
          position.x,
          position.y, 
          position.z
        )
        .setCanSleep(false)
        .setLinearDamping(2.0)
        .setAngularDamping(2.0);

      const body = this.world.createRigidBody(bodyDesc);

      let colliderDesc;

      switch (config.collider.type) {
        case "circle":
          colliderDesc = RAPIER.ColliderDesc.ball(config.collider.radius);
          break;
        case "line":
        default:
          colliderDesc = RAPIER.ColliderDesc.cylinder(
            config.collider.halfHeight,
            config.collider.radius
          );
          break;
      }

      if (config.collider.offsetY) {
  colliderDesc.setTranslation(0, config.collider.offsetY, 0); // 👈 이 줄
}

      colliderDesc
        .setMass(2)
        .setRestitution(0.1)
        .setFriction(1.0)
        .setRestitutionCombineRule(RAPIER.CoefficientCombineRule.Min)
        .setFrictionCombineRule(RAPIER.CoefficientCombineRule.Min);

      this.dynamicBodies.push([mesh, body]);
      this.world.createCollider(colliderDesc, body);
    },
    undefined,
    (err) => {
      console.error("❌ 모델 로드 실패", err);
    }
  );
}

}
