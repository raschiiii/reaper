import * as THREE from '../three/build/three.module.js';
import { ODE } from './physics.js';

export class FlightmodelODE extends ODE {
    constructor(gameObject, params){
        let vx = params.vx;
        let vy = params.vy;
        let vz = params.vz;

        let x = params.x;
        let y = params.y;
        let z = params.z;

        this.time = 0;
        this.wingArea = params.wingArea;
        this.wingSpan = params.wingSpan;
        this.tailArea = params.tailArea;
        this.clSlope0 = params.clSlope0;
        this.cl0 = params.cl0;
        this.clSlope1 = params.clSlope1;
        this.cl1 = params.cl1;
        this.alphaClMax = params.alphaClMax;
        this.cdp = params.cdp;
        this.eff = params.eff;
        this.mass = params.mass;
        this.engineRps = params.engineRps;
        this.propDiameter = params.propDiameter;
        this.a = params.a;
        this.b = params.b;

        this.bank = 0;
        this.alpha = 0;
        this.throttle = 0;
        this.flap = 0;
        


    }

    getRightHandSide(s, q, deltaQ, ds, qScale){
        let dQ = [];
        let newQ = [];

        // Compute the intermediate values of the
        // location and velocity components.
        for(let i=0; i<6; i++) {
            newQ[i] = q[i] + qScale*deltaQ[i];
        }

        let vx = newQ[0];
        let vy = newQ[2];
        let vz = newQ[4];
        let x = newQ[1];
        let y = newQ[3];
        let z = newQ[5];

        let vh = Math.sqrt(vx*vx + vy*vy);
        let vtotal = Math.sqrt(vx*vx + vy*vy + vz*vz);


        let temperature = 288.15 - 0.0065*z;
        let grp = (1.0 - 0.0065*z/288.15);
        let pressure = 101325.0*Math.pow(grp, 5.25);
        let density = 0.00348*pressure/temperature;
        
        let omega = density/1.225;
        let factor = (omega - 0.12)/0.88;
        let advanceRatio = vtotal/(engineRps*propDiameter);
        let thrust = throttle*factor*enginePower*(a + b*advanceRatio*advanceRatio)/(engineRps*propDiameter);

        let cl;
        if ( alpha < alphaClMax ) {
            cl = clSlope0*alpha + cl0;
        } else {
            cl = clSlope1*alpha + cl1;
        }

        if ( flap == 20) {
            cl += 0.25;
        }
        if ( flap == 40 ){
            cl += 0.5;
        }
        if ( z < 5.0 ) {
            cl += 0.25;
        }

        let lift = 0.5*cl*density*vtotal*vtotal*wingArea;

        let aspectRatio = wingSpan*wingSpan/wingArea;
        let cd = cdp + cl*cl/(Math.PI*aspectRatio*eff);
        let drag = 0.5*cd*density*vtotal*vtotal*wingArea

        let cosW = Math.cos(bank); 
        let sinW = Math.sin(bank);

        let cosP;      
        let sinP;      
        let cosT;      
        let sinT; 

        if ( vtotal == 0.0 ) {
            cosP = 1.0;
            sinP = 0.0;
        } else {
            cosP = vh/vtotal;  
            sinP = vz/vtotal;  
        }

        if ( vh == 0.0 ) {
            cosT = 1.0;
            sinT = 0.0;
        } else {
            cosT = vx/vh;
            sinT = vy/vh;
        }

        let Fx = cosT*cosP*(thrust - drag) + 
               (sinT*sinW - cosT*sinP*cosW)*lift;
        let Fy = sinT*cosP*(thrust - drag) + 
                (-cosT*sinW - sinT*sinP*cosW)*lift;
        let Fz = sinP*(thrust - drag) + cosP*cosW*lift;
        
        Fz = Fz + mass*-9.81;

    
        if ( z <= 0.0 && Fz <= 0.0 ) {
            Fz = 0.0;
        }

        dQ[0] = ds*(Fx/mass);
        dQ[1] = ds*vx;
        dQ[2] = ds*(Fy/mass);
        dQ[3] = ds*vy;
        dQ[4] = ds*(Fz/mass);
        dQ[5] = ds*vz;
       
        return dQ;
    
    }
}