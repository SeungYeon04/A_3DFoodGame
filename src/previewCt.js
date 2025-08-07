import * as THREE from "three"; // Three.js 라이브러리 가져오기

// 프리뷰 아이템의 드래그 및 생성 로직을 관리하는 클래스
export default class PreviewCt {
  // 생성자: 필요한 객체와 콜백 함수들을 받아 초기 상태를 설정
  constructor(scene, camera, spawnItemCallback, dynamicBodies) {
    this.scene = scene; // Three.js 씬
    this.camera = camera; // Three.js 카메라
    this.spawnItem = spawnItemCallback; // 아이템 생성 콜백 함수
    this.dynamicBodies = dynamicBodies; // 동적 물리 객체를 저장하는 배열

    this.currentItem = null; // 현재 프리뷰 중인 아이템
    this.nextType = "rice"; // 다음에 생성될 아이템의 종류
    this.isHolding = false; // 현재 아이템을 들고 있는지 여부

    this._setupEvents(); // 이벤트 리스너 설정
    this._preparePreview(); // 다음 아이템 미리보기 준비
  }

  // 다음 아이템을 물리 시뮬레이션 없이 미리보기로 준비하는 함수
  async _preparePreview() {
    const position = new THREE.Vector3(0, 10, 0); // 아이템의 초기 위치
    // spawnItem 함수를 호출하여 물리(isPhysics)를 끈 상태로 아이템을 생성
    this.currentItem = await this.spawnItem(this.nextType, position, true);
  }

  // 마우스/터치 이벤트를 설정하는 함수
  _setupEvents() {
    const canvas = document.querySelector("canvas"); // 캔버스 요소 가져오기
    let isDragging = false; // 드래그 중인지 여부
    let prevClientX = 0; // 이전 마우스/터치 X 좌표

    // 드래그를 시작할 때 호출되는 함수
    const startDrag = (clientX) => {
      if (!this.currentItem) return; // 현재 아이템이 없으면 함수 종료

      prevClientX = clientX; // 현재 X 좌표를 이전 좌표로 저장
      isDragging = true; // 드래그 상태 활성화
      this.isHolding = true; // 아이템을 들고 있는 상태 활성화
    };

    // 드래그 중 마우스/터치 이동 시 호출되는 함수
    const moveDrag = (clientX) => {
      if (!this.currentItem || !isDragging) return; // 아이템이 없거나 드래그 중이 아니면 함수 종료

      const deltaX = clientX - prevClientX; // 마우스/터치 이동량 계산
      prevClientX = clientX; // 현재 X 좌표를 이전 좌표로 업데이트

      const moveAmount = deltaX * 0.02; // 이동량에 감도(0.02)를 곱하여 최종 이동량 계산

      // 현재 위치에 이동량을 더하여 새로운 위치를 계산
      let newPositionX = this.currentItem.mesh.position.x + moveAmount;

      // ✅ 새로운 위치가 최대/최소 범위를 벗어나지 않도록 -3.3과 3.3 사이로 제한
      const minX = -3.3;
      const maxX = 3.3;
      newPositionX = Math.max(minX, Math.min(maxX, newPositionX));

      try {
        this.currentItem.mesh.position.x = newPositionX; // 제한된 값으로 Three.js 메시의 위치 업데이트
        this.currentItem.body.setTranslation(this.currentItem.mesh.position, true); // Rapier 물리 객체의 위치 업데이트
      } catch (e) {
        console.warn("⚠️ moveDrag setTranslation 에러 무시됨:", e);
      }
    };

    // 드래그가 끝났을 때 호출되는 함수
    const endDrag = () => {
      if (!this.currentItem || !this.isHolding) return; // 아이템이 없거나 들고 있지 않으면 함수 종료

      const { mesh, body } = this.currentItem;
      body.setEnabled(true); // 물리 시뮬레이션 활성화

      // ✅ 물리 활성화된 아이템을 동적 객체 배열에 추가
      if (!this.dynamicBodies.includes(this.currentItem)) {
        this.dynamicBodies.push(this.currentItem);
      }

      this.currentItem = null; // 현재 아이템 초기화
      this.isHolding = false; // 들고 있는 상태 비활성화
      isDragging = false; // 드래그 상태 비활성화

      // 다음에 생성될 아이템 종류를 무작위로 선택
      const types = ["rice", "chili", "garlic"];
      this.nextType = types[Math.floor(Math.random() * types.length)];

      setTimeout(() => this._preparePreview(), 50); // 약간의 지연 후 다음 프리뷰 준비
    };

    // 마우스/터치 이벤트 리스너 등록
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

    // ✅ 우클릭 방지 이벤트
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  // 매 프레임마다 호출되는 업데이트 함수 (프리뷰 아이템은 물리 시뮬레이션이 꺼져있어 비어있음)
  update() {
    // 프리뷰는 움직이지 않으므로 필요 없음
  }
}