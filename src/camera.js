import * as THREE from "three";

export default class CameraCt {
  // 카메라, 중심점, 각도를 초기화합니다.
  constructor(camera, center = new THREE.Vector3(0, 5, 0)) {
    this.camera = camera;
    this.center = center;
    this.angle = 0;

    // 카메라의 반지름과 높이를 설정합니다.
    this.radius = 20;
    this.height = 5;

    // 카메라 위치를 즉시 업데이트합니다.
    this._updatePosition();
  }

  // 카메라를 왼쪽으로 90도 회전시킵니다.
  rotateLeft() {
    this.angle += 90;
    this._updatePosition();
  }

  // 카메라를 오른쪽으로 90도 회전시킵니다.
  rotateRight() {
    this.angle -= 90;
    this._updatePosition();
  }

  // 현재 각도에 따라 카메라의 3D 위치를 계산하고, 중심점을 바라보게 합니다.
  _updatePosition() {
    const rad = THREE.MathUtils.degToRad(this.angle);

    // 삼각함수로 원형 궤도 상의 x, z 좌표를 계산합니다.
    const x = this.center.x + this.radius * Math.sin(rad);
    const z = this.center.z + this.radius * Math.cos(rad);

    // 계산된 위치로 카메라를 이동시킵니다.
    this.camera.position.set(x, this.height, z);
    // 카메라가 항상 중심점을 바라보게 합니다.
    this.camera.lookAt(this.center);
  }
}