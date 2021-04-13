import * as THREE from "../three/build/three.module.js";
import { ODE } from "./physics.js";

export class TestODE extends ODE {
    constructor(gameObject) {
        super(gameObject, 1);

        this.euler = new THREE.Euler();
        this.euler.order = "YZX";

        let r = document.querySelector("#alpha");
        let y = document.querySelector("#bank");
        let p = document.querySelector("#throttle");

        let that = this;
        let pitch = document.querySelector("#slider3");
        pitch.oninput = function () {
            console.log(this.value);
            that.euler.z = this.value / 10;
            p.innerText = `pitch=${that.euler.z}`;
        };

        let yaw = document.querySelector("#slider2");
        yaw.oninput = function () {
            that.euler.y = this.value / 10;
            y.innerText = `yaw=${that.euler.y}`;
        };

        let roll = document.querySelector("#slider1");
        roll.oninput = function () {
            that.euler.x = this.value / 10;
            r.innerText = `roll=${that.euler.x}`;
        };
    }

    get rotation() {
        return this.euler;
    }

    update(dt) {}
}
