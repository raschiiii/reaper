import * as THREE from './three/build/three.module.js';
import { Component } from './components.js';

export class AABB extends Component {
    constructor(gameObject, size = new THREE.Vector3(1,1,1)){
        super(gameObject);
        
        this.box = new THREE.Box3(
            new THREE.Vector3(-size.x/2, -size.y/2, -size.z/2), 
            new THREE.Vector3( size.x/2,  size.y/2,  size.z/2)
        );

        this._offset = new THREE.Vector3(0,0,0);
        this._center = new THREE.Vector3(0,0,0);
        this.update(0);

        //let geometry = new THREE.BoxGeometry(size.x, size.y, size.z)
		//let material = new THREE.MeshBasicMaterial( {color: "#dadada", wireframe: true, transparent: true})
		//this.gameObject.transform.add(new THREE.Mesh(geometry, material))
    }

    get min(){
        return this.box.min;
    }

    get max(){
        return this.box.max;
    }

    update(dt){
        this.box.getCenter(this._center);
        this._offset.subVectors(this.gameObject.position, this._center);
        this.box.translate(this._offset)
    }

    collide(aabb){
		if (aabb.box.intersectsBox(this.box)){
			let d0, d1;
            d0 = this.box.max.x  - aabb.box.min.x
            d1 = aabb.box.max.x - this.box.min.x
            let x = (d0 < d1 ? d0 : -d1)

            d0 = this.box.max.y  - aabb.box.min.y
            d1 = aabb.box.max.y - this.box.min.y
            let y = (d0 < d1 ? d0 : -d1)

            d0 = this.box.max.z  - aabb.box.min.z
            d1 = aabb.box.max.z - this.box.min.z
            let z = (d0 < d1 ? d0 : -d1)

            /*
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
            */

            this.gameObject.publish("collision", {'depth': [x,y,z]});
            
            return true;
		} else {
			return false;
		}

    }

}
