import * as THREE from "../three/build/three.module.js";
import { ODE } from "./physics.js";

export class GravityODE extends ODE {
    //constructor(gameObject, x0, y0, z0, vx0, vy0, vz0){
    constructor(gameObject) {
        super(gameObject, 6);

        this.s = 0; // time
        this.q[0] = gameObject.velocity.x * 10.0;
        this.q[2] = gameObject.velocity.z * 10.0;
        this.q[4] = gameObject.velocity.y * 10.0;

        this.q[1] = gameObject.position.x * 10.0;
        this.q[3] = gameObject.position.z * 10.0;
        this.q[5] = gameObject.position.y * 10.0;

        /*
        this.q[0] = vx0;
        this.q[2] = vy0;
        this.q[4] = vz0;
        
        this.q[3] = y0;
        this.q[1] = x0;
        this.q[5] = z0;
        */

        this.gameObject.subscribe("collision", (event) => {
            let x = event.depth[0];
            let y = event.depth[1];
            let z = event.depth[2];

            if (Math.abs(x) > Math.abs(y) && Math.abs(z) > Math.abs(y)) {
                this.q[5] -= y;
                this.q[4] = 0;
            }

            if (Math.abs(y) > Math.abs(x) && Math.abs(z) > Math.abs(x)) {
                this.q[1] -= x;
                this.q[0] = 0;
            }

            if (Math.abs(y) > Math.abs(z) && Math.abs(x) > Math.abs(z)) {
                this.q[3] -= z;
                this.q[2] = 0;
            }
        });
    }

    get position() {
        return new THREE.Vector3(this.q[1], this.q[5], this.q[3]);
    }

    get velocity() {
        return new THREE.Vector3(this.q[0], this.q[4], this.q[2]);
    }

    update(dt) {
        let time = this.s;
        let vx0 = this.q[0];
        let x0 = this.q[1];
        let vy0 = this.q[2];
        let y0 = this.q[3];
        let vz0 = this.q[4];
        let z0 = this.q[5];

        let x = x0 + vx0 * dt;
        let y = y0 + vy0 * dt;
        let vz = vz0 - 9.81 * dt;
        let z = z0 + vz0 * dt + 0.5 * -9.81 * dt * dt;

        time += dt;

        this.s = time;
        this.q[1] = x;
        this.q[3] = y;
        this.q[5] = z;
        this.q[4] = vz;
    }
}
