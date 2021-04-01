import * as THREE from './three/build/three.module.js';

import { GameObject } from './game-object.js';
import { Box } from './shapes.js';
import { Physics } from './physics.js';
import { OrbitCamera } from './orbit-camera.js';
import { Ground } from './ground.js';
import { AABB } from './collision.js';

export class Factory {
    constructor(scene, goa, camera, grid){
        this.scene = scene;
        this.goa = goa;
        this.camera = camera;
        this.grid = grid;
    }

    createAircraft(pos){

    }

    createGround(){
        const obj = new GameObject(this.scene);
        obj.position.set(0,-2.5, 0);
        obj.addComponent(new Ground(obj));
        obj.addComponent(new AABB(obj, new THREE.Vector3(50, 5, 50)));
        let aabb = obj.addComponent(new AABB(obj, new THREE.Vector3(50, 5, 50)))
        this.grid.insert(aabb)

        return obj;
    }

    createTestCube(pos){
        let obj = new GameObject(this.scene);
        obj.position.copy(pos);
        obj.addComponent(new Box(obj, {
            castShadow: true
        }));

        obj.addComponent(new AABB(obj));
        obj.addComponent(new Physics(obj));

        this.goa.add(obj);
        return obj;
    }
    
}