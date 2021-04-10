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
import { Explosion } from './particles.js';
import { TerrainManager } from './terrain/terrain.js';
import { AABB } from './collision.js';

// Debug
const debug         = document.querySelector('#display1');
const pauseDisplay  = document.querySelector('#paused');
const hud           = document.querySelector('#hud-img');

const width  = 640;
const height = 480;

const camera = new THREE.PerspectiveCamera(75, width / height, 0.01, 10000);
const sensor = new THREE.PerspectiveCamera(75, width / height, 0.01, 10000);

const listener = new THREE.AudioListener();
camera.add(listener);

const canvas = document.querySelector("#canvas");

const scene = new THREE.Scene();
scene.background = new THREE.Color( 0xcce0ff );
scene.fog = new THREE.Fog( 0xcce0ff, 500, 10000 );

const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    logarithmicDepthBuffer: false
});

renderer.setSize(width, height);
renderer.setClearColor("red");
renderer.shadowMap.enabled          = true;
renderer.physicallyCorrectLights    = true;
renderer.logarithmicDepthBuffer     = true;
renderer.shadowMap.type             = THREE.BasicShadowMap;

const cameraRenderer = new EffectComposer(renderer);
cameraRenderer.addPass(new RenderPass(scene, camera));

const sensorRenderer = new EffectComposer(renderer);
sensorRenderer.addPass(new RenderPass(scene, sensor));
sensorRenderer.addPass(new FilmPass(0.35, 0.5, 2048, false));

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
            url: '../assets/objects/MQ-9v3.glb'
        },
        hellfire: {
            url: '../assets/objects/AGM-114.glb'
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
    const explosions    = new Explosion(scene, '../assets/textures/explosion2.png', listener)

    const aircraft      = factory.createAircraft(new THREE.Vector3(0, 300, 0), new THREE.Vector3(10, 0, 0));
    const terrain       = factory.createTerrain();
    const heightmap     = terrain.getComponent(TerrainManager);

    factory.createTestCube(new THREE.Vector3( 0, heightmap.getHeight(0,0),    0));
    factory.createTestCube(new THREE.Vector3(20, heightmap.getHeight(20,20), 20));

    goa._addQueued();
    viewManager.setActive(0);

    document.addEventListener('keydown', (e) => {
        switch(e.code){
            case "KeyP": 
                paused = !paused;
                pauseDisplay.style.display = paused ? "block" : "none";
                aircraft.publish("paused", { paused: paused });
                break;

            case "Digit1": 
                sensorView = !sensorView;
                viewManager.setActive(0);
                hud.style.display = sensorView ? "block" : "none";
                aircraft.publish("sensor", { enabled: sensorView })
                break;

            case "Digit2": 
                if (!sensorView) viewManager.toggle();
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

                let aabb = gameObject.getComponent(AABB);
                if (aabb){
                    for (let otherObject of grid.possible_aabb_collisions(aabb)){
                        if (otherObject != gameObject) aabb.collide(otherObject); 
                    }
                }

                const terrainHeight = heightmap.getHeight(gameObject.position.x, gameObject.position.z);
                if (gameObject.position.y < terrainHeight){
                    
                    const impactPoint = new THREE.Vector3( 
                        gameObject.position.x, terrainHeight, gameObject.position.z
                    );
                    
                    explosions.impact(impactPoint);

                    gameObject.publish("collision", { 
                        depth: [ 0, terrainHeight - gameObject.position.y, 0 ]
                    });
                }

                if (gameObject.lifetime != undefined){
                    gameObject.lifetime -= dt;
                    if (gameObject.lifetime <= 0){
                        if (viewManager.activeGameObject == gameObject.id){
                            viewManager.toggle();
                        }
                        goa.remove(gameObject);
                        gameObject.destroy();
                    }
                }
            });
            
            explosions.update(dt);
            terrain.update(dt);
        }

        stats.update()	

        if (sensorView){
            sensorRenderer.render(dt);
        } else {
            cameraRenderer.render(dt);
        }
        requestAnimationFrame(animate);
    };

    animate();
})();

