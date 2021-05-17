import * as THREE from "three";
import { Component } from "../engine/component.js";

export class SimpleModel extends Component {
    constructor(gameObject, gltf, params) {
        super(gameObject);

        params = params || {};
        let rotation = params.rotation || new THREE.Vector3(0, Math.PI / 2, 0);
        let position = params.position || new THREE.Vector3();
        let scale = params.scale || new THREE.Vector3(0.1, 0.1, 0.1);

        this.model = gltf.scene.clone();

        this.model.position.copy(position);
        this.model.rotateX(rotation.x);
        this.model.rotateY(rotation.y);
        this.model.rotateZ(rotation.z);
        this.model.scale.copy(scale);

        this.model.traverse(function (mesh) {
            if (mesh.isMesh) {
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                mesh.material.side = THREE.FrontSide;
                mesh.material.roughness = 1.0;
                mesh.material.flatShading = true;
            }
        });

        this.gameObject.transform.add(this.model);
    }

    destroy() {
        for (const child of this.model.children) {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        }
        this.model.parent.remove(this.model);
    }
}

export class WreckModel extends SimpleModel {
    constructor(gameObject, gltf, params) {
        super(gameObject, gltf, params);
        this.model.visible = false;
        this.gameObject.subscribe("collision", () => {
            this.model.visible = true;
        });
    }
}

export class PavewayModel extends SimpleModel {
    constructor(gameObject, gltf, params) {
        super(gameObject, gltf, params);
        const wings = this.gameObject.transform.getObjectByName("Wings");
        wings.visible = false;
        this.gameObject.subscribe("wings", (event) => {
            console.log("fire paveway");
            wings.visible = true;
        });
    }
}

export class AirplaneModel extends Component {
    constructor(gameObject, gltf, params) {
        super(gameObject);

        params = params || {};
        let rotation = params.rotation || new THREE.Vector3(0, Math.PI / 2, 0);
        let position = params.position || new THREE.Vector3();
        let scale = params.scale || new THREE.Vector3(0.1, 0.1, 0.1);
        this.sensorCamera = params.sensor;

        this.model = gltf.scene;
        this.model.position.copy(position);
        this.model.rotateX(rotation.x);
        this.model.rotateY(rotation.y);
        this.model.rotateZ(rotation.z);
        this.model.scale.copy(scale);

        this.model.traverse(function (mesh) {
            if (mesh.isMesh) {
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                mesh.material.side = THREE.FrontSide;
                mesh.material.roughness = 1.0;
                mesh.material.flatShading = true;
            }
        });

        //console.log(this.model.children);

        this.propellor = this.model.getObjectByName("Propellor");
        this.sensor = this.model.getObjectByName("Sensor");

        this.sensor.rotation.name = "YZX";

        this.gameObject.transform.add(this.model);
    }

    update(dt) {
        if (this.propellor) this.propellor.rotateZ(100.0 * dt);
        /*
        if (this.sensor) {
            const rotation = this.sensorCamera.rotation;

            let rot = new THREE.Vector3(0, -Math.PI / 2, 0);
            rot.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), rotation.y);
            rot.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), rotation.z);
            rot.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), rotation.x);

            this.sensor.rotation.copy(rot);
            this.sensor.rotation.set(
                -this.sensorCamera.rotation.x,
                this.sensorCamera.rotation.y + Math.PI / 2,
                this.sensorCamera.rotation.z
            );
        }
        */
    }

    destroy() {
        for (const child of this.model.children) {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        }
        this.model.parent.remove(this.model);
    }
}
