import * as THREE from "./three/build/three.module.js";
import { Component } from "./engine/component.js";

export class Box extends Component {
    constructor(gameObject, params) {
        super(gameObject);

        let rotation = params.rotation ? params.rotation : new THREE.Vector3();
        let position = params.position ? params.position : new THREE.Vector3();
        let size = params.size ? params.size : new THREE.Vector3(1, 1, 1);
        let castShadow = params.castShadow ? params.castShadow : false;
        let receiveShadow = params.receiveShadow ? params.receiveShadow : false;
        let color = params.color ? params.color : 0xff0000;

        let geometry = new THREE.BoxBufferGeometry(size.x, size.y, size.z);
        let material = new THREE.MeshStandardMaterial({
            color: color,
            flatShading: true,
            emissive: 0xffffff,
            emissiveIntensity: 0,
            roughness: 1.0,
        });

        /*
        const loader = new THREE.TextureLoader();
        let texture = loader.load('./assets/textures/tile3.jpg')
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.magFilter = THREE.NearestFilter;
        const repeats = size.x / 2;
        texture.repeat.set(repeats, repeats);

        let material2 = new THREE.MeshStandardMaterial({ 
            map: texture
        });
        */

        this.model = new THREE.Mesh(geometry, material);

        this.model.castShadow = true;
        this.model.receiveShadow = receiveShadow;

        this.model.rotateX(rotation.x);
        this.model.rotateY(rotation.y);
        this.model.rotateZ(rotation.z);

        this.model.position.copy(position);

        this.gameObject.transform.add(this.model);
    }

    destroy() {
        this.model.geometry.dispose();
        this.model.material.dispose();
        this.model.parent.remove(this.model);
    }
}
