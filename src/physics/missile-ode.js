import * as THREE from '../three/build/three.module.js';
import { ODE } from './physics.js';

export class MissileODE extends ODE {
    constructor(gameObject, params){
        super(gameObject, 6);

        this.s     = 0; 
        this.q[0]  = params.vx;
        this.q[1]  = params.x;
        this.q[2]  = params.vy;
        this.q[3]  = params.y;
        this.q[4]  = params.vz;
        this.q[5]  = params.z;
        this.roll  = 0;
        this.yaw   = 0;
        this.pitch = 0;
        this.mass  = params.mass;
        this.rocketDiameter = params.diameter;
    }

    getRightHandSide(s, q, deltaQ, ds, qScale){
        let dQ = [];
        let newQ = [];

        for(let i = 0; i < 6; i++) {
            newQ[i] = q[i] + qScale*deltaQ[i];
        }

        let vx = newQ[0];
        let vy = newQ[2];
        let vz = newQ[4];
        let x  = newQ[1];
        let y  = newQ[3];
        let z  = newQ[5];

        let vh = Math.sqrt(vx*vx + vy*vy);
        let vtotal = Math.sqrt(vx*vx + vy*vy + vz*vz);

        let temperature = 288.15 - 0.0065*z;
        let grp = (1.0 - 0.0065*z/288.15);
        let pressure = 101325.0*Math.pow(grp, 5.25);
        let density = 0.00348*pressure/temperature;
        
        let thrust  = 2000.0;
        let lift    = 0.0; // up down
        let lift2   = 0.0; // left right

        const cd = 0.5;
        let area = 0.25*Math.PI*this.rocketDiameter*this.rocketDiameter;
        let drag = 0.5*cd*density*vtotal*vtotal*area;

        let cosRoll = Math.cos(0); 
        let sinRoll = Math.sin(0);
        this.roll   = 0;
        
        let cosPitch;      
        let sinPitch;      
        let cosYaw;      
        let sinYaw; 

        if ( vtotal == 0.0 ) {
            cosPitch = 1.0;
            sinPitch = 0.0;
            this.pitch = 0;
        
        } else {
            this.pitch = Math.atan(vz / vh);
            cosPitch = Math.cos(this.pitch)
            sinPitch = Math.sin(this.pitch)
        }
        
        if ( vh == 0.0 ) {
            cosYaw = 1.0;
            sinYaw = 0.0;
            this.yaw = 0;

        } else {
            cosYaw = vx/vh;
            sinYaw = vy/vh;
            this.yaw = Math.atan2(vx, vy) - Math.PI / 2
        }

        //let Fx = cosYaw*cosPitch*(thrust - drag) + ( sinYaw*sinRoll - cosYaw*sinPitch*cosRoll)*lift;
        //let Fy = sinYaw*cosPitch*(thrust - drag) + (-cosYaw*sinRoll - sinYaw*sinPitch*cosRoll)*lift;
        //let Fz = sinPitch*(thrust - drag)        +   cosPitch*cosRoll*lift;

        // x = roll
        // y = pitch
        // z = yaw
        const a = thrust - drag;
        const b = lift2;
        const c = lift;

        let Fx = (cosYaw*cosPitch)*a+(-sinYaw*cosRoll-cosYaw*sinPitch*sinRoll)*b+( sinYaw*sinRoll-cosYaw*sinPitch*cosRoll)*c;
        let Fy = (sinYaw*cosPitch)*a+( cosYaw*cosRoll-sinYaw*sinPitch*sinRoll)*b+(-cosYaw*sinRoll-sinYaw*sinPitch*cosRoll)*c;
        let Fz =        (sinPitch)*a+                       (cosPitch*sinRoll)*b+                       (cosPitch*cosRoll)*c;



        Fz += this.mass * -9.81;

        if ( z <= 0.0 && Fz <= 0.0 ) {
            Fz = 0.0;
        }

        dQ[0] = ds*(Fx/this.mass);
        dQ[1] = ds*vx;
        dQ[2] = ds*(Fy/this.mass);
        dQ[3] = ds*vy;
        dQ[4] = ds*(Fz/this.mass);
        dQ[5] = ds*vz;
        return dQ;
    }

    get position(){
        return new THREE.Vector3(this.q[1], this.q[5], this.q[3]);
    }

    get velocity(){
        return new THREE.Vector3(this.q[0], this.q[4], this.q[2]);
    }

    get rotation(){
        return new THREE.Euler(-this.roll, this.yaw, this.pitch, "YZX");
    }
}