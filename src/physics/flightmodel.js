import * as THREE from './three/build/three.module.js';

import { Component } from './components.js';

export class FlightModel_PfGD extends Component {
    constructor(gameObject){
        super(gameObject);
        this.elements = []


        this.Inertia = new THREE.Matrix3();
        this.InverseInertia = new THREE.Matrix3();
        this.Mass = 0;
        this.Speed = 0;
        this.ThrustForce = 100;
        this.AngularVelocity = new THREE.Vector3();
        this.Thrust = new THREE.Vector3();
        this.Forces = new THREE.Vector3();
        this.Moments = new THREE.Vector3();
        this.VelocityBody = new THREE.Vector3();
        this.Position = new THREE.Vector3();
        this.Velocity = new THREE.Vector3();
        this.Orientation = new THREE.Quaternion();

        this.debug = document.querySelector('#display1');
        this.slider = document.querySelector('#slider1');

        this.slider.oninput = function() {
            this.ThrustForce = this.value;
            console.log(this.ThrustForce);
        } 

        this._init();
        this._calcLoads();
        
        //console.log(this.elements)
    }


    _calcMassProperties(){
        this.elements.push({
            Mass : 6.56,
            DCoords : new THREE.Vector3(14.5,12.0,2.5),
            LocalInertia : new THREE.Vector3(13.92,10.50,24.0),
            Incidence : -3.5,
            Dihedral : 0.0,
            Area : 31.2,
            Flap : 0,
        })
		this.elements.push({ 
		    Mass : 7.31,
		    DCoords : new THREE.Vector3(14.5,5.5,2.5),
		    LocalInertia : new THREE.Vector3(21.95,12.22,33.67),
		    Incidence : -3.5,
		    Dihedral : 0.0,
		    Area : 36.4,
		    Flap : 0,
		});
		this.elements.push({
			Mass : 7.31,
			DCoords : new THREE.Vector3(14.5,-5.5,2.5),
			LocalInertia : new THREE.Vector3(21.95,12.22,33.67),
			Incidence : -3.5,
			Dihedral : 0.0,
			Area : 36.4,
			Flap : 0
		});
		this.elements.push({
			Mass : 6.56,
			DCoords : new THREE.Vector3(14.5,-12.0,2.5),
			LocalInertia : new THREE.Vector3(13.92,10.50,24.00),
			Incidence : -3.5,
			Dihedral : 0.0,
			Area : 31.2,
			Flap : 0
		});
		this.elements.push({
			Mass : 2.62,
			DCoords : new THREE.Vector3(3.03,2.5,3.0),
			LocalInertia : new THREE.Vector3(0.837,0.385,1.206),
			Incidence : 0.0,
			Dihedral : 0.0,
			Area : 10.8,
			Flap : 0
		});
		this.elements.push({
			Mass : 2.62,
			DCoords : new THREE.Vector3(3.03,-2.5,3.0),
			LocalInertia : new THREE.Vector3(0.837,0.385,1.206),
			Incidence : 0.0,
			Dihedral : 0.0,
			Area : 10.8,
			Flap : 0
		});
		this.elements.push({
			Mass : 2.93,
			DCoords : new THREE.Vector3(2.25,0.0,5.0),
			LocalInertia : new THREE.Vector3(1.262,1.942,0.718),
			Incidence : 0.0,
			Dihedral : 90.0,
			Area : 12.0,
			Flap : 0
		});
		this.elements.push({
			Mass : 31.8,
			DCoords : new THREE.Vector3(15.25,0.0,1.5),
			LocalInertia : new THREE.Vector3(66.30,861.9,861.9),
			Incidence : 0.0,
			Dihedral : 0.0,
			Area : 84.0,
			Flap : 0
		});


        let In, Di;
        for (const element of this.elements){
            In = THREE.MathUtils.degToRad(element.Incidence);
            Di = THREE.MathUtils.degToRad(element.Dihedral);
            
            element.Normal = new THREE.Vector3(
                Math.sin(In),
                Math.cos(In) * Math.sin(Di),
                Math.cos(In) * Math.cos(Di)
            );

            element.Normal.normalize();
        }

        
        let Mass = 0;
        for (const element of this.elements){
            Mass += element.Mass;
        }

        let Moment = new THREE.Vector3();
        for (const element of this.elements){
            
            let tmp = new THREE.Vector3();
            tmp.copy(element.DCoords);
            tmp.multiplyScalar(element.Mass);

            Moment.add(tmp);
        }

        let CG = new THREE.Vector3();
        CG.copy(Moment);
        CG.divideScalar(Mass);

        for (const element of this.elements){
            element.CGCoords = new THREE.Vector3();
            element.CGCoords.subVectors(element.DCoords, CG);
        }
        
        let Ixx = 0, Iyy = 0, Izz = 0, Ixy = 0, Ixz = 0, Iyz = 0;
        for (const element of this.elements){
         	Ixx += element.LocalInertia.x + element.Mass * (element.CGCoords.y*element.CGCoords.y + element.CGCoords.z*element.CGCoords.z);
            Iyy += element.LocalInertia.y + element.Mass * (element.CGCoords.z*element.CGCoords.z + element.CGCoords.x*element.CGCoords.x);
		    Izz += element.LocalInertia.z + element.Mass * (element.CGCoords.x*element.CGCoords.x + element.CGCoords.y*element.CGCoords.y);
            Ixy += element.Mass * (element.CGCoords.x * element.CGCoords.y);
            Ixz += element.Mass * (element.CGCoords.x * element.CGCoords.z);
            Iyz += element.Mass * (element.CGCoords.y * element.CGCoords.z);
        }

        this.Inertia.set( Ixx, -Ixy, -Ixz,
                         -Ixy,  Iyy, -Iyz,
                         -Ixz, -Iyz,  Izz);
        
        this.InverseInertia.copy(this.Inertia);
        this.InverseInertia.invert();
        this.Mass = Mass;
	}

