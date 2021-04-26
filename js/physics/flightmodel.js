import * as THREE from "../three/build/three.module.js";
import { FlightmodelODE } from "./flightmodel-ode.js";

export class Flightmodel extends FlightmodelODE {
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

        this.keys = {
            KeyA: false,
            KeyD: false,
            KeyW: false,
            KeyS: false,
            KeyW: false,
            ShiftLeft: false,
            CapsLock: false
        };

        this.display1 = document.querySelector("#display1");
        this.display2 = document.querySelector("#display2");

        this.gameObject.subscribe("keydown", (event) => {
            switch (event.code) {
                case "KeyA":
                    this.keys.KeyA = true;
                    break;

                case "KeyD":
                    this.keys.KeyD = true;
                    break;

                case "KeyW":
                    this.keys.KeyW = true;
                    break;

                case "KeyS":
                    this.keys.KeyS = true;
                    break;

                case "ShiftLeft":
                    this.throttle += 10;
                    break;

                case "CapsLock":
                    this.throttle -= 10;
                    break;
            }
        });

        this.gameObject.subscribe("keyup", (event) => {
            switch (event.code) {
                case "KeyA":
                    this.keys.KeyA = false;
                    break;

                case "KeyD":
                    this.keys.KeyD = false;
                    break;

                case "KeyW":
                    this.keys.KeyW = false;
                    break;

                case "KeyS":
                    this.keys.KeyS = false;
                    break;




            }
        });
    }

    update(dt) {
        super.update(dt);

        const alphaSensitivity = 2.5;
        if (this.keys.KeyW) this.alpha -= alphaSensitivity * dt;
        if (this.keys.KeyS) this.alpha += alphaSensitivity * dt;

        const bankSensitivity = 0.5;
        if (this.keys.KeyA) this.bank += bankSensitivity * dt;
        if (this.keys.KeyD) this.bank -= bankSensitivity * dt;


        this.alpha += (-this.alpha) * dt;


        this.display1.innerText = `alpha: ${this.alpha.toFixed(2)}`;
        this.display2.innerText = `throttle: ${this.throttle.toFixed(2)}`;
    }
}
