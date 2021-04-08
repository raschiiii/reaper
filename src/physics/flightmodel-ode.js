import * as THREE from '../three/build/three.module.js';
import { ODE } from './physics.js';

export class FlightmodelODE extends ODE {
    constructor(gameObject, params){
        super(gameObject, 6);

        this.display2 = document.querySelector('#display2')
        this.display1 = document.querySelector('#throttle');

        this.s    = 0; 
        this.q[0] = params.vx;
        this.q[1] = params.x;
        this.q[2] = params.vy;
        this.q[3] = params.y;
        this.q[4] = params.vz;
        this.q[5] = params.z;

        this.time = 0;
        this.wingArea = params.wingArea;
        this.wingSpan = params.wingSpan;
        this.tailArea = params.tailArea;
       
        this.clSlope0 = params.clSlope0;
        this.clSlope1 = params.clSlope1;
        
        this.cl0 = params.cl0;
        this.cl1 = params.cl1;
        
        this.alphaClMax = params.alphaClMax;
      
        this.cdp = params.cdp;
        this.eff = params.eff;
     
        this.mass = params.mass;
    
        this.engineRps      = params.engineRps;
        this.enginePower    = params.enginePower;
        this.propDiameter   = params.propDiameter;
   
        this.a = params.a;
        this.b = params.b;

        this.bank = 0;
        this.alpha = 0;
        this.throttle = 0;
        this.flap = 0;

        this.roll = 0;
        this.pitch = 0;
        this.yaw = 0;


        this.display2 = document.querySelector('#display2');

    }

    getRightHandSide(s, q, deltaQ, ds, qScale){
        let dQ      = [];
        let newQ    = [];

        for(let i = 0; i < 6; i++) {
            newQ[i] = q[i] + qScale*deltaQ[i];
        }

        let vx = newQ[0];
        let vy = newQ[2];
        let vz = newQ[4];
        let x  = newQ[1];
        let y  = newQ[3];
        let z  = newQ[5];

        this.velocity.set(vx, vy, vz);

        let vh = Math.sqrt(vx*vx + vy*vy);
        let vtotal = Math.sqrt(vx*vx + vy*vy + vz*vz);

        let temperature = 288.15 - 0.0065*z;
        let grp = (1.0 - 0.0065*z/288.15);
        let pressure = 101325.0*Math.pow(grp, 5.25);
        let density = 0.00348*pressure/temperature;
        
        //let omega = density/1.225;
        //let factor = (omega - 0.12)/0.88;
        //let advanceRatio = vtotal/(this.engineRps*this.propDiameter);
        //let thrust = this.throttle*factor*this.enginePower*(this.a + this.b*advanceRatio*advanceRatio)/(this.engineRps*this.propDiameter);

        let thrust = this.throttle * 5;

        this.display2.innerText = `thrust ${thrust.toFixed(2)}`

        let cl;
        if ( this.alpha < this.alphaClMax ) {
            cl = this.clSlope0*this.alpha + this.cl0;
        } else {
            cl = this.clSlope1*this.alpha + this.cl1;
        }

        if ( this.flap == 20) {
            cl += 0.25;
        }
        if ( this.flap == 40 ){
            cl += 0.5;
        }
        if ( z < 5.0 ) {
            cl += 0.25;
        }

        let lift = 0.5*cl*density*vtotal*vtotal*this.wingArea;

        let aspectRatio = this.wingSpan*this.wingSpan/this.wingArea;
        let cd = this.cdp + cl*cl/(Math.PI*aspectRatio*this.eff);
        let drag = 0.5*cd*density*vtotal*vtotal*this.wingArea

        let cosRoll = Math.cos(this.bank); 
        let sinRoll = Math.sin(this.bank);
        this.roll   = Number(this.bank);
        
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

        let Fx = cosYaw*cosPitch*(thrust - drag) + ( sinYaw*sinRoll - cosYaw*sinPitch*cosRoll)*lift;
        let Fy = sinYaw*cosPitch*(thrust - drag) + (-cosYaw*sinRoll - sinYaw*sinPitch*cosRoll)*lift;
        let Fz = sinPitch*(thrust - drag) + cosPitch*cosRoll*lift;

        Fz = Fz + this.mass * -9.81;
    
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