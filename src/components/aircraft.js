import * as THREE from "three";
import { Component } from "../engine/component.js";

export class Sensor extends Component {
    constructor(gameObject, camera) {
        super(gameObject);

        this._camera = camera;
        this._target = new THREE.Vector3(0, -5, 0);
        this._track = false;
        let down = false;
        this.enabled = false;

        this._laserEl = document.querySelector("#laser");
        this._altEl = document.querySelector("#alt");
        this._spdEl = document.querySelector("#spd");
        this._rngEl = document.querySelector("#rng");

        this._sensorRotation = new THREE.Euler(0, -Math.PI / 2, 0, "YZX");
        this._camera.rotation.copy(this._sensorRotation);

        this._cameraDummy = new THREE.Object3D();
        this._cameraDummy.position.x += 0.45;
        this._cameraDummy.position.y -= 0.1;
        this.gameObject.transform.add(this._cameraDummy);

        this._raycaster = new THREE.Raycaster(
            new THREE.Vector3(),
            new THREE.Vector3(0, -1, 0)
        );

        this.gameObject.subscribe("sensor", (event) => {
            this.enabled = event.enabled;
        });

        this.gameObject.subscribe("pointermove", (event) => {
            if (!this.enabled) return;
            if (down) {
                this._sensorRotation.y -=
                    (event.movementX * 0.01) / this._camera.zoom;
                this._sensorRotation.x -=
                    (event.movementY * 0.01) / this._camera.zoom;
            }
        });

        this.gameObject.subscribe("pointerdown", (event) => {
            if (!this.enabled) return;
            down = true;
        });

        this.gameObject.subscribe("pointerup", (event) => {
            if (!this.enabled) return;
            down = false;
        });

        this.gameObject.subscribe("wheel", (event) => {
            if (!this.enabled) return;
            this._camera.zoom -= event.deltaY * 0.01;
            if (this._camera.zoom < 1.0) this._camera.zoom = 1.0;
            this._camera.updateProjectionMatrix();
        });

        this.gameObject.subscribe(
            "keydown",
            (event) => {
                if (!this.enabled) return;
                switch (event.code) {
                    case "KeyT":
                        if (!this._track) {
                            this.laserTrack();
                            this._laserEl.style.display = "block";
                        } else {
                            this._track = false;
                            this._laserEl.style.display = "none";
                            this._sensorRotation.copy(this._camera.rotation);
                        }
                        break;
                }
            },
            false
        );
    }

    laserTrack() {
        let dir = new THREE.Vector3(0, 0, -1);
        dir.applyEuler(this._camera.rotation);
        dir.normalize();

        this._raycaster.set(this._camera.position, dir);

        const intersects = this._raycaster.intersectObjects(
            this.gameObject.root.children,
            true
        );

        if (intersects.length > 0) {
            this._target.copy(intersects[0].point);
            this.gameObject.publish("laser", { target: this._target });
            this._track = true;
        }

        /*
        for ( let i = 0; i < intersects.length; i ++ ) {
            intersects[ i ].object.material.color.set( 0xff0000 );
        }
        */
    }

    update(_) {
        let cameraPos = new THREE.Vector3();
        this._cameraDummy.getWorldPosition(cameraPos);
        this._camera.rotation.copy(this._sensorRotation);
        this._camera.position.copy(cameraPos);

        this._altEl.innerText = `ALT ${(
            this.gameObject.position.y * 10
        ).toFixed(2)}`;

        this._spdEl.innerText = `SPD ${(
            this.gameObject.velocity.length() * 10
        ).toFixed(2)}`;

        if (this._track) {
            const distance = cameraPos.distanceTo(this._target);
            this._rngEl.innerText = `RNG ${(distance * 10.0).toFixed(2)}`;
            this._camera.lookAt(this._target);
        } else {
            this._rngEl.innerText = `RNG`;
        }
    }
}

export class Hardpoints extends Component {
    constructor(gameObject) {
        super(gameObject);

        const y = -0.055;
        const x = 0.01;

        this.h1 = new THREE.Object3D();
        this.h1.position.set(x, y, 0.3);
        this.gameObject.transform.add(this.h1);

        this.h3 = new THREE.Object3D();
        this.h3.position.set(x, y, 0.27);
        this.gameObject.transform.add(this.h3);

        this.h5 = new THREE.Object3D();
        this.h5.position.set(x, y, 0.14);
        this.gameObject.transform.add(this.h5);

        this.h6 = new THREE.Object3D();
        this.h6.position.set(x, y, -0.14);
        this.gameObject.transform.add(this.h6);

        this.h4 = new THREE.Object3D();
        this.h4.position.set(x, y, -0.27);
        this.gameObject.transform.add(this.h4);

        this.h2 = new THREE.Object3D();
        this.h2.position.set(x, y, -0.3);
        this.gameObject.transform.add(this.h2);
    }
}

export class FireControlSystem extends Component {
    constructor(gameObject) {
        super(gameObject);

        this._target = null;
        this._hellfires = 1;
        this._paveways = 5;

        this.gameObject.subscribe("laser", (e) => {
            this._target = e.target;
            //console.log("got laser target");
        });

        this.gameObject.subscribe("keydown", (e) => {
            switch (e.code) {
                case "KeyF":
                    if (this._hellfires > 4) return;
                    this.gameObject.publish("fire", {
                        hardpoint: this._hellfires++,
                        target: this._target,
                        position: this.gameObject.position,
                        velocity: this.gameObject.velocity,
                    });
                    break;

                case "KeyG":
                    if (this._paveways > 6) return;
                    this.gameObject.publish("fire", {
                        hardpoint: this._paveways++,
                        target: this._target,
                        position: this.gameObject.position,
                        velocity: this.gameObject.velocity,
                    });
                    break;
            }
        });
    }
}
