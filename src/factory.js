import * as THREE from './three/build/three.module.js';

import { GameObject } from './game-object.js';
import { Box } from './shapes.js';
import { BasicPhysics } from './physics/basic-physics.js';
import { OrbitCamera } from './orbit-camera.js';
import { Ground } from './ground.js';
import { AABB } from './collision.js';
import { SimpleGLTFModel } from './components.js';
import { Physics } from './physics/physics.js';
import { SpringODE } from './physics/spring-ode.js';
import { GravityODE } from './physics/gravity-ode.js';

export class Factory {
    constructor(scene, goa, camera, grid){
        this.scene = scene;
        this.goa = goa;
        this.camera = camera;
        this.grid = grid;
    }

    createAircraft(pos,vel){
        const obj = new GameObject(this.scene);
        obj.position.copy(pos);
        obj.velocity.copy(vel);

        obj.addComponent(new SimpleGLTFModel(obj, '../assets/objects/F-16.glb', {
            scale: new THREE.Vector3(0.5, 0.5, 0.5)
        }));

        //obj.addComponent(new BasicPhysics(obj, {}));
        //obj.addComponent(new Physics(obj, new SpringODE(obj, 1.0, 1.5, 20, -2.7)));
        obj.addComponent(new Physics(obj, new GravityODE(
            obj,
            pos.x, pos.z, pos.y,
            vel.x, vel.z, vel.y
        )));
        
        obj.addComponent(new AABB(obj));
        
        this.goa.add(obj);
        return obj;
    }

    createTestCube(pos){
        let obj = new GameObject(this.scene);
        obj.position.copy(pos);

        obj.addComponent(new Box(obj, {
            castShadow: true
        }));

        obj.addComponent(new AABB(obj));
        obj.addComponent(new BasicPhysics(obj, {}));

        this.goa.add(obj);
        return obj;
    }

    createGround(){
        let size = 500;
        const obj = new GameObject(this.scene);
        obj.position.set(0,-5, 0);
        obj.addComponent(new Ground(obj, size));
        obj.addComponent(new AABB(obj, new THREE.Vector3(size, 5, size)));
        let aabb = obj.addComponent(new AABB(obj, new THREE.Vector3(size, 5, size)))
        this.grid.insert(aabb)
        return obj;
    }
}