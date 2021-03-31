import * as THREE from './three/build/three.module.js';

import { GameObject } from './game-object.js';
import { Box } from './shapes.js';
import { Physics } from './physics.js';
import { OrbitCamera } from './input.js';

export class Factory {
    constructor(scene, goa, camera){
        this.scene = scene;
        this.goa = goa;
        this.camera = camera;
    }

    createAircraft(pos){

    }

    createTestCube(pos){
        let obj = new GameObject(this.scene);
        obj.position.copy(pos);
        obj.addComponent(new Box(obj, {
            castShadow: true
        }));

        obj.addComponent(new Physics(obj));
        obj.addComponent(new OrbitCamera(obj, this.camera))

        this.goa.add(obj);
        return obj;
    }
    
}