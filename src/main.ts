import GUI from "three/examples/jsm/libs/lil-gui.module.min.js";
import * as THREE from "three/webgpu";
import { physicsSystem } from "./physics";
import { Ground } from "./ground";
import { Player } from "./player";
import { Lights } from "./lights";
import { FBXLoader, GLTFLoader, OrbitControls } from "three/examples/jsm/Addons.js";
import { Village } from "./village";
import { lerpAngle } from "./utils";

class App {
  private $canvas = document.querySelector("canvas") as HTMLCanvasElement;

  private gui = new GUI();
  private clock = new THREE.Clock();

  private camera!: THREE.PerspectiveCamera;

  private CAMERA_HEIGHT = 3;
  private CAMERA_DISTANCE = 6;
  private CAMERA_FOLLOW_SPEED = 0.02;

  private cameraRotation = 0;

  private scene!: THREE.Scene;
  private renderer!: THREE.Renderer;

  private loaders = new Map<string, THREE.Loader>();

  // keyboard keys
  private keys: { [key: string]: boolean } = {};

  private player!: Player;

  private isRunning = false;
  private lerpFactor = 0.1;

  async init() {
    this.initCamera();
    this.initScene();
    this.initLoaders();
    await physicsSystem.init(this.scene, this.gui);
    await this.initRenderer();

    new Lights(this.scene);
    new Ground(this.scene);

    this.player = new Player();
    await this.player.init(this.scene, this.loaders);
    await new Village().init(this.scene, this.loaders);

    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.onBlur);
    window.addEventListener("resize", this.onReize);
  }

  initCamera() {
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 10, -15);
    this.camera = camera;
  }

  async initRenderer() {
    const renderer = new THREE.WebGPURenderer({
      antialias: true,
      powerPreference: "high-performance",
      alpha: true,
      canvas: this.$canvas || undefined,
    });

    await renderer.init();
    renderer.shadowMap.enabled = true;
    if (!this.$canvas) {
      document.body.appendChild(renderer.domElement);
    }

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio > 2 ? 2 : window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    const rendererGUI = this.gui.addFolder("Renderer");
    rendererGUI
      .add(renderer.shadowMap, "type", {
        PCF: THREE.PCFShadowMap,
        PCFSoft: THREE.PCFSoftShadowMap,
        VSM: THREE.VSMShadowMap,
        Basic: THREE.BasicShadowMap,
      })
      .name("Shadow Map Type");

    rendererGUI.add(renderer, "toneMapping", {
      No: THREE.NoToneMapping,
      Linear: THREE.LinearToneMapping,
      Reinhard: THREE.ReinhardToneMapping,
      Cineon: THREE.CineonToneMapping,
      ACESFilmic: THREE.ACESFilmicToneMapping,
      Agx: THREE.AgXToneMapping,
    });

    this.renderer = renderer;
  }

  initScene() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    this.scene = scene;
  }

  initLoaders() {
    const manager = new THREE.LoadingManager(
      () => {
        this.renderer.setAnimationLoop(this.animate);
      },
      (url, itemsLoaded, itemsTotal) => {},
      (url) => {
        console.log(`Error loading ${url}`);
      }
    );
    const fbxLoader = new FBXLoader(manager);
    this.loaders.set("fbx", fbxLoader);
    const gltfLoader = new GLTFLoader(manager);
    this.loaders.set("gltf", gltfLoader);
  }

  onKeyDown = (e: KeyboardEvent) => {
    this.keys[e.key.toLowerCase()] = true;
    console.log(e.key.toLowerCase());
    if (e.key === "Shift") this.keys["shift"] = true;
  };

  onKeyUp = (e: KeyboardEvent) => {
    this.keys[e.key.toLowerCase()] = false;
    if (e.key === "Shift") this.keys["shift"] = false;
  };

  onBlur = () => {
    this.keys = {};
    this.isRunning = false;
  };

  onReize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  animate = () => {
    const delta = this.clock.getDelta();
    const movement = { x: 0, z: 0 };

    physicsSystem.update();

    if (this.keys["w"] || this.keys["arrowup"]) movement.z = -1;
    if (this.keys["s"] || this.keys["arrowdown"]) movement.z = 1;
    if (this.keys["a"] || this.keys["arrowleft"]) movement.x = -1;
    if (this.keys["d"] || this.keys["arrowright"]) movement.x = 1;

    this.keys["shift"] ? (this.isRunning = true) : (this.isRunning = false);

    this.renderer.render(this.scene, this.camera);

    if (!this.player) return;

    this.player.update(delta, movement, this.cameraRotation, this.isRunning);
    const playerPos = this.player.rigidBody.translation();

    if (movement.z < 0) {
      const targetCameraRotation = this.player.rotationTarget + Math.PI;
      this.cameraRotation = lerpAngle(this.cameraRotation, targetCameraRotation, this.CAMERA_FOLLOW_SPEED);
    }

    const targetX = playerPos.x + Math.sin(this.cameraRotation) * this.CAMERA_DISTANCE;
    const targetZ = playerPos.z + Math.cos(this.cameraRotation) * this.CAMERA_DISTANCE;
    const targetY = playerPos.y + this.CAMERA_HEIGHT;

    this.camera.position.x += (targetX - this.camera.position.x) * this.lerpFactor;
    this.camera.position.z += (targetZ - this.camera.position.z) * this.lerpFactor;
    this.camera.position.y = targetY;

    this.camera.lookAt(playerPos.x, playerPos.y + 1, playerPos.z);
  };
}

await new App().init();
