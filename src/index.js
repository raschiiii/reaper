/**
 * @license
 * Copyright 2021 Jakob Maier
 * REAPER 1.0
 * SPDX-License-Identifier: MIT
 */
import * as THREE from "three";
import Stats from "three/examples/jsm/libs/stats.module.js";

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { FilmPass } from "three/examples/jsm/postprocessing/FilmPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";

import { AABB } from "./collision/collision.js";
import { Factory } from "./factory.js";
import { HashGrid } from "./collision/hashgrid.js";
import { Explosion2, Spark } from "./particles/particles.js";
import { ViewManager } from "./view-manager.js";
import { TerrainManager } from "./terrain/terrain.js";
import { GameObjectArray } from "./engine/game-object-array.js";
import { Terrain } from "./terrain2/lod-terrain.js";

// DOM Elements
const pauseDisplay = document.querySelector("#paused");
const hud = document.querySelector("#sensor");
const canvas = document.querySelector("#canvas");
const info = document.querySelector("#info");
const help = document.querySelector("#help");

const width = window.innerWidth;
const height = window.innerHeight;

const camera = new THREE.PerspectiveCamera(75, width / height, 0.01, 25000);
const sensor = new THREE.PerspectiveCamera(75, width / height, 0.01, 25000);
const listener = new THREE.AudioListener();
camera.add(listener);

camera.setFocalLength(35);

const skyColor = 0x7796c6;
const scene = new THREE.Scene();
scene.background = new THREE.Color(skyColor);
scene.fog = new THREE.Fog(skyColor, 15000, 20000);

// Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    logarithmicDepthBuffer: true,
    antialias: false,
});

renderer.setSize(width, height);
renderer.setClearColor("red");
renderer.physicallyCorrectLights = true;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.BasicShadowMap;
//renderer.setPixelRatio(window.devicePixelRatio / 2); // downsample pixel resolution

window.addEventListener(
    "resize",
    () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        sensor.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        sensor.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    },
    false
);

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
const sun = new THREE.DirectionalLight(0xffffff, 3);
sun.position.set(0, 20, 0);
sun.castShadow = true;
//sun.shadowBias = 0.01;
const map_size = Math.pow(2, 16);
sun.shadow.mapSize.width = map_size;
sun.shadow.mapSize.height = map_size;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 1000;
sun.shadow.camera.left = -50;
sun.shadow.camera.bottom = -50;
sun.shadow.camera.top = 50;
sun.shadow.camera.right = 50;
scene.add(sun);
scene.add(sun.target);

//const helper = new THREE.CameraHelper(sun.shadow.camera);
//scene.add(helper);

const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
scene.add(ambientLight);

let assets = {
    gltf: {
        drone: {
            url: "assets/objects/MQ-9v2.glb",
        },
        hellfire: {
            url: "assets/objects/AGM-114.glb",
        },
        paveway: {
            url: "assets/objects/GBU-12.glb",
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

let paused = false,
    sensorView = false;
let grid, goa, aircraft, terrain, heightmap;
let viewManager, factory, explosions, spark;

async function init() {
    const promises = [];

    const load = function (loader, asset) {
        for (const resource of Object.values(asset)) {
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
    };

    load(new GLTFLoader(), assets.gltf);
    load(new THREE.AudioLoader(), assets.audio);
    load(new THREE.TextureLoader(), assets.textures);
    await Promise.all(promises);

    goa = new GameObjectArray();
    grid = new HashGrid(2);
    factory = new Factory(assets, scene, goa, camera, grid, sensor, listener);
    viewManager = new ViewManager(goa, camera);
    explosions = new Explosion2(scene, "assets/textures/hexagon.png", listener);
    spark = new Spark(scene);

    aircraft = factory.createAircraft(
        new THREE.Vector3(0, 400, 0),
        new THREE.Vector3(10, 0, 0)
    );

    terrain = factory.createTerrain();
    heightmap = terrain.getComponent(Terrain);

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
        (event) => {
            switch (event.code) {
                case "KeyP":
                    paused = !paused;
                    pauseDisplay.style.display = paused ? "block" : "none";
                    aircraft.publish("paused", { paused: paused });
                    break;

                case "Digit1":
                    sensorView = !sensorView;
                    viewManager.setActive(0);
                    hud.style.display = sensorView ? "block" : "none";
                    info.style.display = sensorView ? "none" : "block";
                    aircraft.publish("sensor", { enabled: sensorView });
                    break;

                case "Digit2":
                    if (!sensorView) viewManager.toggle();
                    break;

                case "KeyH":
                    help.style.display = "block";
                    break;
            }
        },
        false
    );

    document.addEventListener("keyup", (event) => {
        switch (event.code) {
            case "KeyH":
                help.style.display = "none";
                break;
        }
    });

    animate();
}

let dt = 0;
let then = 0;
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

            const aabb = gameObject.getComponent(AABB);
            if (aabb) {
                for (let otherObject of grid.possible_aabb_collisions(aabb)) {
                    if (otherObject != gameObject) {
                        console.log(`object collision ${now}`);
                        aabb.collide(otherObject);

                        explosions.impact(otherObject.gameObject.position);
                        //spark.impact(otherObject.position);
                    }
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
                    spark.impact(impactPoint);

                    gameObject.publish("collision", {
                        depth: [0, terrainHeight - gameObject.position.y, 0],
                    });
                }
            }

            if (gameObject.lifetime != undefined) {
                gameObject.lifetime -= dt;
                if (gameObject.lifetime <= 0) {
                    if (viewManager.activeGameObject == gameObject.id) {
                        viewManager.toggle();
                    }
                    goa.remove(gameObject);
                    gameObject.destroy();
                }
            }
        });

        explosions.update(dt, sensorView ? sensor : camera);
        spark.update(dt, sensorView ? sensor : camera);

        terrain.update(dt, {
            camera: sensorView ? sensor : camera,
        });
    }

    stats.update();

    if (sensorView) {
        sensorRenderer.render(dt);
    } else {
        cameraRenderer.render(dt);
    }
    requestAnimationFrame(animate);
}

init();
