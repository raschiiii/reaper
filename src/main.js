import * as THREE from './three/build/three.module.js';

import { Factory } from './factory.js';
import { GameObjectArray } from './game-object-array.js';
import { Ground } from './ground.js';

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


//const controls = new OrbitControls(camera, canvas);
const goa = new GameObjectArray()
const factory = new Factory(scene, goa, camera);
const ground = new Ground(scene);

let cube = factory.createTestCube(new THREE.Vector3(0, 20, 0));

// Create lights
{
    const light = new THREE.DirectionalLight(0x404040, 3);
    light.position.set(1000, 10000, 1000)
    light.castShadow 			=  true; 
    light.shadow.mapSize.width 	=  1024; 
    light.shadow.mapSize.height =  1024; 
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

camera.position.z = 5;

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
    });

    renderer.render(scene, camera);
};

animate();
