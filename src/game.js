import * as THREE from './three/build/three.module.js';
import Stats from './three/examples/jsm/libs/stats.module.js'
import { GLTFLoader } from './three/examples/jsm/loaders/GLTFLoader.js';

import { Factory } from './factory.js';
import { GameObjectArray } from './game-object-array.js';
import { HashGrid } from './hashgrid.js';
import { OrbitViewManager } from './orbit-camera.js';



export class Game {
    constructor(){
        this.assets = {
            gltf: {
                drone: {
                    url: '../assets/objects/MQ-9.glb'
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
        }
        this.then = null;
        this.paused = false;
        this.sensorView = false;



        this.load();
    }

    async load(){

        const promises = [];
        
        let loader = new THREE.AudioLoader();
        for (const resource of Object.values(this.assets.audio)){
            const p = new Promise((resolve, reject) => {
                loader.load(resource.url, data => {
                    resource.asset = data
                    resolve(resource)
                }, null, reject);
            });
            promises.push(p);
        }
       
        loader = new THREE.TextureLoader();
        for (const resource of Object.values(this.assets.textures)){
            const p = new Promise((resolve, reject) => {
                loader.load(resource.url, data => {
                    resource.asset = data
                    resolve(resource)
                }, null, reject);
            });
            promises.push(p);
        }
        
        loader = new GLTFLoader();
        for (const resource of Object.values(this.assets.gltf)){
            const p = new Promise((resolve, reject) => {
                loader.load(resource.url, data => {
                    resource.asset = data
                    resolve(resource)
                }, null, reject);
            });
            promises.push(p);
        }

        await Promise.all(promises);
        console.log(this.assets)
        this.initGraphics();
        this.initLights();
        this.initGame();
        this.raf();
    }

    initLights(){
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
        this.scene.add(sun);
        this.scene.add(sun.target)
        //const helper = new THREE.CameraHelper(sun.shadow.camera);
        //scene.add( helper );

        const light = new THREE.AmbientLight(0x404040, 1.0); 
        this.scene.add(light);
    }

    initGraphics(){
        const pauseDisplay  = document.querySelector('#paused');

        const width  = 640;
        const height = 480;

        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 10000);
        this.sensor = new THREE.PerspectiveCamera(75, width / height, 0.1, 10000);

        this.listener = new THREE.AudioListener();
        this.camera.add(this.listener);

        const canvas = document.querySelector("#canvas");

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color( 0xcce0ff );
        this.scene.fog = new THREE.Fog( 0xcce0ff, 1000, 10000 );

        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            logarithmicDepthBuffer: true
        });

        this.renderer.setSize(width, height);
        this.renderer.setClearColor("red");
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.BasicShadowMap;
        this.renderer.physicallyCorrectLights = true;

        this.stats = new Stats();
        document.body.appendChild(this.stats.dom);
    }

    initControls(){
        document.addEventListener('keydown', (e) => {
            switch(e.keyCode){
                case 80: // p
                    this.paused = !this.paused;
                    pauseDisplay.style.display = this.paused ? "block" : "none";
                    this.aircraft.publish("paused", { paused: this.paused });
                    break;

                case 49: // 1
                    this.sensorView = !this.sensorView;
                    this.aircraft.publish("sensor", { enabled: this.sensorView })
                    break;

                case 50: // 2
                    this.viewManager.toggle();
                    break;            
            }
        }, false);

    }

    initGame(){
        this.goa           = new GameObjectArray()
        this.grid          = new HashGrid(2);
        this.factory       = new Factory(
                                this.assets, 
                                this.scene, 
                                this.goa, 
                                this.camera, 
                                this.grid, 
                                this.sensor, 
                                this.listener
                            );

        this.viewManager   = new OrbitViewManager(this.goa, this.camera);

        this.aircraft = this.factory.createAircraft(
            new THREE.Vector3(0, 10, 0), 
            new THREE.Vector3(8, 0, 0)
        );
        
        this.terrain = this.factory.createTerrain();
        this.factory.createTestCube(new THREE.Vector3(-20, 20, -20));
        this.factory.createTestCube(new THREE.Vector3(20, 20, 20));

        this.goa._addQueued();
        this.viewManager.setActive(0);
    }

    raf(){
        requestAnimationFrame((now) => {
            if (this.then === null) {
                this.then = now;
            }
            this.render(now - this.then);
            this.then = now;
        });
    }

    render(t){
        const dt = Math.min(t * 0.001, 0.1);

        //if (!this.paused){
//
        //}
        this.goa.forEach(gameObject => {
            gameObject.update(dt);

            let aabb = gameObject.getComponent("AABB");
            if (aabb){
                for (let otherObject of this.grid.possible_aabb_collisions(aabb)){
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

        this.terrain.update(dt);

        this.stats.update();

        //renderer.render(scene, sensorView ? sensor : camera);
        this.renderer.render(this.scene, this.camera);
        this.raf();
    }
}
