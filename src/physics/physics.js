import { Component } from '../components.js';
import * as THREE from '../three/build/three.module.js';

/*
 Implemented according to Physics for Game Programmers (Grant Palmer)
*/

// Abstract class for Ordinary Diferential Equations
export class ODE {
    constructor(numEqns){
        this.numEqns = numEqns;
        this.q = []; // dependant variables
        this.s = 0;  // independant variable
    }

    getRightHandSide(s, q, deltaQ, ds, qScale){}

    getPosition(){}
}

export class ODESolver {
    static rungeKutta4(ode, ds){
        const numEqns = ode.numEqns;
        const s = ode.s;
        const q = ode.q;

        const dq1 = ode.getRightHandSide(s, q, q, ds, 0.0);
        const dq2 = ode.getRightHandSide(s+0.5*ds, q, dq1, ds, 0.5);
        const dq3 = ode.getRightHandSide(s+0.5*ds, q, dq2, ds, 0.5);
        const dq4 = ode.getRightHandSide(s+ds, q, dq3, ds, 1.0);

        ode.s = s + ds;

        for (let j = 0; j < numEqns; j++){
            q[j] = q[j] + (dq1[j] + 2.0*dq2[j] + 2.0*dq3[j] + dq4[j])/6.0;
            ode.q[j] = q[j];
        }
    }
}

export class Physics extends Component {
    constructor(gameObject, ode){
        super(gameObject);
        this.ode = ode;
    }

    update(dt){
        this.ode.update(dt);
        this.gameObject.position.copy(this.ode.getPosition())
    }
}