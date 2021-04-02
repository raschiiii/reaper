import * as THREE from './three/build/three.module.js';

import { Component } from './components.js';

// https://gamedevelopment.tutsplus.com/tutorials/how-to-create-a-custom-2d-physics-engine-the-basics-and-impulse-resolution--gamedev-6331 


export class BasicPhysics extends Component {
	constructor(gameObject, params){
		super(gameObject);
        this._gravity = 9.81;
        
        this.gameObject.subscribe("collision", (event) => {
            let x = event.depth[0]; let y = event.depth[1]; let z = event.depth[2];

            if (Math.abs(x) > Math.abs(y) && Math.abs(z) > Math.abs(y)){
                this.gameObject.position.setY(this.gameObject.position.y-y)
                this.gameObject.velocity.setY(0)
            }

            if (Math.abs(y) > Math.abs(x) && Math.abs(z) > Math.abs(x)){
                this.gameObject.position.setX(this.gameObject.position.x-x)  
                this.gameObject.velocity.setX(0)
            }

            if (Math.abs(y) > Math.abs(z) && Math.abs(x) > Math.abs(z)){
                this.gameObject.position.setZ(this.gameObject.position.z-z)  
                this.gameObject.velocity.setZ(0)
            }
        });
    }

	update(dt){
		this.gameObject.position.add(this.gameObject.velocity.clone().multiplyScalar(dt))
        this.gameObject.velocity.y -= this._gravity * dt; // gravity
	}
}

