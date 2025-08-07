// App.js
// --- import ---
import "./style.css"; // CSS 파일 가져오기
import * as THREE from "three"; // Three.js 라이브러리 가져오기
import { OrbitControls } from "three/addons/controls/OrbitControls.js"; // OrbitControls 가져오기
import RAPIER from "@dimforge/rapier3d-compat"; // 물리 엔진 RAPIER 가져오기

// --- Class import ---
import GlassBottle from "./glassBottle.js"; // 유리병 모델 가져오기
import FloorBace from "./floorBace.js"; // 바닥 모델 가져오기
import FruitFactory from "./fruitFactory.js"; // 과일 생성 팩토리 가져오기
import CameraCt from "./camera.js"; // 카메라 컨트롤러 가져오기
import PreviewCt from "./previewCt.js" // 미리보기 컨트롤러 가져오기
import { handleCollisions } from "./collisionEvent.js"; // 충돌 이벤트 핸들러 가져오기

// Rapier 물리 엔진의 디버그 렌더러를 정의하는 클래스
class RapierDebugRenderer {
  // 생성자: scene과 world를 받아 디버그 렌더링을 위한 메시를 초기화
  constructor(scene, world) {
    this._world = world;
    this._mesh = new THREE.LineSegments(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: 0xffffff, vertexColors: true })
    );
    this._mesh.frustumCulled = false;
    scene.add(this._mesh);
  }

  // 매 프레임마다 디버그 렌더링 정보를 업데이트
  update() {
    const { vertices, colors } = this._world.debugRender();
    this._mesh.geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
    this._mesh.geometry.setAttribute("color", new THREE.BufferAttribute(colors, 4));
    this._mesh.visible = true;
  }
}

// 애플리케이션의 핵심 로직을 담고 있는 메인 클래스
export default class App {
  // 생성자: RAPIER 물리 엔진 초기화 및 애플리케이션 설정
  constructor() {
    RAPIER.init().then(() => {
      this._world = new RAPIER.World(new RAPIER.Vector3(0, -9.81, 0));
      this._setupThreeJs(); // Three.js 관련 설정
      this._setupCamera(); // 카메라 설정
      this._setupLight(); // 조명 설정
      this._setupControls(); // 컨트롤러 설정
      this._setupModel(); // 모델 및 객체 설정
      this._eventQueue = new RAPIER.EventQueue(true);
      this._cameraController = new CameraCt(this._camera); // 카메라 컨트롤러 인스턴스 생성
      this._setupEvents(); // 이벤트 리스너 설정
      this._debug = new RapierDebugRenderer(this._scene, this._world); // 디버그 렌더러 인스턴스 생성
    });
  }

  // Three.js 렌더러와 씬을 설정하는 함수
  _setupThreeJs() {
    this._divContainer = document.querySelector("#app");
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setClearColor(new THREE.Color("#e0f7fa"), 1);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.VSMShadowMap;
    this._divContainer.appendChild(renderer.domElement);
    this._renderer = renderer;
    this._scene = new THREE.Scene();
  }

  // 카메라를 설정하는 함수
  _setupCamera() {
    const width = this._divContainer.clientWidth;
    const height = this._divContainer.clientHeight;
    this._camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    this._camera.position.set(0, 5, 20);
  }

  // 조명을 설정하는 함수
  _setupLight() {
    this._scene.add(new THREE.AmbientLight(0xffffff, 1.0));
    const spotLight1 = new THREE.SpotLight(0xffffff, 1);
    spotLight1.position.set(2.5, 10, 5);
    spotLight1.angle = Math.PI / 3;
    spotLight1.penumbra = 0.5;
    spotLight1.castShadow = true;
    this._scene.add(spotLight1);
    const spotLight2 = spotLight1.clone();
    spotLight2.position.set(-2.5, 10, 5);
    this._scene.add(spotLight2);
  }

