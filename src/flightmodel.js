import * as THREE from './three/build/three.module.js';
//import { MathUtils } from './0'

import { Component } from './components.js';

export class FlightModel extends Component {
    constructor(gameObject){
        super(gameObject);
        this.elements = []

        this.Inertia = new THREE.Matrix3();
        this.InverseInertia = new THREE.Matrix3();
        this.Mass = 0;
        this.Thrust = new THREE.Vector3();
        this.Speed = 0;
        this.AngularVelocity = new THREE.Vector3();
        this.Forces = new THREE.Vector3();
        this.Moments = new THREE.Vector3();
        this.ThrustForce = 100;
        this.VelocityBody = new THREE.Vector3();
        this.Orientation = new THREE.Quaternion();


        this._calcMassProperties();
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
        
        console.log(this.Inertia);
        
        this.Mass = Mass;

	}

    _liftCoeff(angle, flaps){
        return 0;
    }

    _dragCoeff(angle, flaps){
        return 0;
    }

    _rudderLiftCoeff(angle){
        return 0;
    }

    _rudderDragCoeff(angle){

        return 0;
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

            if (i == 6){
                let In, Di;
                In = THREE.MathUtils.degToRad(this.elements[i].Incidence);
                Di = THREE.MathUtils.degToRad(this.elements[i].Dihedral);
                this.elements[i].Normal.set(
                    Math.sin(In),
                    Math.cos(In) * Math.sin(Di),
                    Math.cos(In) * Math.cos(Di)
                );
                this.elements[i].Normal.normalize();
            }
            
            vtmp.crossVectors(this.AngularVelocity, element.CGCoords);
            localVelocity.addVectors(this.VelocityBody, vtmp);

            localSpeed = localVelocity.length();

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

            tmp.multiplyVectors(dragVector, element.Normal);
            if (tmp >  1) tmp =  1;
            if (tmp < -1) tmp = -1;

            attackAngle = THREE.MathUtils.radToDeg(Math.asin(tmp));
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

            Fb.add(Resultant);
            vtmp.crossVectors(element.CGCoords, Resultant);
            Mb.add(vtmp);
        }

        /*
        Fb.add(this.Thrust);
        this.Forces.copy(Fb);
        this.Forces.applyQuaternion(this.Orientation);
        this.Forces.z += -9.81 * this.Mass;
        this.Moments.add(Mb);
        */

    }

    update(dt){
        //this._calcLoads();
    }
}

