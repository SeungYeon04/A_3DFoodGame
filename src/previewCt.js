import * as THREE from "three";

export default class PreviewCt {
  constructor(scene, camera, spawnItemCallback) {
    this.scene = scene;
    this.camera = camera;
    this.spawnItem = spawnItemCallback;

    this.currentItem = null;
    this.nextType = "rice";
    this.isHolding = false;

    this._setupEvents();
    this._preparePreview();
  }

  async _preparePreview() {
    const position = new THREE.Vector3(0, 10, 0);
    this.currentItem = await this.spawnItem(this.nextType, position, true); // 프리뷰: 물리 OFF
  }

  _setupEvents() {
    const canvas = document.querySelector("canvas");
    let isDragging = false;
    let dragOffsetX = 0;

    const getWorldX = (clientX) => {
      const mouse = new THREE.Vector2((clientX / window.innerWidth) * 2 - 1, 0);
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, this.camera);

      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      const hit = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, hit);
      return hit.x;
    };

    const startDrag = (clientX) => {
      if (!this.currentItem) return;
      const worldX = getWorldX(clientX);
      dragOffsetX = this.currentItem.mesh.position.x - worldX;
      isDragging = true;
      this.isHolding = true;
    };

    const moveDrag = (clientX) => {
      if (!this.currentItem || !isDragging) return;
      const worldX = getWorldX(clientX);
      this.currentItem.mesh.position.x = worldX + dragOffsetX;
      this.currentItem.body.setTranslation(this.currentItem.mesh.position, true); // 이동 반영
    };

    const endDrag = () => {
      if (!this.currentItem || !this.isHolding) return;

      const { mesh, body } = this.currentItem;
      body.setTranslation(mesh.position, true); // 위치 반영
      body.setEnabled(true); // 물리 ON

      this.currentItem = null;
      this.isHolding = false;
      isDragging = false;

      const types = ["rice", "chili", "garlic", "darkgarlic", "plum", "apple", "peach"];
      this.nextType = types[Math.floor(Math.random() * types.length)];

      setTimeout(() => this._preparePreview(), 50);
    };

    // PC
    canvas.addEventListener("pointerdown", (e) => startDrag(e.clientX));
    canvas.addEventListener("pointermove", (e) => moveDrag(e.clientX));
    window.addEventListener("pointerup", endDrag);

    // 모바일
    canvas.addEventListener("touchstart", (e) => {
      if (e.touches.length > 0) startDrag(e.touches[0].clientX);
    });
    canvas.addEventListener("touchmove", (e) => {
      if (e.touches.length > 0) moveDrag(e.touches[0].clientX);
    });
    canvas.addEventListener("touchend", endDrag);
  }

  update() {
    // 프리뷰는 움직이지 않으므로 필요 없음
  }
}
