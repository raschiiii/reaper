import { Component } from './components.js';
import * as THREE from './three/build/three.module.js';

export class LocalAxis extends Component {
    constructor(gameObject){
        super(gameObject);

        const origin = new THREE.Vector3( 0, 0, 0 );
        const length = 5;
        const hex = 0xffff00;
        
        this.gameObject.transform.add( new THREE.ArrowHelper( new THREE.Vector3(1,0,0), origin, length, 0xff0000 ) );
        this.gameObject.transform.add( new THREE.ArrowHelper( new THREE.Vector3(0,1,0), origin, length, 0x00ff00 ) );
        this.gameObject.transform.add( new THREE.ArrowHelper( new THREE.Vector3(0,0,1), origin, length, 0x0000ff ) );
    }
}