  // 게임 내 모델(유리병, 바닥, 과일)을 설정하는 함수
  _setupModel() {
    this._dynamicBodies = []; // 동적 물리 객체를 저장할 배열
    this._removalQueue = []; // 제거할 객체를 담는 큐
    this._bottleBody = GlassBottle(this._scene, this._world, RAPIER);
    new FloorBace(this._scene, this._world);
    this._fruitFactory = new FruitFactory(this._scene, this._world, this._dynamicBodies); // 과일 생성 팩토리 인스턴스 생성

    /** 프리뷰 컨트롤러 */
    this._previewController = new PreviewCt(
      this._scene,
      this._camera,
      this._fruitFactory.spawnItem.bind(this._fruitFactory),
      this._dynamicBodies
    );
  }

  // OrbitControls를 설정하는 함수
  _setupControls() {
    this._orbitControls = new OrbitControls(this._camera, this._divContainer);
    this._orbitControls.target.set(0, 5, 0);
    this._orbitControls.update();
    this._orbitControls.enableRotate = false; // 화면 회전 비활성화
    this._orbitControls.enableZoom = false; // 줌 비활성화
    this._orbitControls.enablePan = false; // 패닝 비활성화
  }

  // 이벤트 리스너를 설정하는 함수
  _setupEvents() {
    window.onresize = this.resize.bind(this);
    this.resize();
    this._clock = new THREE.Clock();
    requestAnimationFrame(this.render.bind(this)); // 애니메이션 루프 시작

    /*
    //클릭이벤트 
    this._divContainer.addEventListener("click", () => {
      const types = ["rice", "chili", "garlic", "darkgarlic", "plum", "apple", "peach"];
      const type = types[Math.floor(Math.random() * types.length)];
      this._fruitFactory.spawnItem(type, new THREE.Vector3(0, 10, 0));
    });*/

    // 왼쪽 회전 버튼 클릭 이벤트
    document.querySelector("#btn-left").addEventListener("click", () => {
      this._cameraController.rotateLeft();
    });
    // 오른쪽 회전 버튼 클릭 이벤트
    document.querySelector("#btn-right").addEventListener("click", () => {
      this._cameraController.rotateRight();
    });
  }

  // 매 프레임마다 호출되는 업데이트 함수
  update() {
    const delta = this._clock.getDelta();
    this._world.timestep = Math.min(delta, 0.1);
    handleCollisions( // 충돌을 감지하고 병합을 처리
      this._world,
      this._eventQueue,
      this._dynamicBodies,
      this._scene,
      this._fruitFactory.spawnItem.bind(this._fruitFactory),
      this._removalQueue
    );
    // this._world.step(this._eventQueue);

    // 제거 큐에 있는 객체들을 씬과 물리 월드에서 제거
    if (this._removalQueue.length > 0) {
      for (const obj of this._removalQueue) {
        this._scene.remove(obj.mesh);
        this._world.removeRigidBody(obj.body);
        const i = this._dynamicBodies.indexOf(obj);
        if (i !== -1) this._dynamicBodies.splice(i, 1);
      }
      this._removalQueue.length = 0;
    }

    // 물리 객체의 위치와 회전을 Three.js 메시와 동기화
    for (const { mesh, body } of this._dynamicBodies) {
      mesh.position.copy(body.translation());
      mesh.quaternion.copy(body.rotation());
    }

    // 미리보기 컨트롤러 업데이트
    this._previewController.update();
    this._world.step(this._eventQueue); // 물리 엔진 시뮬레이션 한 단계 진행
    if (this._debug) this._debug.update(); // 디버그 렌더러 업데이트
    this._orbitControls.update(); // OrbitControls 업데이트
  }

  // 애니메이션 루프: 업데이트와 렌더링을 반복 호출
  render() {
    this.update();
    this._renderer.render(this._scene, this._camera);
    requestAnimationFrame(this.render.bind(this));
  }

  // 창 크기가 변경될 때 호출되는 함수
  resize() {
    const width = this._divContainer.clientWidth;
    const height = this._divContainer.clientHeight;
    this._camera.aspect = width / height;
    this._camera.updateProjectionMatrix();
    this._renderer.setSize(width, height);
  }
}

// App 클래스의 인스턴스를 생성하여 애플리케이션 시작
const app = new App();