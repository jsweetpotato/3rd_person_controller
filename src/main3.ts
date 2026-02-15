import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d-compat";

await RAPIER.init();

let world: RAPIER.World;
let characterRigidBody: RAPIER.RigidBody;

let characterRotation = 0;
let cameraRotation = 0;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector("canvas")! });
renderer.setSize(window.innerWidth, window.innerHeight);

const groundGeometry = new THREE.PlaneGeometry(20, 20);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x90ee90 });
const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
groundMesh.rotation.x = -Math.PI / 2;
scene.add(groundMesh);

const characterMesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1, 1), new THREE.MeshStandardMaterial({ color: 0xff6b6b }));

characterMesh.position.set(0, 2, 0);
scene.add(characterMesh);

// Light
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 5);
scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff, 0.5));

const keys: { [key: string]: boolean } = {};

window.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;
  if (e.key === "Shift") keys["shift"] = true;
});

window.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
  if (e.key === "Shift") keys["shift"] = false;
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

world = new RAPIER.World({ x: 0.0, y: -9.81, z: 0.0 });

const groundColliderDesc = RAPIER.ColliderDesc.cuboid(10, 0.1, 10);
const groundRigidBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
world.createCollider(groundColliderDesc, groundRigidBody);

const characterRigidBodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(0, 2, 0).lockRotations();
characterRigidBody = world.createRigidBody(characterRigidBodyDesc);
const characterColliderDesc = RAPIER.ColliderDesc.capsule(1, 0.5);
world.createCollider(characterColliderDesc, characterRigidBody);

function isGrounded(): boolean {
  const position = characterRigidBody.translation();
  const velocity = characterRigidBody.linvel();
  const ray = new RAPIER.Ray({ x: position.x, y: position.y, z: position.z }, { x: 0, y: -1, z: 0 });
  const maxToi = 1.6;
  const hit = world.castRay(ray, maxToi, true);
  return hit !== null && hit.timeOfImpact < 1.6 && Math.abs(velocity.y) < 0.5;
}

// Character Movement
let characterRotationTarget = 0;
let rotationTarget = 0;

const cameraPosition = new THREE.Vector3(0, 4, -4);
const cameraWorldPosition = new THREE.Vector3(0, 4, -4);
const cameraTarget = new THREE.Object3D();

const cameraLookAtPosition = new THREE.Vector3();
const cameraLookAt = new THREE.Vector3();

function updateCharacter() {
  const velocity = characterRigidBody.linvel();
  const moveSpeed = keys["shift"] ? 10 : 5;
  const jumpSpeed = 7;

  const movement = {
    x: 0,
    z: 0,
  };

  let moveForward = 0;

  if (keys["a"]) characterRotation += 0.1;
  if (keys["d"]) characterRotation -= 0.1;

  if (movement.x !== 0) {
    rotationTarget += 0.5 * movement.x;
  }

  if (movement.x !== 0 || movement.z !== 0) {
    characterRotationTarget = Math.atan2(movement.x, movement.z);
    velocity.x = Math.sin(rotationTarget + characterRotationTarget) * 0.5;
    velocity.z = Math.cos(rotationTarget + characterRotationTarget) * 0.5;
  }

  if (keys["w"]) moveForward = -1;
  if (keys["s"]) moveForward = 1;

  let move = new THREE.Vector3(0, 0, moveForward);
  if (moveForward !== 0) {
    move.applyAxisAngle(new THREE.Vector3(0, 1, 0), characterRotation);
    move.normalize().multiplyScalar(moveSpeed);
  } else {
    move.set(0, 0, 0);
  }

  characterRigidBody.setLinvel({ x: move.x, y: velocity.y, z: move.z }, true);

  if (keys[" "] && isGrounded()) {
    characterRigidBody.setLinvel({ x: velocity.x, y: jumpSpeed, z: velocity.z }, true);
  }
}

function animate() {
  requestAnimationFrame(animate);

  updateCharacter();
  world.step();

  const position = characterRigidBody.translation();
  characterMesh.position.set(position.x, position.y, position.z);
  characterMesh.rotation.y = characterRotation;

  const cameraDistance = 8;
  const cameraHeight = 4;
  const cameraSmoothness = 0.1;

  cameraRotation += (characterRotation - cameraRotation) * cameraSmoothness;

  camera.position.x = position.x + Math.sin(cameraRotation) * cameraDistance;
  camera.position.y = position.y + cameraHeight;
  camera.position.z = position.z + Math.cos(cameraRotation) * cameraDistance;

  cameraTarget.camera.lookAt(cameraLookAt);

  renderer.render(scene, camera);
}

animate();
