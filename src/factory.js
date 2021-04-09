import * as THREE from './three/build/three.module.js';

import { GameObject } from './game-object.js';
import { Box } from './shapes.js';
import { BasicPhysics } from './physics/basic-physics.js';
import { OrbitCamera } from './orbit-camera.js';
import { AABB } from './collision.js';
import { EventRelay, Explosive, Sound } from './components.js';
import { Physics } from './physics/physics.js';
import { SpringODE } from './physics/spring-ode.js';
import { GravityODE } from './physics/gravity-ode.js';
import { PropPlane } from './physics/plane-flightmodel.js';
import { TestODE } from './physics/test-ode.js';
import { LocalAxis } from './testing.js';
import { AirplaneModel, SimpleModel } from './model.js';
import { TerrainManager } from './terrain/terrain.js';
import { Hardpoints, Sensor } from './aircraft-systems.js';
import { PilotInput } from './input.js';
import { MissileFireControl } from './weapon-systems.js';
import { Hellfire } from './physics/hellfire.js';
import { SmokeEmitter } from './particles.js';

export class Factory {
    constructor(assets, scene, goa, camera, grid, sensor, listener){
        this.assets = assets;
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
        this.goa.add(obj);
        
        obj.addComponent(new AirplaneModel(obj, this.assets.gltf.drone.asset, {
            rotation: new THREE.Vector3(0, Math.PI / 2, 0),
            scale: new THREE.Vector3(0.1,0.1,0.1)
        }));

        obj.addComponent(new Sound(obj, this.listener, this.assets.audio.engine.asset,{
            loop: true, 
            volume: 0.5, 
            autoplay: false
        }))

        //obj.addComponent(new Physics(obj, new SpringODE(obj, 1.0, 1.5, 20, -2.7)));
        obj.addComponent(new Physics(obj, new PropPlane(obj)));

        obj.addComponent(new Sensor(obj, this.sensor));
        obj.addComponent(new PilotInput(obj));
        obj.addComponent(new AABB(obj));
        obj.addComponent(new Explosive(obj));
        
        //obj.addComponent(new SmokeEmitter(obj));
        //obj.addComponent(new LocalAxis(obj));

        const hardpoints = obj.addComponent(new Hardpoints(obj))
        this.createHellfire(obj, hardpoints.h1, 1);
        this.createHellfire(obj, hardpoints.h2, 2);
        this.createHellfire(obj, hardpoints.h3, 3);
        this.createHellfire(obj, hardpoints.h4, 4);
        this.createHellfire(obj, hardpoints.h5, 5);
        this.createHellfire(obj, hardpoints.h6, 6);
        
        return obj;
    }

    createHellfire(parent, transform, hardpointId){
        let obj = new GameObject(transform);

        obj.addComponent(new SimpleModel(obj, this.assets.gltf.hellfire.asset, {
            rotation: new THREE.Vector3(0, Math.PI / 2, 0),
            scale: new THREE.Vector3(0.1,0.1,0.1)
        }));

        obj.addComponent(new EventRelay(obj, parent, ["fire"]));
        obj.addComponent(new Explosive(obj));
        obj.addComponent(new MissileFireControl(obj, hardpointId, this.goa));


        //this.goa.add(obj);
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
        obj.addComponent(new TerrainManager(obj, { 
            camera: this.camera,
            heightmap: this.assets.textures.heightmap.asset.image 
        }));
        return obj;
    }
}