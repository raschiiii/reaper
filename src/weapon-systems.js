import * as THREE from './three/build/three.module.js';
import { Component } from './components.js';
import { BasicPhysics } from './physics/basic-physics.js';
import { Physics } from './physics/physics.js';
import { GravityODE } from './physics/gravity-ode.js';

export class MissileFireControl extends Component {
    constructor(gameObject, id){
        super(gameObject);

        this.id = id;

        this.gameObject.subscribe("fire", (e) => {

            if (e.hardpoint == this.id){
                console.log("firing missile")
                console.log(e);

                let tmp = new THREE.Vector3();

                this.gameObject.transform.getWorldPosition(tmp);

                const transform = this.gameObject.transform;
                const parent = transform.parent;
                const scene = this.gameObject.root;

                parent.remove(transform);
                scene.add(transform)
                this.gameObject.position.copy(e.position);
                this.gameObject.velocity.copy(e.velocity);
                
                this.gameObject.addComponent(new Physics(this.gameObject, new GravityODE(this.gameObject)))
            }
        })
    }
}