import * as THREE from "three";

import { GameObject } from "./engine/game-object.js";
import { AABB } from "./collision/collision.js";
import { EventRelay, Explosive, Sound } from "./components/components.js";
import { Physics } from "./physics/physics.js";
import { Reaper } from "./physics/reaper.js";
import {
    AirplaneModel,
    SimpleModel,
    PavewayModel,
} from "./components/model.js";
import {
    FireControlSystem,
    Hardpoints,
    Sensor,
} from "./components/aircraft.js";
import { Label, MissileControl } from "./components/weapon.js";
import { Terrain } from "./terrain/terrain.js";

export class Factory {
    constructor(assets, scene, camera, grid, sensor, listener) {
        this.assets = assets;
        this.scene = scene;
        this.camera = camera;
        this.sensor = sensor;
        this.grid = grid;
        this.listener = listener;
    }

    createAircraft(pos, vel) {
        const obj = new GameObject(this.scene);
        obj.position.copy(pos);
        obj.velocity.copy(vel);

        window.game.array.add(obj);

        obj.addComponent(
            new AirplaneModel(obj, this.assets.gltf.drone.asset, {
                rotation: new THREE.Vector3(0, Math.PI / 2, 0),
                scale: new THREE.Vector3(0.1, 0.1, 0.1),
                sensor: this.sensor,
            })
        );
        obj.addComponent(
            new Sound(obj, this.listener, this.assets.audio.engine.asset, {
                loop: true,
                volume: 0.5,
                autoplay: true,
            })
        );
        //obj.addComponent(new Physics(obj, new SpringODE(obj, 1.0, 1.5, 20, -2.7)));
        obj.addComponent(new Physics(obj, new Reaper(obj)));
        obj.addComponent(new Sensor(obj, this.sensor));
        obj.addComponent(new FireControlSystem(obj));
        obj.addComponent(new AABB(obj));
        obj.addComponent(new Explosive(obj));
        //obj.addComponent(new SmokeTrailEmitter(obj));
        //obj.addComponent(new LocalAxis(obj));
        const hardpoints = obj.addComponent(new Hardpoints(obj));
        this.createHellfire(obj, hardpoints.h1, 1);
        this.createHellfire(obj, hardpoints.h2, 2);
        this.createHellfire(obj, hardpoints.h3, 3);
        this.createHellfire(obj, hardpoints.h4, 4);
        this.createPaveway(obj, hardpoints.h5, 5);
        this.createPaveway(obj, hardpoints.h6, 6);
        return obj;
    }

    createHellfire(parent, transform, hardpointId) {
        let obj = new GameObject(transform);

        obj.addComponent(
            new SimpleModel(obj, this.assets.gltf.hellfire.asset, {
                rotation: new THREE.Vector3(0, Math.PI / 2, 0),
                scale: new THREE.Vector3(0.1, 0.1, 0.1),
            })
        );
        obj.addComponent(new EventRelay(obj, parent, ["fire"]));
        obj.addComponent(new Explosive(obj));
        obj.addComponent(new MissileControl(obj, hardpointId, "AGM-114"));
        obj.addComponent(new AABB(obj));
        return obj;
    }

    createPaveway(parent, transform, hardpointId) {
        let obj = new GameObject(transform);

        obj.addComponent(
            new PavewayModel(obj, this.assets.gltf.paveway.asset, {
                rotation: new THREE.Vector3(0, Math.PI / 2, 0),
                scale: new THREE.Vector3(0.1, 0.1, 0.1),
            })
        );
        obj.addComponent(new EventRelay(obj, parent, ["fire"]));
        obj.addComponent(new Explosive(obj));
        obj.addComponent(new MissileControl(obj, hardpointId, "GBU-12"));
        obj.addComponent(new AABB(obj));
        return obj;
    }

    createPickup(pos) {
        let obj = new GameObject(this.scene);
        obj.position.copy(pos);

        obj.addComponent(
            new SimpleModel(obj, this.assets.gltf.pickup.asset, {
                rotation: new THREE.Vector3(0, Math.PI / 2, 0),
                scale: new THREE.Vector3(0.1, 0.1, 0.1),
            })
        );

        obj.addComponent(new Label(obj));
        obj.addComponent(new Explosive(obj));

        //obj.addComponent(new Box(obj, { castShadow: true }));
        //obj.addComponent(new SmokeEmitter(obj));

        const aabb = obj.addComponent(
            new AABB(obj, new THREE.Vector3(2, 2, 2))
        );

        this.grid.insert(aabb);
        window.game.array.add(obj);
        return obj;
    }

    createHouse(pos) {
        let obj = new GameObject(this.scene);
        obj.position.copy(pos);
        obj.transform.rotateY(Math.random());

        obj.addComponent(
            new SimpleModel(obj, this.assets.gltf.house_1.asset, {
                rotation: new THREE.Vector3(0, Math.PI / 2, 0),
                scale: new THREE.Vector3(0.1, 0.1, 0.1),
            })
        );
    }

    createTerrain() {
        const obj = new GameObject(this.scene);
        obj.addComponent(
            new Terrain(obj, {
                heightmap: this.assets.textures.heightmap.asset.image,
            })
        );
        return obj;
    }
}
