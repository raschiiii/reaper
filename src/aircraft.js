import * as THREE from './three/build/three.module.js';

import { Component } from "./components.js";


export class Sensor extends Component {
    constructor(gameObject, camera){
        super(gameObject);
        this._camera = camera;

        this._camera.position.x += 5;
        this.gameObject.transform.add(this._camera)
    }

    update(dt){
        this._camera.lookAt(new THREE.Vector3());
    }
}