    _liftCoeff(angle, flaps){

        let clf0 = [ -0.54,-0.2, 0.2, 0.57, 0.92, 1.21, 1.43, 1.4, 1.0];
        let clfd = [  0.0,  0.45, 0.85, 1.02, 1.39, 1.65, 1.75, 1.38, 1.17];
        let clfu = [ -0.74,-0.4, 0.0, 0.27, 0.63, 0.92, 1.03, 1.1, 0.78];
        let a	  = [ -8.0, -4.0, 0.0, 4.0, 8.0, 12.0, 16.0, 20.0, 24.0];

        let cl = 0;
        for (let i=0; i<8; i++){
            if((a[i] <= angle) && (a[i+1] > angle)){
                switch(flaps){
                    case 0:// flaps not deflected
                        cl = clf0[i] - (a[i] - angle) * (clf0[i] - clf0[i+1]) / (a[i] - a[i+1]);
                        break;
                    case -1: // flaps down
                        cl = clfd[i] - (a[i] - angle) * (clfd[i] - clfd[i+1]) / (a[i] - a[i+1]);
                        break;
                    case 1: // flaps up
                        cl = clfu[i] - (a[i] - angle) * (clfu[i] - clfu[i+1]) / (a[i] - a[i+1]);
                        break;
                }
                break;
            }
        }
        return cl;
    }

