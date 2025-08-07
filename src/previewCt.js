import * as THREE from "three";

export default class PreviewCt {
  constructor(scene, camera, spawnItemCallback, dynamicBodies) {
    this.scene = scene;
    this.camera = camera;
    this.spawnItem = spawnItemCallback;
    this.dynamicBodies = dynamicBodies;

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
let prevClientX = 0;

  const startDrag = (clientX) => {
    if (!this.currentItem) return;

    prevClientX = clientX;
    isDragging = true;
    this.isHolding = true;
  };

const moveDrag = (clientX) => {
  if (!this.currentItem || !isDragging) return;

  const deltaX = clientX - prevClientX;
  prevClientX = clientX;

  // 화면 기준 → 월드 좌표 환산해서 x축 이동
  const moveAmount = deltaX * 0.02; // 감도 조절 가능

  try {
    this.currentItem.mesh.position.x += moveAmount;
    this.currentItem.body.setTranslation(this.currentItem.mesh.position, true);
  } catch (e) {
    console.warn("⚠️ moveDrag setTranslation 에러 무시됨:", e);
  }
};


    const endDrag = () => {
      if (!this.currentItem || !this.isHolding) return;

      const { mesh, body } = this.currentItem;
      body.setEnabled(true); // 물리 ON


      // ✅ 물리 활성화된 currentItem을 dynamicBodies에 넣기
      if (!this.dynamicBodies.includes(this.currentItem)) {
        this.dynamicBodies.push(this.currentItem);
      }

      this.currentItem = null;
      this.isHolding = false;
      isDragging = false;

      const types = ["rice", "chili", "garlic", "darkgarlic", "plum", "apple", "peach"];
      this.nextType = types[Math.floor(Math.random() * types.length)];

      setTimeout(() => this._preparePreview(), 50);
    };

    canvas.addEventListener("mousedown", (e) => startDrag(e.clientX));
    canvas.addEventListener("touchstart", (e) => {
      if (e.touches.length > 0) startDrag(e.touches[0].clientX);
    }, { passive: false });

    window.addEventListener("mousemove", (e) => moveDrag(e.clientX), { passive: false });
    window.addEventListener("touchmove", (e) => {
      if (e.touches.length > 0) moveDrag(e.touches[0].clientX);
    }, { passive: false });

    window.addEventListener("mouseup", endDrag);
    window.addEventListener("touchend", endDrag);

    // ✅ 이거도 꼭
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());

  }

  update() {
    // 프리뷰는 움직이지 않으므로 필요 없음
  }
}
