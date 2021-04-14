import * as THREE from "./three/build/three.module.js";

import Stats from "./three/examples/jsm/libs/stats.module.js";
import { GLTFLoader } from "./three/examples/jsm/loaders/GLTFLoader.js";
import { EffectComposer } from "./three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "./three/examples/jsm/postprocessing/RenderPass.js";
import { FilmPass } from "./three/examples/jsm/postprocessing/FilmPass.js";
//import { UnrealBloomPass } from './three/examples/jsm/postprocessing/UnrealBloomPass.js';

import { AABB } from "./collision/collision.js";
import { Factory } from "./factory.js";
import { HashGrid } from "./collision/hashgrid.js";
import { Explosion } from "./particles/particles.js";
import { ViewManager } from "./view-manager.js";
import { TerrainManager } from "./terrain/terrain.js";
import { GameObjectArray } from "./engine/game-object-array.js";

// Debug
const pauseDisplay = document.querySelector("#paused");
const hud = document.querySelector("#hud-img");
const canvas = document.querySelector("#canvas");

const width = 640;
const height = 480;

const camera = new THREE.PerspectiveCamera(75, width / height, 0.01, 15000);
const sensor = new THREE.PerspectiveCamera(75, width / height, 0.01, 15000);
const listener = new THREE.AudioListener();
camera.add(listener);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xcce0ff);
//scene.fog = new THREE.Fog( 0xcce0ff, 500, 10000 );

// Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    logarithmicDepthBuffer: true,
});

renderer.setSize(width, height);
renderer.setClearColor("red");
renderer.shadowMap.enabled = true;
renderer.physicallyCorrectLights = true;
renderer.shadowMap.type = THREE.BasicShadowMap;

// Composer
const cameraRenderer = new EffectComposer(renderer);
cameraRenderer.addPass(new RenderPass(scene, camera));
const sensorRenderer = new EffectComposer(renderer);
sensorRenderer.addPass(new RenderPass(scene, sensor));
sensorRenderer.addPass(new FilmPass(0.35, 0.5, 2048, false));

// Stats
const stats = new Stats();
document.body.appendChild(stats.dom);

// Lights
const sun = new THREE.DirectionalLight(0x404040, 6);
sun.position.set(1000, 5000, 1000);
sun.castShadow = true;
sun.shadow.mapSize.width = 2048;
sun.shadow.mapSize.height = 2048;
sun.shadow.camera.near = 1000;
sun.shadow.camera.far = 20000;
sun.shadow.camera.left = -50;
sun.shadow.camera.bottom = -50;
sun.shadow.camera.top = 50;
sun.shadow.camera.right = 50;
scene.add(sun);
scene.add(sun.target);
const ambientLight = new THREE.AmbientLight(0x404040, 4.0);
scene.add(ambientLight);

let assets = {
    gltf: {
        drone: {
            url: "assets/objects/MQ-9v3.glb",
        },
        hellfire: {
            url: "assets/objects/AGM-114.glb",
        },
    },
    textures: {
        heightmap: {
            url: "assets/textures/heightmap.png",
        },
    },
    audio: {
        engine: {
            url: "assets/audio/engine2.mp3",
        },
    },
};

init();

let paused = false,
    sensorView = false;
let grid, goa, aircraft, terrain, heightmap, viewManager, factory, explosions;

async function init() {
    const promises = [];

    let loader = null;
    loader = new THREE.AudioLoader();
    for (const resource of Object.values(assets.audio)) {
        const p = new Promise((resolve, reject) => {
            loader.load(
                resource.url,
                (data) => {
                    resource.asset = data;
                    resolve(resource);
                },
                null,
                reject
            );
        });
        promises.push(p);
    }

    loader = new THREE.TextureLoader();
    for (const resource of Object.values(assets.textures)) {
        const p = new Promise((resolve, reject) => {
            loader.load(
                resource.url,
                (data) => {
                    resource.asset = data;
                    resolve(resource);
                },
                null,
                reject
            );
        });
        promises.push(p);
    }

    loader = new GLTFLoader();
    for (const resource of Object.values(assets.gltf)) {
        const p = new Promise((resolve, reject) => {
            loader.load(
                resource.url,
                (data) => {
                    resource.asset = data;
                    resolve(resource);
                },
                null,
                reject
            );
        });
        promises.push(p);
    }

    await Promise.all(promises);

    goa = new GameObjectArray();
    grid = new HashGrid(2);
    factory = new Factory(assets, scene, goa, camera, grid, sensor, listener);
    viewManager = new ViewManager(goa, camera);
    explosions = new Explosion(
        scene,
        "assets/textures/explosion2.png",
        listener
    );

    aircraft = factory.createAircraft(
        new THREE.Vector3(0, 300, 0),
        new THREE.Vector3(10, 0, 0)
    );
    terrain = factory.createTerrain();
    heightmap = terrain.getComponent(TerrainManager);

    factory.createTestCube(
        new THREE.Vector3(800, heightmap.getHeight(800, 200), 200)
    );
    factory.createTestCube(
        new THREE.Vector3(800, heightmap.getHeight(800, 0), 0)
    );

    goa._addQueued();
    viewManager._init();

    document.addEventListener(
        "keydown",
        (e) => {
            switch (e.code) {
                case "KeyP":
                    paused = !paused;
                    pauseDisplay.style.display = paused ? "block" : "none";
                    aircraft.publish("paused", { paused: paused });
                    break;

                case "Digit1":
                    sensorView = !sensorView;
                    viewManager.setActive(0);
                    hud.style.display = sensorView ? "block" : "none";
                    break;

                case "Digit2":
                    if (!sensorView) viewManager.toggle();
                    break;
            }
        },
        false
    );

    animate();
}

let dt = 0,
    then = 0;
function animate(now) {
    now *= 0.001;
    dt = now - then;
    then = now;
    if (dt > 0.1 || isNaN(dt)) dt = 0.1;

    if (!paused) {
        goa.forEach((gameObject) => {
            gameObject.update(dt, {
                camera: sensorView ? sensor : camera, // active camera
            });

            let aabb = gameObject.getComponent(AABB);
            if (aabb) {
                for (let otherObject of grid.possible_aabb_collisions(aabb)) {
                    if (otherObject != gameObject) aabb.collide(otherObject);
                }
                const terrainHeight = heightmap.getHeight(
                    gameObject.position.x,
                    gameObject.position.z
                );
                if (gameObject.position.y < terrainHeight) {
                    const impactPoint = new THREE.Vector3(
                        gameObject.position.x,
                        terrainHeight,
                        gameObject.position.z
                    );
                    explosions.impact(impactPoint);
                    gameObject.publish("collision", {
                        depth: [0, terrainHeight - gameObject.position.y, 0],
                    });
                }
            }

            if (gameObject.lifetime != undefined) {
                gameObject.lifetime -= dt;
                if (gameObject.lifetime <= 0) {
                    if (viewManager.activeGameObject == gameObject.id) {
                        console.log("toggle away")
                        viewManager.toggle();
                    }
                    goa.remove(gameObject);
                    gameObject.destroy();
                }
            }
        });

        explosions.update(dt, sensorView ? sensor : camera);
        terrain.update(dt);
    }

    stats.update();

    if (sensorView) {
        sensorRenderer.render(dt);
    } else {
        cameraRenderer.render(dt);
    }
    requestAnimationFrame(animate);
}
