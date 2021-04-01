import * as THREE from './three/build/three.module.js';
import { OrbitControls } from './three/examples/jsm/controls/OrbitControls.js';

import { Component } from './components.js';

export class OrbitCamera extends Component {
    constructor(gameObject, camera){
        super(gameObject);
        this.camera = camera;

        this.oldPos = new THREE.Vector3();
        this.moved  = new THREE.Vector3();
        
        this.oldPos.copy(this.gameObject.position);
        this.camera.position.set(
            this.gameObject.position.x,
            this.gameObject.position.y,
            this.gameObject.position.z + 5
        );
       
        this.controls = new OrbitControls(this.camera, document.querySelector('#canvas'));
        this.controls.target.copy(this.gameObject.position);
        this.controls.update();
    }

    update(dt){
        this.moved.subVectors(this.gameObject.position, this.oldPos);
        this.oldPos.copy(this.gameObject.position);

        this.camera.position.add(this.moved);
        
        this.controls.target.copy(this.gameObject.position);
        this.controls.update();
    }

    destroy(){
        this.controls.dispose();
    }
}

export class OrbitViewManager {
    constructor(goa, camera){
        this.goa  = goa;
        this.ao = 0;
        this.camera = camera;
        document.addEventListener('keydown', (e) => this._onKeyDown(e), false);
    }

    _onKeyDown(event){
        switch (event.keyCode) {
            case 68:  // d
                const n = this.goa.array.length;
                const old = this.goa.array[this.ao];
                old.removeComponent("OrbitCamera");
                this.ao = (this.ao + 1) % n; 
                this.setActive(this.ao)
                break;
            
        } 
    }   

    setActive(n){
        let gameObject = this.goa.array[n];
        if (gameObject == undefined) return;
        this.ao = n;
        if (!gameObject.getComponent("OrbitCamera")){
            console.log("add")
            gameObject.addComponent(new OrbitCamera(gameObject, this.camera))
        }
    }
}

