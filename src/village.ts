import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d-compat";
import { physicsSystem } from "./physics";
import type { GLTF } from "three/examples/jsm/Addons.js";
import { getModelSize, getWorldTransform } from "./utils";

export class Village {
  private model: THREE.Group<THREE.Object3DEventMap> | null = null;
  private world = physicsSystem.world;
  scene!: THREE.Scene;

  async init(scene: THREE.Scene, loaders: Map<string, THREE.Loader>) {
    this.scene = scene;

    const gltf = (await loaders.get("gltf")?.loadAsync("/models/medieval_village.glb")) as GLTF;

    if (!gltf) return;
    const model = gltf.scene;
    model.scale.setScalar(0.1);
    scene.add(model);
  }

  initPhysics() {
    if (!this.model) return;

    this.model.children.forEach((v) => {
      if (v instanceof THREE.Object3D) {
        const mesh = v as THREE.Mesh;

        if (mesh.geometry) {
          console.log(mesh.geometry.attributes?.index);
          // const colliderDesc = RAPIER.ColliderDesc.trimesh (mesh.geometry.attributes.position.array as Float32Array,  )
        }
      }
    });
  }
}
