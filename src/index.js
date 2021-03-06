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
import { SpatialHashGrid } from "./collision/hashgrid.js";
import { Explosion2, Spark } from "./particles/particles.js";
import { ViewManager } from "./view-manager.js";
import { Terrain } from "./terrain/terrain.js";
import { SmokeEmitter } from "./particles/particle-emitter.js";
import { SensorCamera } from "./components/aircraft.js";
import { Game } from "./engine/game.js";

// DOM Elements
const pauseDisplay = document.querySelector("#paused");
const hud = document.querySelector("#sensor");
const canvas = document.querySelector("#canvas");
const info = document.querySelector("#info");
const help = document.querySelector("#help");

const width = window.innerWidth;
const height = window.innerHeight;

const listener = new THREE.AudioListener();
const sensor = new SensorCamera(75, width / height, 0.01, 25000);
const camera = new THREE.PerspectiveCamera(75, width / height, 0.01, 25000);
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
//sensorRenderer.addPass(new FilmPass(0.35, 0.5, 2048, false));

// Stats
const stats = new Stats();
//document.body.appendChild(stats.dom);

// Lights
const sun = new THREE.DirectionalLight(0xffffff, 3);
sun.castShadow = true;
const map_size = Math.pow(2, 16);
sun.shadow.mapSize.width = map_size;
sun.shadow.mapSize.height = map_size;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 5000;
const val = 100;
sun.shadow.camera.left = -val;
sun.shadow.camera.bottom = -val;
sun.shadow.camera.top = val;
sun.shadow.camera.right = val;
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
        pickup: {
            url: "assets/objects/Pickup.glb",
        },
        house_1: {
            url: "assets/objects/House_1.glb",
        },
        pickup_wreck: {
            url: "assets/objects/Pickup_wreck.glb",
        },
    },
    textures: {
        heightmap: {
            url: "assets/textures/heightmap.png",
        },
        hexagon: {
            url: "assets/textures/hexagon.png",
        },
        rectangle: {
            url: "assets/textures/rectangle.png",
        },
        red: {
            url: "assets/textures/red.png",
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
let aircraft, terrain, heightmap;
let viewManager, factory, explosions, spark, focusCenter;

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

    window.game = new Game();
    factory = new Factory(assets, scene, camera, sensor, listener);
    viewManager = new ViewManager(camera);
    explosions = new Explosion2(scene, listener);
    spark = new Spark(scene);

    aircraft = factory.createAircraft(new THREE.Vector3(-400, 200, 0), new THREE.Vector3(10, 0, 0));

    terrain = factory.createTerrain();
    heightmap = terrain.getComponent(Terrain);

    // create enemies
    factory.createPickup(heightmap.placeAt(12, -30));
    factory.createPickup(heightmap.placeAt(-10, 5));
    factory.createPickup(heightmap.placeAt(2, 1));
    factory.createPickup(heightmap.placeAt(19, 5));
    factory.createPickup(heightmap.placeAt(-23, -20));
    factory.createPickup(heightmap.placeAt(12, -4));
    factory.createPickup(heightmap.placeAt(-29, 31));

    window.game.objects._addQueued();
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

                case "KeyC":
                    let labels = document.getElementsByClassName("label");
                    for (let label of labels) {
                        label.style.display = "block";
                    }
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

            case "KeyC":
                let labels = document.getElementsByClassName("label");
                for (let label of labels) {
                    label.style.display = "none";
                }
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

    const activeCamera = sensorView ? sensor : camera;

    // update sun position
    sun.position.copy(activeCamera.focusPoint || activeCamera.position);
    sun.position.add(new THREE.Vector3(50, 100, 50));
    sun.target.position.copy(activeCamera.focusPoint || activeCamera.position);

    if (!paused) {
        window.game.objects.forEach((gameObject) => {
            gameObject.update(dt, {
                camera: activeCamera, // active camera
            });

            const aabb = gameObject.getComponent(AABB);
            if (aabb) {
                let impactPoint = null;

                for (let oAabb of window.game.colliders.possible_aabb_collisions(aabb)) {
                    if (oAabb != gameObject) {
                        let depth = aabb.collide2(oAabb);
                        if (depth != null) {
                            if (!oAabb.gameObject.getComponent(SmokeEmitter)) {
                                oAabb.gameObject.addComponent(new SmokeEmitter(oAabb.gameObject));
                                impactPoint = oAabb.gameObject.position.clone();
                                gameObject.publish("collision", {
                                    depth: depth,
                                });
                                oAabb.gameObject.publish("collision", {
                                    depth: depth,
                                });
                            }
                        }
                    }
                }

                const terrainHeight = heightmap.getHeight(gameObject.position.x, gameObject.position.z);

                if (gameObject.position.y < terrainHeight) {
                    impactPoint = new THREE.Vector3(gameObject.position.x, terrainHeight, gameObject.position.z);

                    gameObject.publish("collision", {}); // TODO calculate depth

                    if (!gameObject.getComponent(SmokeEmitter)) {
                        gameObject.addComponent(new SmokeEmitter(gameObject));
                    }
                }

                if (impactPoint) {
                    spark.impact(impactPoint);
                    explosions.impact(impactPoint);
                }
            }

            if (gameObject.lifetime != undefined) {
                gameObject.lifetime -= dt;
                if (gameObject.lifetime <= 0) {
                    if (viewManager.activeGameObject == gameObject.id) {
                        viewManager.toggle();
                    }
                    window.game.objects.remove(gameObject);
                    gameObject.destroy();
                }
            }
        });

        explosions.update(dt, activeCamera);
        spark.update(dt, activeCamera);

        terrain.update(dt, {
            camera: activeCamera,
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
