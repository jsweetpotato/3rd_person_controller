import GUI from "three/examples/jsm/libs/lil-gui.module.min.js";
import * as THREE from "three/webgpu";
import { physicsSystem } from "./physics";
import { Ground } from "./ground";
import { Player } from "./player";
import { Lights } from "./lights";
import { FBXLoader, GLTFLoader, OrbitControls } from "three/examples/jsm/Addons.js";
import { Village } from "./village";

class App {
  private camera!: THREE.PerspectiveCamera;
  private CAMERA_HEIGHT = 8;
  private CAMERA_DISTANCE = 15;
  private CAMERA_SMOOTHNESS = 0.01;
  private cameraRotation = 0;

  private scene!: THREE.Scene;
  private renderer!: THREE.Renderer;
  private $canvas = document.querySelector("canvas") as HTMLCanvasElement;
  private controls!: OrbitControls;

  private loaders = new Map<string, THREE.Loader>();

  private gui = new GUI();

  private player!: Player;

  private clock = new THREE.Clock();

  private keys: { [key: string]: boolean } = {};

  private isRunning = false;

  async init() {
    this.initCamera();
    this.initScene();
    // this.initControls();
    this.initLoaders();
    await physicsSystem.init(this.scene, this.gui);

    await this.initRenderer();

    new Lights(this.scene);
    new Ground(this.scene);

    this.player = new Player();
    await this.player.init(this.scene, this.camera, this.loaders);
    await new Village().init(this.scene, this.loaders);
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("resize", this.onReize);
  }

  initCamera() {
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 10, -15);
    this.camera = camera;
  }

  initControls() {
    const controls = new OrbitControls(this.camera, this.$canvas || this.renderer.domElement);

    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    this.controls = controls;
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
    // renderer.setAnimationLoop(this.animate);

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
      (url, itemsLoaded, itemsTotal) => {
        console.log(Math.floor((itemsLoaded / itemsTotal) * 100) + "% loaded");
      },
      (url) => {
        console.log(`Error loading ${url}`);
      }
    );
    const fbxLoader = new FBXLoader(manager);
    this.loaders.set("fbx", fbxLoader);

    const gltfLoader = new GLTFLoader(manager);
    this.loaders.set("gltf", gltfLoader);
    // Character_Male.fbx
  }

  // ------------------- Event ----------------------

  onKeyDown = (e: KeyboardEvent) => {
    this.keys[e.key.toLowerCase()] = true;
    if (e.key === "Shift") this.keys["shift"] = true;
  };

  onKeyUp = (e: KeyboardEvent) => {
    this.keys[e.key.toLowerCase()] = false;
    if (e.key === "Shift") this.keys["shift"] = false;
  };

  onReize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  // ------------------- Animation ------------------
  animate = () => {
    const delta = this.clock.getDelta();

    const movement = {
      x: 0,
      z: 0,
    };

    physicsSystem.update();

    if (this.keys["w"]) movement.z = -1;
    if (this.keys["s"]) movement.z = +1;
    if (this.keys["a"]) movement.x = -1;
    if (this.keys["d"]) movement.x = 1;
    if (this.keys["shift"]) this.isRunning = true;
    else this.isRunning = false;

    // this.controls?.update();

    if (this.player) {
      this.player.update(delta, movement, this.isRunning);
      const playerPos = this.player.rigidBody.translation();
      // const CharacterRotation = this.player.mesh.rotation.y;
      // this.cameraRotation -= (CharacterRotation - this.cameraRotation) * this.CAMERA_SMOOTHNESS;
      const targetX = playerPos.x + Math.sin(this.cameraRotation) * this.CAMERA_DISTANCE;
      const targetZ = playerPos.z + Math.cos(this.cameraRotation) * this.CAMERA_DISTANCE;
      const targetY = playerPos.y + this.CAMERA_HEIGHT;

      const lerpFactor = 0.6;

      this.camera.position.x += (targetX - this.camera.position.x) * lerpFactor;
      this.camera.position.z += (targetZ - this.camera.position.z) * lerpFactor;

      this.camera.position.y = targetY;

      this.camera.lookAt(playerPos.x, playerPos.y + 1, playerPos.z);
    }

    this.renderer.render(this.scene, this.camera);
  };
}

await new App().init();
