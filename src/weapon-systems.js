import * as THREE from './three/build/three.module.js';
import { Component } from './component.js';
import { BasicPhysics } from './physics/basic-physics.js';
import { Physics } from './physics/physics.js';
import { GravityODE } from './physics/gravity-ode.js';
import { Hellfire } from './physics/hellfire.js';
import { SmokeEmitter } from './particles.js';

export class MissileFireControl extends Component {
    constructor(gameObject, id, goa){
        super(gameObject);
        
        this.id  = id;
        this.goa = goa;

        this.gameObject.subscribe("fire", (e) => {
            if (e.hardpoint == this.id){
                
                //console.log("firing missile")
                console.log(e);

                let tmp = new THREE.Vector3();

                const transform = this.gameObject.transform;
                const parent = transform.parent;
                const scene = this.gameObject.root;

                parent.getWorldPosition(tmp);
                
                parent.remove(transform);
                scene.add(transform)
                this.gameObject.position.copy(tmp);
                this.gameObject.velocity.copy(e.velocity);
                
                //this.gameObject.addComponent(new SmokeEmitter(this.gameObject));
                this.gameObject.addComponent(new LaserGuidance(this.gameObject, e.target));
                this.gameObject.addComponent(new Physics(this.gameObject, new Hellfire(this.gameObject)));
                
                this.goa.add(this.gameObject);
            }
        });
    }
}

export class LaserGuidance extends Component {
    constructor(gameObject, target){
        super(gameObject);
        this._target = target;
        
        this._debug         = document.querySelector('#display1');
        this._dirToTarget = new THREE.Vector3();
    }

    _yawAngle(velocity, direction){
        return Math.atan2(direction.z,direction.x) - Math.atan2(velocity.z,velocity.x)
    }

    _pitchAngle(velocity, direction){
        
        let vh = Math.sqrt(vx*vx + vy*vy);

    }

    update(dt){
        if (this._target){
            this._dirToTarget.subVectors(this._target, this.gameObject.position);
            this._dirToTarget.normalize();
            
            let v1 = this.gameObject.velocity.clone();
            v1.normalize();

            let v2 = this._dirToTarget.clone();
            v2.normalize();

            const yawAngle   = this._yawAngle(v1, v2);
            const pitchAngle = this._pitchAngle(v1, v2);

            this._debug.innerText = `${ yawAngle }, ${ pitchAngle }`;
        }


         
    }
}