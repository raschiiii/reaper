import { Component } from "../engine/component.js";
import * as THREE from "../three/build/three.module.js";

/*
 Implemented according to Physics for Game Programmers (Grant Palmer)
*/

// Abstract class for Ordinary Diferential Equations
export class ODE {
    constructor(gameObject, numEqns) {
        this.gameObject = gameObject;
        this.numEqns = numEqns;
        this.q = []; // dependant variables
        this.s = 0; // independant variable
    }

    // where all the calculation takes place
    getRightHandSide(s, q, deltaQ, ds, qScale) {}

    // TODO implement setters
    get position() {
        return new THREE.Vector3();
    }
    get velocity() {
        return new THREE.Vector3();
    }
    get rotation() {
        return new THREE.Euler();
    }

    update(dt) {
        ODESolver.rungeKutta4(this, dt);
        //console.log(this)
    }
}

export class ODESolver {
    static rungeKutta4(ode, ds) {
        const numEqns = ode.numEqns;
        const s = ode.s;
        const q = ode.q;

        const dq1 = ode.getRightHandSide(s, q, q, ds, 0.0);
        const dq2 = ode.getRightHandSide(s + 0.5 * ds, q, dq1, ds, 0.5);
        const dq3 = ode.getRightHandSide(s + 0.5 * ds, q, dq2, ds, 0.5);
        const dq4 = ode.getRightHandSide(s + ds, q, dq3, ds, 1.0);

        ode.s = s + ds;

        for (let j = 0; j < numEqns; j++) {
            q[j] = q[j] + (dq1[j] + 2.0 * dq2[j] + 2.0 * dq3[j] + dq4[j]) / 6.0;
            ode.q[j] = q[j];
        }
    }
}

export class Physics extends Component {
    constructor(gameObject, ode) {
        super(gameObject);
        this.ode = ode;
    }

    update(dt) {
        this.ode.update(dt);
        this.gameObject.position.copy(this.ode.position);
        this.gameObject.velocity.copy(this.ode.velocity);
        this.gameObject.position.multiplyScalar(0.1);

        this.gameObject.velocity.multiplyScalar(0.1);

        this.gameObject.transform.setRotationFromEuler(this.ode.rotation);
    }
}
