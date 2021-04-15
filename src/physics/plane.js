import * as THREE from "../three/build/three.module.js";
import { FlightmodelODE } from "./flightmodel-ode.js";
import { ODESolver } from "./physics.js";

export class Plane extends FlightmodelODE {
    constructor(gameObject) {
        super(gameObject, {
            // switch coordiantes
            x: gameObject.position.x * 10.0,
            y: gameObject.position.z * 10.0,
            z: gameObject.position.y * 10.0,

            vx: gameObject.velocity.x * 10.0,
            vy: gameObject.velocity.z * 10.0,
            vz: gameObject.velocity.y * 10.0,

            wingArea: 16.2,
            wingSpan: 10.9,
            tailArea: 2.0,
            clSlope0: 0.0889,
            clSlope1: -0.1,
            cl0: 0.178,
            cl1: 3.2,
            alphaClMax: 16.0,
            cdp: 0.034,
            eff: 0.77,
            mass: 1114.0,
            engineRps: 40.0,
            enginePower: 119310.0,
            propDiameter: 1.905,
            a: 1.83,
            b: -1.32,
        });

        let alpha = document.querySelector("#alpha");
        let bank = document.querySelector("#bank");

        let that = this;
        let thrustSlider = document.querySelector("#slider3");
        thrustSlider.oninput = function () {
            that.throttle = this.value;
            throttle.innerText = that.throttle;
        };

        let bankSlider = document.querySelector("#slider2");
        bankSlider.oninput = function () {
            that.bank = this.value / 10;
            bank.innerText = that.bank / 10;
        };

        let aoaSlider = document.querySelector("#slider1");
        aoaSlider.oninput = function () {
            that.alpha = this.value / 10;
            alpha.innerText = that.alpha;
        };

        this.gameObject.subscribe("keydown", (event) => {
            console.log("key");
            switch (event.code) {
                case "KeyA":
                    this.bank += 0.025;
                    break;

                case "KeyD":
                    this.bank -= 0.025;
                    break;

                case "KeyW":
                    this.alpha -= 1;
                    break;

                case "KeyS":
                    this.alpha += 1;
                    break;
            }
        });
    }
}
