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
  private camera!: THREE.PerspectiveCamera;
  private loaders!: Map<string, THREE.Loader>;

  private geometry!: THREE.BoxGeometry;
  private material!: THREE.MeshStandardMaterial;
  public mesh!: THREE.Group | THREE.Mesh;

  private container = new THREE.Group();

  public rigidBody!: RAPIER.RigidBody;

  private rotationTarget = 0;
  private characterRotationTarget = 0;

  public cameraPosition = new THREE.Object3D();
  public cameraTarget = new THREE.Object3D();

  private cameraWorldPosition = new THREE.Vector3();
  private cameraLookAtWorldPosition = new THREE.Vector3();
  private cameraLookAt = new THREE.Vector3();

  private animController!: AnimationController;

  private SPEED = 5;

  private isClicking = false;

  async init(scene: THREE.Scene, camera: THREE.PerspectiveCamera, loaders: Map<string, THREE.Loader>) {
    this.scene = scene;
    this.camera = camera;
    this.loaders = loaders;

    this.cameraPosition.position.set(0, 10, -4);
    this.cameraTarget.position.set(0, 0, 1.5);

    await this.createCharacterMesh();

    this.container.add(this.cameraTarget, this.cameraPosition);

    this.initPhysics();

    // this.scene.add(this.container);
    this.scene.add(this.mesh);
  }

  async createCharacterMesh() {
    const gltf = (await this.loaders.get("gltf")?.loadAsync("/models/man.glb")) as GLTF;

    if (gltf) {
      const model = gltf.scene as THREE.Group;
      model.scale.setScalar(0.05);
      this.mesh = model;

      this.animController = new AnimationController(model, gltf.animations);
    } else {
      this.geometry = new THREE.BoxGeometry(1, 1, 1);
      this.material = new THREE.MeshStandardMaterial({ color: 0xff6b6b });
      this.mesh = new THREE.Mesh(this.geometry, this.material);
      this.mesh.position.set(0, 2, 0);
      this.mesh.castShadow = true;
    }

    // this.container.add(this.mesh);
  }

  initPhysics() {
    if (!this.world) return;
    const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(0, 6, 0).lockRotations();
    const rigidBody = this.world.createRigidBody(rigidBodyDesc);

    const colliderDesc = RAPIER.ColliderDesc.capsule(0.5, 0.5);

    this.world.createCollider(colliderDesc, rigidBody);

    this.rigidBody = rigidBody;
  }

  update(delta: number, movement: { x: number; z: number }, running: boolean) {
    if (!this.mesh) return;

    const vel = this.rigidBody.linvel();

    running ? (this.SPEED = 12) : (this.SPEED = 6);

    if (movement.x !== 0 || movement.z !== 0) {
      this.characterRotationTarget = Math.atan2(movement.x, movement.z); // 캐릭터 회전각
      vel.x = Math.sin(this.rotationTarget + this.characterRotationTarget) * this.SPEED;
      vel.z = Math.cos(this.rotationTarget + this.characterRotationTarget) * this.SPEED;

      if (running) {
        this.animController.play("run", 0.2);
      } else {
        this.animController.play("walk", 0.2);
      }
    } else {
      this.animController.play("idle", 0.5);
      vel.x = 0;
      vel.z = 0;
    }

    this.animController.update(delta);

    this.mesh.rotation.y = lerpAngle(this.mesh.rotation.y, this.characterRotationTarget, 0.1);
    this.rigidBody.setLinvel(vel, true);

    this.mesh.position.copy(this.rigidBody.translation() as unknown as THREE.Vector3);

    // this.container.rotation.y = THREE.MathUtils.lerp(this.container.rotation.y, this.rotationTarget, 0.1);
  }
}
