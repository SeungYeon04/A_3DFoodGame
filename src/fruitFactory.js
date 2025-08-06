import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d-compat";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

const loader = new GLTFLoader();

const ITEM_CONFIGS = {
  rice: {
    glb: "/models/rice.glb",
    scale: 0.6,
    collider: { type: "rice", radius: 0.7 },
  },
  rice: {
    glb: "/models/rice.glb",
    scale: 0.5,
    collider: { type: "rice", radius: 0.3, halfHeight: 0.6 },
  },
  rice: {
    glb: "/models/rice.glb",
    scale: 0.4,
    collider: { type: "rice", halfExtents: [0.3, 0.3, 0.3] },
  },
  rice: {
    glb: "/models/rice.glb",
    scale: 0.5,
    collider: { type: "rice", radius: 0.3, halfHeight: 0.5 },
  },
};

export default class FruitFactory {
  constructor(scene, world, dynamicBodies) {
    this.scene = scene;
    this.world = world;
    this.dynamicBodies = dynamicBodies;
  }

  spawnItem(type = "watermelon", position = new THREE.Vector3(0, 5, 0)) {
    const config = ITEM_CONFIGS[type];
    if (!config) {
      console.warn(`❌ unknown item type: ${type}`);
      return;
    }

    loader.load(
      config.glb,
      gltf => {
        const mesh = gltf.scene;
        mesh.scale.setScalar(config.scale);
        mesh.position.copy(position);
        mesh.castShadow = true;
        this.scene.add(mesh);

        const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
          .setTranslation(position.x, position.y, position.z)
          .setCanSleep(false)
          .setLinearDamping(1.5)
          .setAngularDamping(2.0);

        const body = this.world.createRigidBody(bodyDesc);

        let colliderDesc;

        //타입으로 불러옴 
        switch (config.collider.type) {
          case "rice":
            colliderDesc = RAPIER.ColliderDesc.ball(config.collider.radius);
            break;
          case "rice":
            colliderDesc = RAPIER.ColliderDesc.cylinder(
              config.collider.halfHeight,
              config.collider.radius
            );
            break;
          case "rice":
            colliderDesc = RAPIER.ColliderDesc.cuboid(
              ...config.collider.halfExtents
            );
            break;
          default:
            console.warn("⚠️ Unknown collider type");
            return;
        }

        colliderDesc
          .setMass(2)
          .setRestitution(0)
          .setFriction(1)
          .setRestitutionCombineRule(RAPIER.CoefficientCombineRule.Min)
          .setFrictionCombineRule(RAPIER.CoefficientCombineRule.Min);

        this.world.createCollider(colliderDesc, body);
        this.dynamicBodies.push([mesh, body]);
      },
      undefined,
      err => {
        console.error("❌ 모델 로드 실패", err);
      }
    );
  }
}