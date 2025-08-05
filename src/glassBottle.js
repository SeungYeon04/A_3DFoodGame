import * as THREE from "three";

export default  function GlassBottle(scene) {
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x88ccee,
    transparent: true,
    opacity: 0.3,
    roughness: 0.1,
  });

  const wallT = 0.2, w = 8, h = 10, d = 4;
  const wallConfigs = [
    [w, h, wallT, 0, h / 2, -d / 2], // back
    [w, h, wallT, 0, h / 2, d / 2],  // front
    [wallT, h, d, -w / 2, h / 2, 0], // left
    [wallT, h, d, w / 2, h / 2, 0],  // right
  ];

  wallConfigs.forEach(([x, y, z, px, py, pz]) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(x, y, z), glassMat);
    mesh.position.set(px, py, pz);
    scene.add(mesh);
  });
}
