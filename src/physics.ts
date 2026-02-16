import * as THREE from "three/webgpu";
import RAPIER from "@dimforge/rapier3d-compat";
import type GUI from "three/examples/jsm/libs/lil-gui.module.min.js";

class PhysicsSystem {
  private _world: RAPIER.World | null = null;
  private mesh!: THREE.LineSegments;
  private debugMode: { enable: boolean } = { enable: true };

  async init(scene: THREE.Scene, gui: GUI) {
    await RAPIER.init();
    this._world = new RAPIER.World({ x: 0.0, y: -9.81, z: 0.0 });

    this.createDebugMesh();

    gui
      .add(this.debugMode, "enable")
      .name("Debug Mode")
      .onChange((v) => (this.mesh.visible = v));

    scene.add(this.mesh);
  }

  createDebugMesh() {
    this.mesh = new THREE.LineSegments(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({
        color: 0xffffff,
        vertexColors: true,
      })
    );

    this.mesh.frustumCulled = false;
  }

  get world() {
    return this._world;
  }

  public update() {
    if (!this._world) return;
    this._world.step();

    if (this.debugMode.enable) {
      const buffers = this._world.debugRender();
      this.mesh.geometry.setAttribute("position", new THREE.BufferAttribute(buffers.vertices, 3));
      this.mesh.geometry.setAttribute("color", new THREE.BufferAttribute(buffers.colors, 4));
      this.mesh.visible = true;
    }
  }
}

export const physicsSystem = new PhysicsSystem();
