import * as THREE from "three";

export default class CameraCt {
  constructor(camera, center = new THREE.Vector3(0, 5, 0)) {
    this.camera = camera;
    this.center = center;
    this.angle = 0;

    this.radius = 20;
    this.height = 5;

    this._updatePosition();
  }

  rotateLeft() {
    this.angle += 90;
    this._updatePosition();
  }

  rotateRight() {
    this.angle -= 90;
    this._updatePosition();
  }

  _updatePosition() {
    const rad = THREE.MathUtils.degToRad(this.angle);

    const x = this.center.x + this.radius * Math.sin(rad);
    const z = this.center.z + this.radius * Math.cos(rad);

    this.camera.position.set(x, this.height, z);
    this.camera.lookAt(this.center);
  }
}
