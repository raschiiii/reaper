import * as THREE from '../three/build/three.module.js';
import { MissileODE } from './missile-ode.js';
import { ODESolver } from './physics.js';

export class Hellfire extends MissileODE  {
    constructor(gameObject){
        super(gameObject, {

            // switch coordiantes
            x: gameObject.position.x * 10.0,
            y: gameObject.position.z * 10.0,
            z: gameObject.position.y * 10.0,

            vx: gameObject.velocity.x * 10,
            vy: gameObject.velocity.z * 10,
            vz: gameObject.velocity.y * 10,

            diameter: 0.18,
            mass: 40.0
        });
    }
}
 