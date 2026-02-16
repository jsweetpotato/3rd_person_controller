import * as THREE from "three/webgpu";
import { physicsSystem } from "./physics";
import RAPIER from "@dimforge/rapier3d-compat";
import { lerpAngle } from "./utils";
import type { GLTF } from "three/examples/jsm/Addons.js";
import { AnimationController } from "./animationController";

const animationName = ["idle", "walk", "t-pose", "run"] as const;
type AnimationName = (typeof animationName)[number];

export class Player {
  private world = physicsSystem.world;
  private scene!: THREE.Scene;
  private loaders!: Map<string, THREE.Loader>;

  private geometry!: THREE.BoxGeometry;
  private material!: THREE.MeshStandardMaterial;
  public mesh!: THREE.Group | THREE.Mesh;
  private container = new THREE.Group();
  public rigidBody!: RAPIER.RigidBody;

  private characterRotationTarget = 0;

  private animController!: AnimationController;

  private speed: number = 0;

  private readonly WALK_SPEED = 4;
  private readonly RUN_SPEED = 8;

  async init(scene: THREE.Scene, loaders: Map<string, THREE.Loader>) {
    this.scene = scene;
    this.loaders = loaders;

    await this.createCharacterMesh();
    this.initPhysics();
    this.scene.add(this.container);
    this.container.add(this.mesh);
  }

  async createCharacterMesh() {
    const gltf = (await this.loaders.get("gltf")?.loadAsync("/models/man.glb")) as GLTF;

    if (gltf) {
      const model = gltf.scene as THREE.Group;
      model.scale.setScalar(0.05);
      model.position.y = -1.0;
      model.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      this.mesh = model;
      this.animController = new AnimationController(model, gltf.animations);
    } else {
      this.geometry = new THREE.BoxGeometry(1, 1, 1);
      this.material = new THREE.MeshStandardMaterial({ color: 0xff6b6b });
      this.mesh = new THREE.Mesh(this.geometry, this.material);
      this.mesh.position.set(0, 2, 0);
      this.mesh.castShadow = true;
    }
  }

  initPhysics() {
    if (!this.world) return;
    const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(0, 6, 0).lockRotations();
    const rigidBody = this.world.createRigidBody(rigidBodyDesc);
    const colliderDesc = RAPIER.ColliderDesc.capsule(0.5, 0.5);
    this.world.createCollider(colliderDesc, rigidBody);
    this.rigidBody = rigidBody;
  }

  get rotationTarget() {
    return this.characterRotationTarget;
  }

  update(delta: number, movement: { x: number; z: number }, cameraAngle: number, running: boolean) {
    if (!this.mesh) return;

    const vel = this.rigidBody.linvel();

    if (movement.x !== 0 || movement.z !== 0) {
      if (running) {
        this.speed = this.RUN_SPEED;
        this.animController.play("run", 0.2);
      } else {
        this.speed = this.WALK_SPEED;
        this.animController.play("walk", 0.2);
      }

      const inputAngle = Math.atan2(movement.x, movement.z);
      this.characterRotationTarget = cameraAngle + inputAngle;

      vel.x = Math.sin(this.characterRotationTarget) * this.speed;
      vel.z = Math.cos(this.characterRotationTarget) * this.speed;
    } else {
      this.animController.play("idle", 0.5);
      vel.x = 0;
      vel.z = 0;
    }

    this.animController.update(delta);

    this.mesh.rotation.y = lerpAngle(this.mesh.rotation.y, this.characterRotationTarget, 0.1);
    this.rigidBody.setLinvel(vel, true);

    const rbPos = this.rigidBody.translation();
    this.container.position.set(rbPos.x, rbPos.y, rbPos.z);
  }
}
