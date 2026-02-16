import * as THREE from "three";
import { physicsSystem } from "./physics";
import RAPIER from "@dimforge/rapier3d-compat";

export class Ground {
  private world = physicsSystem.world;

  // private geometry = new THREE.PlaneGeometry(12, 9);
  // private material = new THREE.MeshStandardMaterial({ color: 0x888888 });
  // private mesh = new THREE.Mesh(this.geometry, this.material);

  constructor(public scene: THREE.Scene) {
    // this.mesh.rotation.x = -Math.PI / 2;
    // this.mesh.receiveShadow = true;
    // this.scene.add(this.mesh);

    this.initPhysics();
  }

  initPhysics() {
    if (!this.world) return;
    const groundColliderDesc = RAPIER.ColliderDesc.cuboid(59, 0.1, 46);
    const groundRigidBody = this.world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
    this.world.createCollider(groundColliderDesc, groundRigidBody);
  }
}
