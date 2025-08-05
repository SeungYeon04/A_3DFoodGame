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
      RAPIER.RigidBodyDesc.dynamic().setTranslation(position.x, position.y, position.z).setCanSleep(false)
    );
    colliderDesc.setMass(1).setRestitution(1.1);
    this.world.createCollider(colliderDesc, body);

    this.dynamicBodies.push([mesh, body]);
  }
}
