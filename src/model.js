import * as THREE from './three/build/three.module.js';
import { Component, SimpleGLTFModel } from './components.js';
import { GLTFLoader } from './three/examples/jsm/loaders/GLTFLoader.js';

export class AirplaneModel extends Component {
    constructor(gameObject, path, params){
        super(gameObject);

        let rotation = params.rotation ? params.rotation : new THREE.Vector3();
        let position = params.position ? params.position : new THREE.Vector3();
        let scale    = params.scale    ? params.scale    : new THREE.Vector3(1,1,1);

        (async () => {
            const loader = new GLTFLoader();
            const gltf = await new Promise((resolve, reject) => {
                loader.load(path, data => resolve(data), null, reject);
            });
            this.model = gltf.scene;
            this.model.position.copy(position);
            this.model.rotateX(rotation.x);
            this.model.rotateY(rotation.y);
            this.model.rotateZ(rotation.z);
            this.model.scale.copy(scale);

            this.model.traverse( function ( object ) {
                if(object.isMesh) object.castShadow = true;
            });

            this.propellor = this.model.children[4];
            //console.log(this.propellor)

            this.gameObject.transform.add(this.model)
        })();
    }

    update(dt){
        if (this.propellor) this.propellor.rotateZ(400.0 * dt)
    }

    destroy(){
		this.model.geometry.dispose()
		this.model.material.dispose()
		this.model.parent.remove(this.model)
	}
}

