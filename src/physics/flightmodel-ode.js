import * as THREE from '../three/build/three.module.js';
import { ODE } from './physics.js';

export class FlightmodelODE extends ODE {
    constructor(gameObject, params){
        super(gameObject, 6);

        this.display2 = document.querySelector('#display2')

        let vx = params.vx;
        let vy = params.vy;
        let vz = params.vz;

        let x = params.x;
        let y = params.y;
        let z = params.z;

        console.log(x,y,z)

        this.s = 0; 
        this.q[0] = vx;
        this.q[1] = x;

        this.q[2] = vy;
        this.q[3] = y;

        this.q[4] = vz;
        this.q[5] = z;

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
    
        this.engineRps = params.engineRps;
        this.enginePower = params.enginePower;
        this.propDiameter = params.propDiameter;
   
        this.a = params.a;
        this.b = params.b;

        this.bank = 0;
        this.alpha = 0;
        this.throttle = 0;
        this.flap = 0;

        console.log(this.q)
    }

    get position(){
        return new THREE.Vector3(this.q[1], this.q[5], this.q[3]);
    }

    get velocity(){
        return new THREE.Vector3(this.q[0], this.q[4], this.q[2]);
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
        
        let omega = density/1.225;
        let factor = (omega - 0.12)/0.88;
        let advanceRatio = vtotal/(this.engineRps*this.propDiameter);
        let thrust = this.throttle*factor*this.enginePower*(this.a + this.b*advanceRatio*advanceRatio)/(this.engineRps*this.propDiameter);

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

        let cosW = Math.cos(this.bank); 
        let sinW = Math.sin(this.bank);

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

        let Fx = cosT*cosP*(thrust - drag) + ( sinT*sinW - cosT*sinP*cosW)*lift;
        let Fy = sinT*cosP*(thrust - drag) + (-cosT*sinW - sinT*sinP*cosW)*lift;
        let Fz = sinP*(thrust - drag) + cosP*cosW*lift;

        this.display2.innerText = `${Fx.toFixed(2)}, ${Fy.toFixed(2)}, ${Fz.toFixed(2)}`
        
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
}