import * as THREE from "three";
import { ODE, ODESolver } from "./physics.js";

export class SpringODE extends ODE {
    constructor(gameObject, mass, mu, k, x0) {
        super(gameObject, 2);
        this.mass = mass;
        this.mu = mu;
        this.k = k;
        this.x0 = x0;
        this.time = 0.0;

        this.q[0] = 0.0;
        this.q[1] = x0;
    }

    getRightHandSide(s, q, deltaQ, ds, qScale) {
        let dq = [];
        let newQ = [];

        for (let i = 0; i < 2; i++) {
            newQ[i] = q[i] + qScale * deltaQ[i];
        }

        dq[0] = (-ds * (this.mu * newQ[0] + this.k * newQ[1])) / this.mass;
        dq[1] = ds * newQ[0];

        return dq;
    }

    get position() {
        return new THREE.Vector3(0, this.q[1], 0);
    }
}
