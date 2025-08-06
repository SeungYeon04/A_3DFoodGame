import * as THREE from "three";

export default class CameraCt {
  constructor(worldGroup, bottleBody) {
    this.worldGroup = worldGroup;
    this.bottleBody = bottleBody;
    this.angle = 0;
    this._updateRotation();
  }

  rotateLeft() {
    this.angle += 90;
    this._updateRotation();
  }

  rotateRight() {
    this.angle -= 90;
    this._updateRotation();
  }

  _updateRotation() {
    const rad = THREE.MathUtils.degToRad(this.angle);

    // 1. Three.js 시각적인 월드 회전
    this.worldGroup.rotation.y = rad;

    // 2. 물리 바디도 회전 적용
    if (this.bottleBody) {
      const quat = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0), rad
      );
      this.bottleBody.setNextKinematicRotation({
        x: quat.x,
        y: quat.y,
        z: quat.z,
        w: quat.w,
      });
    }
  }
}
