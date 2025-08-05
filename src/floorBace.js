import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d-compat";

export default class Ground {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this._create();
  }

  _create() {
    const floorMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const floorMesh = new THREE.Mesh(
      new THREE.BoxGeometry(100, 1, 100),
      floorMat
    );
    floorMesh.receiveShadow = true;
    floorMesh.position.y = -1;
    this.scene.add(floorMesh);

    const floorBody = this.world.createRigidBody(
      RAPIER.RigidBodyDesc.fixed().setTranslation(0, -1, 0)
    );
    const floorShape = RAPIER.ColliderDesc.cuboid(50, 0.5, 50);
    this.world.createCollider(floorShape, floorBody);
  }
}
