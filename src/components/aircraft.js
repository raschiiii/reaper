import * as THREE from "../three/build/three.module.js";
import { Component } from "../engine/component.js";

export class Sensor extends Component {
    constructor(gameObject, camera) {
        super(gameObject);

        this._camera = camera;

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

        this._track = false;
        this._target = new THREE.Vector3(0, -5, 0);

        let down = false;

        const that = this;
        this._zoom = 0;
        this._zoomSlider = document.querySelector("#slider4");

        this._zoomSlider.oninput = function () {
            that._camera.zoom = this.value;
            that._camera.updateProjectionMatrix();
        };

        
        this.gameObject.subscribe("sensor", (event) => {
            //console.log(event);
        });

        this.gameObject.subscribe("pointermove", (event) => {
            if (down){
                //console.log("move")
                this._sensorRotation.y -= (event.movementX * 0.01 / this._camera.zoom);
                this._sensorRotation.x -= (event.movementY * 0.01 / this._camera.zoom);
            }
        });
        this.gameObject.subscribe("pointerdown", (event) => {
            //console.log("down")
            down = true;
        });
        this.gameObject.subscribe("pointerup", (event) => {
            //console.log("not down")
            down = false;
        });
        this.gameObject.subscribe("wheel", (event) => {
            this._camera.zoom -= event.deltaY * .5;
            if (this._camera.zoom < 1.0) this._camera.zoom = 1.0;
            this._camera.updateProjectionMatrix();
        });

        this.gameObject.subscribe(
            "keydown",
            (e) => {
                const sensitivity = 0.1 / this._camera.zoom;

                switch (e.code) {
                    case "KeyL":
                        this.laserTrack();
                        break;

                    case "KeyK":
                        this._track = false;
                        this._sensorRotation.copy(this._camera.rotation);
                        break;
                    /*
                    case "KeyW":
                        this._sensorRotation.x += sensitivity;
                        break;

                    case "KeyS":
                        this._sensorRotation.x -= sensitivity;
                        break;

                    case "KeyA":
                        this._sensorRotation.y += sensitivity;
                        break;

                    case "KeyD":
                        this._sensorRotation.y -= sensitivity;
                        break;
*/
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
            console.log("laser");
            this.gameObject.publish("laser", { target: this._target });
            this._track = true;
        }

        //for ( let i = 0; i < intersects.length; i ++ ) {
        //    intersects[ i ].object.material.color.set( 0xff0000 );
        //}
    }

    update(dt) {
        let o = new THREE.Vector3();
        this._cameraDummy.getWorldPosition(o);

        this._camera.rotation.copy(this._sensorRotation);

        // let dir = new THREE.Vector3(0,0,-1);
        // dir.applyEuler(this._camera.rotation);
        // dir.normalize();
        // dir.multiplyScalar(this._zoom);
        // o.add(dir);

        this._camera.position.copy(o);

        if (this._track) {
            this._camera.lookAt(this._target);
        }
    }
}

export class Hardpoints extends Component {
    constructor(gameObject) {
        super(gameObject);

        const y = -0.06;
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
        this._h = 1;

        this.gameObject.subscribe("laser", (e) => {
            this._target = e.target;
            console.log("got laser target");
        });

        this.gameObject.subscribe("keydown", (e) => {
            switch (e.code) {
                case "KeyF":
                    this.gameObject.publish("fire", {
                        hardpoint: this._h++,
                        target: this._target,
                        position: this.gameObject.position,
                        velocity: this.gameObject.velocity,
                    });
                    break;
            }
        });
    }
}
