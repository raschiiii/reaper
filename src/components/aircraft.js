import * as THREE from "three";
import { Component } from "../engine/component.js";

export class SensorCamera extends THREE.PerspectiveCamera {
    constructor(fov = 50, aspect = 1, near = 0.1, far = 2000) {
        super(fov, aspect, near, far);
        this.focusPoint = new THREE.Vector3(); // the point the camera is focused on, needed for LOD
    }
}

export class Sensor extends Component {
    constructor(gameObject, camera) {
        super(gameObject);

        this._camera = camera;
        this._target = new THREE.Vector3(0, -5, 0);
        this._track = false;
        let down = false;
        this.enabled = false;

        this._elem = {
            laser: document.querySelector("#laser"),
            yaw: document.querySelector("#yaw"),
            pitch: document.querySelector("#pitch"),
            alt: document.querySelector("#alt"),
            speed: document.querySelector("#spd"),
            range: document.querySelector("#rng"),
            target_north: document.querySelector("#trgtN"),
            target_east: document.querySelector("#trgtE"),
            zoom: document.querySelector("#zoom"),
            east: document.querySelector("#E"),
            north: document.querySelector("#N"),
        };

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
            (e) => {
                if (!this.enabled) return;
                switch (e.code) {
                    case "KeyT":
                        if (!this._track) {
                            this._laserTrack();
                            this._elem.laser.style.display = "block";
                        } else {
                            this._track = false;
                            this._elem.laser.style.display = "none";
                            this._sensorRotation.copy(this._camera.rotation);
                        }
                        break;
                }
            },
            false
        );
    }

    update(_) {
        let sensorPosition = new THREE.Vector3();
        this._cameraDummy.getWorldPosition(sensorPosition);
        this._camera.rotation.copy(this._sensorRotation);
        this._camera.position.copy(sensorPosition);

        const point = this._raycast();

        this._camera.focusPoint = point;

        this._updateDisplay();

        if (this._track) {
            this._camera.lookAt(this._target);
        }
    }

    _updateDisplay() {
        const position = this.gameObject.position;
        const velocity = this.gameObject.velocity;
        const rotation = this.gameObject.rotation;

        const pitchOffset = Math.floor(
            THREE.MathUtils.radToDeg(this._sensorRotation.x - rotation.z)
        );

        const yawOffset = Math.floor(
            THREE.MathUtils.radToDeg(this._sensorRotation.y - rotation.y)
        );

        this._elem.pitch.innerText = `${pitchOffset}`;
        this._elem.yaw.innerText = `${(yawOffset + 90) % 360}`;

        this._elem.alt.innerText = `${(position.y * 10).toFixed(2)}`;
        this._elem.speed.innerText = ` ${(velocity.length() * 10).toFixed(2)}`;

        this._elem.zoom.innerText = `${this._camera.zoom}`;
        this._elem.east.innerText = `${position.z.toFixed(2)}`;
        this._elem.north.innerText = `${position.x.toFixed(2)}`;

        if (this._track) {
            const distance = this._camera.position.distanceTo(this._target);
            this._elem.range.innerText = `${(distance * 10.0).toFixed(2)}`;
            this._elem.target_north.innerText = `${this._target.x.toFixed(2)}`;
            this._elem.target_east.innerText = `${this._target.z.toFixed(2)}`;
        } else {
            this._elem.range.innerText = ``;
            this._elem.target_north.innerText = ``;
            this._elem.target_east.innerText = ``;
        }
    }

    _raycast() {
        let dir = new THREE.Vector3(0, 0, -1);
        let point = new THREE.Vector3();
        dir.applyEuler(this._camera.rotation);
        dir.normalize();

        this._raycaster.set(this._camera.position, dir);

        const intersects = this._raycaster.intersectObjects(
            this.gameObject.root.children,
            true
        );

        if (intersects.length > 0) {
            point.copy(intersects[0].point);
            return point;
        } else {
            return new THREE.Vector3();
        }
    }

    _laserTrack() {
        /*
        for ( let i = 0; i < intersects.length; i ++ ) {
            intersects[ i ].object.material.color.set( 0xff0000 );
        }
        */

        const point = this._raycast();
        if (point) {
            this._target.copy(point);
            this.gameObject.publish("laser", { target: this._target });
            this._track = true;
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
