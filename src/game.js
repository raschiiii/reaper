import * as THREE from './three/build/three.module.js';
import Stats from './three/examples/jsm/libs/stats.module.js'
import { GLTFLoader } from './three/examples/jsm/loaders/GLTFLoader.js';

import { Factory } from './factory.js';
import { GameObjectArray } from './game-object-array.js';
import { HashGrid } from './hashgrid.js';
import { OrbitViewManager } from './orbit-camera.js';



export class Game {
    constructor(){
        this.then = null;

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

        //this.resouces = {};

        const manager = new THREE.LoadingManager();
        manager.onProgress = function ( url, itemsLoaded, itemsTotal ) {
            console.log( 'Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
        };

        const gltfLoader = new GLTFLoader(manager);
        for (const resource of Object.values(this.assets.gltf)) {  
            gltfLoader.load(resource.url, (result) => {
                resource.asset = result;
            });
        }

        const textureLoader = new THREE.TextureLoader(manager);
        for (const resource of Object.values(this.assets.textures)){
            textureLoader.load(resource.url, (result) => {
                resource.asset = result;
            })
        }

        const audioLoader = new THREE.AudioLoader(manager);
        for (const resource of Object.values(this.assets.audio)){

            //resource.asset = await new Promise((resolve, reject) => {
            //    audioLoader.load(resource.url, data => resolve(data), null, reject);
            //});

            

            audioLoader.load(resource.url, (result) => {
                resource.asset = result;
                console.log(resource.url)
                console.log(resource.asset)
            });
            

        }

        let that = this;
        manager.onLoad = function () {
            console.log( "Loading complete!")
            console.log(that.assets)
            console.log(that.assets.gltf.drone)
            console.log(that.assets.audio.engine)

            //console.log(that.assets.audio.engine.asset);
            
            that.init();
        }

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

    initGame(){
        this.goa           = new GameObjectArray()
        this.grid          = new HashGrid(2);
        this.factory       = new Factory(this.assets, this.scene, this.goa, this.camera, this.grid, this.sensor, this.listener);
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

    init(){
        this.initGraphics();
        this.initLights();
        this.initGame();
        this.raf()
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

        this.stats.update()	
        //renderer.render(scene, sensorView ? sensor : camera);
        this.renderer.render(this.scene, this.camera);
        this.raf();
    }
}