    _dragCoeff(angle, flaps){

        let cdf0 = [0.01, 0.0074, 0.004, 0.009, 0.013, 0.023, 0.05, 0.12, 0.21];
        let cdfd = [0.0065, 0.0043, 0.0055, 0.0153, 0.0221, 0.0391, 0.1, 0.195, 0.3];
        let cdfu = [0.005, 0.0043, 0.0055, 0.02601, 0.03757, 0.06647, 0.13, 0.18, 0.25];
        let a	 = [-8.0, -4.0, 0.0, 4.0, 8.0, 12.0, 16.0, 20.0, 24.0];

        let cd = 0.75;
        for (let i = 0; i<8; i++)
        {
            if( (a[i] <= angle) && (a[i+1] > angle) ){
                let no_flaps = cdf0[i] - (a[i] - angle) * (cdf0[i] - cdf0[i+1]) / (a[i] - a[i+1]);
                let t = Math.abs(flaps);

                if (flaps < 0){ // flaps down
                    let flap_down = cdfd[i] - (a[i] - angle) * (cdfd[i] - cdfd[i+1]) / (a[i] - a[i+1]);
                    cd = Math.lerp(no_flaps, flap_down, t);
                } else {
                    let flap_up = cdfu[i] - (a[i] - angle) * (cdfu[i] - cdfu[i+1]) / (a[i] - a[i+1]);
                    cd = THREE.MathUtils.lerp(no_flaps, flap_up, t);
                }
            }
        }

        return cd;
    }

    _rudderLiftCoeff(angle){
        let clf0 = [0.16, 0.456, 0.736, 0.968, 1.144, 1.12, 0.8 ];
        let a = [0.0, 4.0, 8.0, 12.0, 16.0, 20.0, 24.0];
        let aa = Math.abs(angle);

        let cl = 0;
        for (let i=0; i<6; i++){
            if( (a[i] <= aa) && (a[i+1] > aa) ){
                cl = clf0[i] - (a[i] - aa) * (clf0[i] - clf0[i+1]) / (a[i] - a[i+1]);
                if (angle < 0) cl = -cl;
                break;
            }
        }
        return cl;
    }

    _rudderDragCoeff(angle){
        let cdf0 = [0.0032, 0.0072, 0.0104, 0.0184, 0.04, 0.096, 0.168 ];
        let a = [ 0.0, 4.0, 8.0, 12.0, 16.0, 20.0, 24.0 ];
       	let aa = Math.abs(angle);

        let cd = 0.75;
        for (let i=0; i<6; i++){
            if( (a[i] <= aa) && (a[i+1] > aa) ){
                cd = cdf0[i] - (a[i] - aa) * (cdf0[i] - cdf0[i+1]) / (a[i] - a[i+1]);
                break;
            }
        }
        return cd;
    }

    _init(){
        
        this.Forces.set(500, 0, 0);
        this.ThrustForce = 500;
        this.Stalling = false;

        this.Position.set(
            this.gameObject.position.x,
            this.gameObject.position.z,
            this.gameObject.position.y
        );

        this.Velocity.set(
            this.gameObject.velocity.x,
            this.gameObject.velocity.z,
            this.gameObject.velocity.y
        );
            
        this._calcMassProperties();
    }

