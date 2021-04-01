import * as THREE from './three/build/three.module.js';
import Stats from './three/examples/jsm/libs/stats.module.js'
import { OrbitControls } from './three/examples/jsm/controls/OrbitControls.js';


import { Factory } from './factory.js';
import { GameObjectArray } from './game-object-array.js';
import { Ground } from './ground.js';
import { GameObject } from './game-object.js';
import { AABB } from './collision.js';
import { HashGrid } from './hashgrid.js';
import { OrbitViewManager } from './orbit-camera.js';

const width  = 640;
const height = 480;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
const canvas = document.querySelector("#canvas");
const renderer = new THREE.WebGLRenderer({canvas: canvas});
renderer.setSize(width, height);
renderer.setClearColor("#87ceeb");
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.BasicShadowMap;
renderer.physicallyCorrectLights = true;

const stats = new Stats();
document.body.appendChild(stats.dom);

const goa = new GameObjectArray()
const grid = new HashGrid(2);
const factory = new Factory(scene, goa, camera, grid);
const viewManager = new OrbitViewManager(goa, camera);

factory.createGround();
let aircraft = factory.createAircraft(new THREE.Vector3(0, 0, 0));
factory.createTestCube(new THREE.Vector3(-20, 20, -20));
factory.createTestCube(new THREE.Vector3(20, 20, 20));
aircraft.position.set(0, 5, 0);

goa._addQueued();
viewManager.setActive(0)

// Create lights
{
    const light = new THREE.DirectionalLight(0x404040, 6);
    light.position.set(1000, 10000, 1000)
    light.castShadow 			=  true; 
    light.shadow.mapSize.width 	=  2048; 
    light.shadow.mapSize.height =  2048; 
    light.shadow.camera.near 	=  0.5; 
    light.shadow.camera.far 	=  20000;
    light.shadow.camera.left 	= -50;
    light.shadow.camera.bottom 	= -50;
    light.shadow.camera.top  	=  50;
    light.shadow.camera.right	=  50;
    scene.add(light)
    //const helper = new THREE.CameraHelper( light.shadow.camera );
    //scene.add( helper );
}
{
    const light = new THREE.AmbientLight(0x404040, 1.0); 
    scene.add(light);
}
{
    const axesHelper = new THREE.AxesHelper( 50 );
    scene.add( axesHelper );
}
{
  const near = 100;
  const far = 200;
  const color = 'lightblue';
  scene.fog = new THREE.Fog(color, near, far);
  scene.background = new THREE.Color(color);
}

let dt = 0, then = 0;
const animate = function (now) {
    requestAnimationFrame(animate);

    now *= 0.001; 
    dt   = now - then;
    then = now;
    if (dt > 0.1 || isNaN(dt)) dt = 0.1;

    //console.log(cube.position)
    
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
                gameObject.publish("destroy", {});
                gameObject.destroy();
            }
        }
    });

	stats.update()	
    renderer.render(scene, camera);
};

animate();
