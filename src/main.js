import * as THREE from './three/build/three.module.js';
import Stats from './three/examples/jsm/libs/stats.module.js'
import { GLTFLoader } from './three/examples/jsm/loaders/GLTFLoader.js';
import {EffectComposer} from './three/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass}     from './three/examples/jsm/postprocessing/RenderPass.js';
import {FilmPass}       from './three/examples/jsm/postprocessing/FilmPass.js';
import { UnrealBloomPass } from './three/examples/jsm/postprocessing/UnrealBloomPass.js';


import { Factory } from './factory.js';
import { GameObjectArray } from './game-object-array.js';
import { HashGrid } from './hashgrid.js';
import { OrbitViewManager } from './orbit-camera.js';

// Debug
const debug         = document.querySelector('#display1');
const pauseDisplay  = document.querySelector('#paused');
const hud           = document.querySelector('#hud-img');

const width  = 640;
const height = 480;

const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 10000);
const sensor = new THREE.PerspectiveCamera(75, width / height, 0.1, 10000);

const listener = new THREE.AudioListener();
camera.add(listener);

const canvas = document.querySelector("#canvas");

const scene = new THREE.Scene();
scene.background = new THREE.Color( 0xcce0ff );
scene.fog = new THREE.Fog( 0xcce0ff, 200, 10000 );

const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    logarithmicDepthBuffer: true
});

renderer.setSize(width, height);
renderer.setClearColor("red");
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.BasicShadowMap;
renderer.physicallyCorrectLights = true;

const cameraRender = new EffectComposer(renderer);
cameraRender.addPass(new RenderPass(scene, camera));

const sensorRender = new EffectComposer(renderer);
sensorRender.addPass(new RenderPass(scene, sensor));
//sensorRender.addPass(new FilmPass(0.35, 0.5, 2048, true)) // bw
sensorRender.addPass(new FilmPass(0.35, 0.0125, 1024, true))
//sensorRender.addPass(new FilmPass(0.35, 0.025, 648, false)) // color



const stats = new Stats();
document.body.appendChild(stats.dom);

// Create lights
const sun = new THREE.DirectionalLight(0x404040, 6);
sun.position.set(1000, 5000, 1000)
sun.castShadow 			=  true; 
sun.shadow.mapSize.width 	=  2048; 
sun.shadow.mapSize.height =  2048; 
sun.shadow.camera.near 	 =  1000; 
sun.shadow.camera.far 	 =  20000;
sun.shadow.camera.left 	 = -50;
sun.shadow.camera.bottom = -50;
sun.shadow.camera.top  	 =  50;
sun.shadow.camera.right	 =  50;
scene.add(sun);
scene.add(sun.target)
//const helper = new THREE.CameraHelper(sun.shadow.camera);
//scene.add( helper );
const light = new THREE.AmbientLight(0x404040, 1.0); 
scene.add(light);
//const axesHelper = new THREE.AxesHelper( 50 );
//scene.add( axesHelper );

let paused = false;
let sensorView = false;

let assets = {
    gltf: {
        drone: {
            url: '../assets/objects/MQ-9v2.glb'
        }
    },
    textures: {
        heightmap: {
            url: '../assets/textures/heightmap.png'
        }
    },
    audio: {
        engine: {
            url: '../assets/audio/engine2.mp3'
        }
    }
};

(async () => {
    const promises = [];
    
    let loader = null;
    loader = new THREE.AudioLoader();
    for (const resource of Object.values(assets.audio)){
        const p = new Promise((resolve, reject) => {
            loader.load(resource.url, data => {
                resource.asset = data
                resolve(resource)
            }, null, reject);
        });
        promises.push(p);
    }

    loader = new THREE.TextureLoader();
    for (const resource of Object.values(assets.textures)){
        const p = new Promise((resolve, reject) => {
            loader.load(resource.url, data => {
                resource.asset = data
                resolve(resource)
            }, null, reject);
        });
        promises.push(p);
    }

    loader = new GLTFLoader();
    for (const resource of Object.values(assets.gltf)){
        const p = new Promise((resolve, reject) => {
            loader.load(resource.url, data => {
                resource.asset = data
                resolve(resource)
            }, null, reject);
        });
        promises.push(p);
    }

    await Promise.all(promises);

    const goa           = new GameObjectArray()
    const grid          = new HashGrid(2);
    const factory       = new Factory(assets, scene, goa, camera, grid, sensor, listener);
    const viewManager   = new OrbitViewManager(goa, camera);

    const aircraft = factory.createAircraft(new THREE.Vector3(0, 200, 0), new THREE.Vector3(8, 0, 0));
    const terrain = factory.createTerrain();
    factory.createTestCube(new THREE.Vector3(0, 60, 0));
    factory.createTestCube(new THREE.Vector3(20, 20, 20));

    goa._addQueued();
    viewManager.setActive(0);

    document.addEventListener('keydown', (e) => {
        switch(e.keyCode){
            case 80: // p
                paused = !paused;
                pauseDisplay.style.display = paused ? "block" : "none";
                aircraft.publish("paused", { paused: paused });
                break;
            case 49: // 1
                sensorView = !sensorView;
                hud.style.display = sensorView ? "block" : "none";
                aircraft.publish("sensor", { enabled: sensorView })
                break;
            case 50: // 2
                viewManager.toggle();
                break;            
        }
    }, false);

    let dt = 0, then = 0;
    const animate = function (now) {

        now *= 0.001; 
        dt   = now - then;
        then = now;
        if (dt > 0.1 || isNaN(dt)) dt = 0.1;

        debug.innerText = `pos: ${aircraft.position.x.toFixed(2)}, ${aircraft.position.y.toFixed(2)}, ${aircraft.position.z.toFixed(2)}\nvel: ${aircraft.velocity.x.toFixed(2)}, ${aircraft.velocity.y.toFixed(2)}, ${aircraft.velocity.z.toFixed(2)}`;

        if (!paused){
            goa.forEach(gameObject => {
                gameObject.update(dt);

                let aabb = gameObject.getComponent("AABB");
                if (aabb){
                    for (let otherObject of grid.possible_aabb_collisions(aabb)){
                        if (otherObject != gameObject) aabb.collide(otherObject); 
                    }
                }

                if (gameObject.lifetime != undefined){
                    gameObject.lifetime -= dt;
                    if (gameObject.lifetime <= 0){
                        gameObjectArray.remove(gameObject);
                        gameObject.destroy();
                    }
                }
            });
            terrain.update(dt);
        }

        stats.update()	

        if (sensorView){
            sensorRender.render(dt);
        } else {
            cameraRender.render(dt);
        }
        requestAnimationFrame(animate);
    };

    animate();
})();