    _calcLoads(){
        let Fb = new THREE.Vector3();
        let Mb = new THREE.Vector3();

        this.Forces.set(0,0,0);
        this.Moments.set(0,0,0);

        this.Thrust.set(1,0,0);
        this.Thrust.multiplyScalar(this.ThrustForce);

        let localVelocity = new THREE.Vector3();
        let localSpeed = 0;
        let dragVector = new THREE.Vector3();
        let liftVector = new THREE.Vector3();
        let Resultant  = new THREE.Vector3();
        let Stalling = false;
        let attackAngle = 0;
        let tmp;
        let vtmp = new THREE.Vector3();

        for (let i = 0; i < 7; i++){
            const element = this.elements[i];

            if (i == 6){ // rudder
                let In, Di;
                In = THREE.MathUtils.degToRad(element.Incidence);
                Di = THREE.MathUtils.degToRad(element.Dihedral);
                element.Normal.set(
                    Math.sin(In),
                    Math.cos(In) * Math.sin(Di),
                    Math.cos(In) * Math.cos(Di)
                );
                element.Normal.normalize();
                
                //console.log(`In: ${In}, Di: ${Di}`)
            }

            
            vtmp.crossVectors(this.AngularVelocity, element.CGCoords);
            localVelocity.addVectors(this.VelocityBody, vtmp);

            localSpeed = localVelocity.length();
            console.log(`speed ${localSpeed}`)

            console.log(dragVector)
            
            if (localSpeed > 1){
                dragVector.copy(localVelocity);
                dragVector.negate();
                dragVector.divideScalar(localSpeed);
            }


            let c = new THREE.Vector3();
            c.crossVectors(dragVector, element.Normal);
            liftVector.crossVectors(c, dragVector);

            tmp = liftVector.length();
            liftVector.normalize();

            tmp = dragVector.dot(element.Normal)
            if (tmp >  1) tmp =  1;
            if (tmp < -1) tmp = -1;

            attackAngle = THREE.MathUtils.radToDeg(Math.asin(tmp));
            console.log(attackAngle)
            tmp = 0.5 * 0.001225 * localSpeed*localSpeed * element.Area;

            let t = new THREE.Vector3();

            if (i == 6) {
                t.copy(liftVector);
                t.multiplyScalar(this._rudderLiftCoeff(attackAngle));
                Resultant.add(t);

                t.copy(dragVector);
                t.multiplyScalar(this._rudderDragCoeff(attackAngle));
                Resultant.add(t);
                
                Resultant.multiplyScalar(tmp);

            } else {
                t.copy(liftVector);
                t.multiplyScalar(this._liftCoeff(attackAngle, element.Flap));
                Resultant.add(t);

                t.copy(dragVector);
                t.multiplyScalar(this._dragCoeff(attackAngle, element.Flap));
                Resultant.add(t);
                
                Resultant.multiplyScalar(tmp);
            }

            if (i <= 0){
                if (this._liftCoeff(attackAngle, element.Flap) == 0)
                    Stalling = true;
            }

            console.log(`Fb: ${Fb.x}, ${Fb.y}, ${Fb.z}`)

            Fb.add(Resultant);
            vtmp.crossVectors(element.CGCoords, Resultant);
            Mb.add(vtmp);
        }

        
        Fb.add(this.Thrust);
        this.Forces.copy(Fb);
        this.Forces.applyQuaternion(this.Orientation);
        this.Moments.add(Mb);
        

    }

    update(dt){

        this.Position.set(
            this.gameObject.position.x,
            this.gameObject.position.z,
            this.gameObject.position.y
        );

        this.Velocity.set(
            this.gameObject.velocity.x,
            this.gameObject.velocity.z,
            this.gameObject.velocity.y
        );

        //this._calcLoads();
        //this.debug.innerText = `${this.Forces.x},${this.Forces.y},${this.Forces.z}`;
        
        // caclulate translation
        //let Ae = this.Forces.clone();
        //Ae.divideScalar(this.Mass);
        //Ae.multiplyScalar(dt);
        //this.Velocity.add(Ae);
        //let velo = this.Velocity.clone();
        //velo.multiplyScalar(dt);
        //this.Position.add(velo);
        

        //console.log(this.Position)

        // calculate rotation
        //let t1 = this.AngularVelocity.clone();
        //t1.applyMatrix3(this.Inertia);
        //let t2 = new THREE.Vector3();
        //t2.crossVectors(this.AngularVelocity, t1);
        //let t3 = this.Moments.clone();
        //t3.sub(t2);
        //t3.applyMatrix3(this.InverseInertia);
        //t3.multiplyScalar(dt);
        //this.AngularVelocity.add(t3);
        //let rot = new THREE.Quaternion();

        
        this.gameObject.position.set(
            this.Position.x,
            this.Position.z,
            this.Position.y
        );

        this.gameObject.velocity.set(
            this.Velocity.x,
            this.Velocity.z,
            this.Velocity.y
        );
        
    }
}

