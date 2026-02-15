import * as THREE from "three/webgpu";
export class Lights {
  constructor(scene: THREE.Scene) {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 5);
    // directionalLight.castShadow = true;
    // directionalLight.shadow.mapSize.width = 1024;
    // directionalLight.shadow.mapSize.height = 1024;
    // directionalLight.shadow.camera.near = 0.5;
    // directionalLight.shadow.camera.far = 50;
    // directionalLight.shadow.camera.left = -10;
    // directionalLight.shadow.camera.right = 10;
    // directionalLight.shadow.camera.top = 10;
    // directionalLight.shadow.camera.bottom = -10;
    scene.add(directionalLight);
  }
}
