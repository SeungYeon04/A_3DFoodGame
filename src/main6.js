import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import RAPIER from "@dimforge/rapier3d-compat";

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
    this._mesh.geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(vertices, 3)
    );
    this._mesh.geometry.setAttribute(
      "color",
      new THREE.BufferAttribute(colors, 4)
    );
    this._mesh.visible = true;
  }
}

export default class App {
  constructor() {
    RAPIER.init().then(() => {
      const world = new RAPIER.World(new RAPIER.Vector3(0, -9.81, 0));
      this._world = world;

      this._setupThreeJs();
      this._setupCamera();
      this._setupLight();
      this._setupControls();
      this._setupModel();
      this._setupEvents();

      this._debug = new RapierDebugRenderer(this._scene, this._world);
    });
  }

  _setupThreeJs() {
    const divContainer = document.querySelector("#app");
    this._divContainer = divContainer;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setClearColor(new THREE.Color("#e0f7fa"), 1);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.VSMShadowMap;
    divContainer.appendChild(renderer.domElement);
    this._renderer = renderer;
    this._scene = new THREE.Scene();
  }

  _setupCamera() {
    const width = this._divContainer.clientWidth;
    const height = this._divContainer.clientHeight;
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.set(0, 20, 20);
    this._camera = camera;
  }

  _setupLight() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    this._scene.add(ambientLight);

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

    // 유리통
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x88ccee,
      transparent: true,
      opacity: 0.3,
      roughness: 0.1,
    });

    const wallT = 0.2, w = 8, h = 10, d = 4;
    const walls = [
      [w, h, wallT, 0, h / 2, -d / 2], // 뒤
      [w, h, wallT, 0, h / 2, d / 2],  // 앞
      [wallT, h, d, -w / 2, h / 2, 0], // 좌
      [wallT, h, d, w / 2, h / 2, 0],  // 우
    ];
    walls.forEach(([x, y, z, px, py, pz]) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(x, y, z), glassMat);
      mesh.position.set(px, py, pz);
      this._scene.add(mesh);
    });

    // 바닥
    const floorMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const floorMesh = new THREE.Mesh(new THREE.BoxGeometry(100, 1, 100), floorMat);
    floorMesh.receiveShadow = true;
    floorMesh.position.y = -1;
    this._scene.add(floorMesh);

    const floorBody = this._world.createRigidBody(
      RAPIER.RigidBodyDesc.fixed().setTranslation(0, -1, 0)
    );
    const floorShape = RAPIER.ColliderDesc.cuboid(50, 0.5, 50);
    this._world.createCollider(floorShape, floorBody);
  }

  _setupControls() {
    this._orbitControls = new OrbitControls(this._camera, this._divContainer);
  }

  _setupEvents() {
    window.onresize = this.resize.bind(this);
    this.resize();
    this._clock = new THREE.Clock();
    requestAnimationFrame(this.render.bind(this));

    this._divContainer.addEventListener("click", () => {
      const types = ["box", "sphere", "cylinder", "torus"];
      const type = types[Math.floor(Math.random() * types.length)];
      const pos = new THREE.Vector3(0, 10, 0);
      this._ItemShow(type, pos);
    });
  }

  _ItemShow(type = "box", position = new THREE.Vector3(0, 5, 0)) {
    const mat = new THREE.MeshStandardMaterial({ metalness: 0.5, roughness: 0 });
    let mesh, colliderDesc;

    switch (type) {
      case "sphere":
        mesh = new THREE.Mesh(new THREE.SphereGeometry(1), mat);
        colliderDesc = RAPIER.ColliderDesc.ball(1);
        break;
      case "cylinder":
        mesh = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 2, 16), mat);
        colliderDesc = RAPIER.ColliderDesc.cylinder(1, 1);
        break;
      case "torus":
        mesh = new THREE.Mesh(new THREE.TorusKnotGeometry(), mat);
        colliderDesc = RAPIER.ColliderDesc.trimesh(
          new Float32Array(mesh.geometry.attributes.position.array),
          new Uint32Array(mesh.geometry.index.array)
        );
        break;
      default:
        mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat);
        colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5);
    }

    mesh.castShadow = true;
    mesh.position.copy(position);
    this._scene.add(mesh);

    const body = this._world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic().setTranslation(position.x, position.y, position.z).setCanSleep(false)
    );
    colliderDesc.setMass(1).setRestitution(1.1);
    this._world.createCollider(colliderDesc, body);
    this._dynamicBodies.push([mesh, body]);
  }

  update() {
    const delta = this._clock.getDelta();
    this._world.timestep = Math.min(delta, 0.1);
    this._world.step();
    this._dynamicBodies.forEach(([mesh, body]) => {
      mesh.position.copy(body.translation());
      mesh.quaternion.copy(body.rotation());
    });
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
