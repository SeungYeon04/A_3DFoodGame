// App.js
import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import RAPIER from "@dimforge/rapier3d-compat";

import GlassBottle from "./glassBottle.js";
import FloorBace from "./floorBace.js";
import FruitFactory from "./fruitFactory.js";
import CameraCt from "./camera.js";
import PreviewCt from "./previewCt.js"
import { handleCollisions } from "./collisionEvent.js";

class RapierDebugRenderer {
  constructor(scene, world) {
    this._world = world;
    this._mesh = new THREE.LineSegments(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: 0xffffff, vertexColors: true })
    );
    this._mesh.frustumCulled = false;
    scene.add(this._mesh);
  }

  update() {
    const { vertices, colors } = this._world.debugRender();
    this._mesh.geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
    this._mesh.geometry.setAttribute("color", new THREE.BufferAttribute(colors, 4));
    this._mesh.visible = true;
  }
}

export default class App {
  constructor() {
    RAPIER.init().then(() => {
      this._world = new RAPIER.World(new RAPIER.Vector3(0, -9.81, 0));
      this._setupThreeJs();

      this._setupCamera();
      this._setupLight();
      this._setupControls();
      this._setupModel();

      this._eventQueue = new RAPIER.EventQueue(true);
      this._cameraController = new CameraCt(this._camera);

      this._setupEvents();
      this._debug = new RapierDebugRenderer(this._scene, this._world);
    });
  }

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

  _setupCamera() {
    const width = this._divContainer.clientWidth;
    const height = this._divContainer.clientHeight;
    this._camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    this._camera.position.set(0, 5, 20);
  }

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

  _setupModel() {
    this._dynamicBodies = [];
    this._removalQueue = [];
    this._bottleBody = GlassBottle(this._scene, this._world, RAPIER);
    new FloorBace(this._scene, this._world);
    this._fruitFactory = new FruitFactory(this._scene, this._world, this._dynamicBodies);
  
    /** 프리뷰 컨트롤러 */
    this._previewController = new PreviewCt(
    this._scene,
    this._camera,
    this._fruitFactory.spawnItem.bind(this._fruitFactory),
    );
  }

  _setupControls() {
    this._orbitControls = new OrbitControls(this._camera, this._divContainer);
    this._orbitControls.target.set(0, 5, 0);
    this._orbitControls.update();

    // ✅ 마우스/터치로 화면 회전 완전 비활성화
    this._orbitControls.enableRotate = false;
    this._orbitControls.enableZoom = false;
    this._orbitControls.enablePan = false;
  }

  _setupEvents() {
    window.onresize = this.resize.bind(this);
    this.resize();
    this._clock = new THREE.Clock();
    requestAnimationFrame(this.render.bind(this));

    /*
    //클릭이벤트 
    this._divContainer.addEventListener("click", () => {
      const types = ["rice", "chili", "garlic", "darkgarlic", "plum", "apple", "peach"];
      const type = types[Math.floor(Math.random() * types.length)];
      this._fruitFactory.spawnItem(type, new THREE.Vector3(0, 10, 0));
    });*/



    document.querySelector("#btn-left").addEventListener("click", () => {
      this._cameraController.rotateLeft();
    });

    document.querySelector("#btn-right").addEventListener("click", () => {
      this._cameraController.rotateRight();
    });
  }

  update() {
    const delta = this._clock.getDelta();
    this._world.timestep = Math.min(delta, 0.1);
    this._world.step(this._eventQueue);

    // 병합 체크
    handleCollisions(
      this._world,
      this._eventQueue,
      this._dynamicBodies,
      this._scene,
      this._fruitFactory.spawnItem.bind(this._fruitFactory),
      this._removalQueue
    );

    // 제거 큐 반영
    if (this._removalQueue.length > 0) {
      for (const obj of this._removalQueue) {
        this._scene.remove(obj.mesh);
        this._world.removeRigidBody(obj.body);
        const i = this._dynamicBodies.indexOf(obj);
        if (i !== -1) this._dynamicBodies.splice(i, 1);
      }
      this._removalQueue.length = 0;
    }

    // 위치 동기화
    for (const { mesh, body } of this._dynamicBodies) {
      mesh.position.copy(body.translation());
      mesh.quaternion.copy(body.rotation());
    }

    //프리뷰컨트롤러 
    this._previewController.update();

    if (this._debug) this._debug.update();
    this._orbitControls.update();
  }

  render() {
    this.update();
    this._renderer.render(this._scene, this._camera);
    requestAnimationFrame(this.render.bind(this));
  }

  resize() {
    const width = this._divContainer.clientWidth;
    const height = this._divContainer.clientHeight;
    this._camera.aspect = width / height;
    this._camera.updateProjectionMatrix();
    this._renderer.setSize(width, height);
  }
}

const app = new App();
