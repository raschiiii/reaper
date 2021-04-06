import * as THREE from './three/build/three.module.js';

import { GameObject } from './game-object.js';
import { Box } from './shapes.js';
import { BasicPhysics } from './physics/basic-physics.js';
import { OrbitCamera } from './orbit-camera.js';
import { AABB } from './collision.js';
import { SimpleGLTFModel } from './components.js';
import { Physics } from './physics/physics.js';
import { SpringODE } from './physics/spring-ode.js';
import { GravityODE } from './physics/gravity-ode.js';
import { Cessna } from './physics/cessna-flightmodel.js';
import { TestODE } from './physics/test-ode.js';
import { LocalAxis } from './testing.js';
import { AirplaneModel } from './model.js';
import { TerrainManager } from './terrain/terrain.js';
import { Sensor, Sound } from './aircraft.js';

export class Factory {
    constructor(scene, goa, camera, grid, sensor, listener){
        this.scene = scene;
        this.goa = goa;
        this.camera = camera;
        this.sensor = sensor;
        this.grid = grid;
        this.listener = listener;
    }

    createAircraft(pos,vel){
        const obj = new GameObject(this.scene);
        obj.position.copy(pos);
        obj.velocity.copy(vel);
        
        obj.addComponent(new AirplaneModel(obj, '../assets/objects/MQ-9.glb', {
            rotation: new THREE.Vector3(0, Math.PI / 2, 0),
            scale: new THREE.Vector3(0.1,0.1,0.1)
        }));

        obj.addComponent(new Sound(obj, this.listener, '../assets/audio/engine2.mp3'))

        //obj.addComponent(new BasicPhysics(obj, {}));
        //obj.addComponent(new Physics(obj, new SpringODE(obj, 1.0, 1.5, 20, -2.7)));
        
        obj.addComponent(new Physics(obj, new Cessna(obj, pos, vel)));
        obj.addComponent(new Sensor(obj, this.sensor))
        
        //obj.addComponent(new LocalAxis(obj)); 

        obj.addComponent(new AABB(obj));
        
        this.goa.add(obj);
        return obj;
    }

    createTestCube(pos){
        let obj = new GameObject(this.scene);
        obj.position.copy(pos);

        obj.addComponent(new Box(obj, { castShadow: true }));
        obj.addComponent(new AABB(obj));
        //obj.addComponent(new BasicPhysics(obj, {}));

        this.goa.add(obj);
        return obj;
    }

    createTerrain(){
        const obj = new GameObject(this.scene);
        obj.addComponent(new TerrainManager(obj, { camera: this.camera }));
        return obj;
    }
}