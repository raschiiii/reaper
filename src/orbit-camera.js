import * as THREE from './three/build/three.module.js';
import { Component } from './components.js';

import { OrbitControls } from './three/examples/jsm/controls/OrbitControls.js';

export class OrbitCamera extends Component {
    constructor(gameObject, camera){
        super(gameObject);
        this.camera = camera;

        this.oldPos = new THREE.Vector3();
        this.moved  = new THREE.Vector3();
        this.worldPos = new THREE.Vector3();
       
        this.gameObject.transform.getWorldPosition(this.worldPos);

        this.oldPos.copy(this.worldPos);
        this.camera.position.set(
            this.worldPos.x - 1,
            this.worldPos.y + 1,
            this.worldPos.z - 1
        );

        //this.controls = new OrbitControls(this.camera, document.querySelector('#canvas'));
        this.controls = new OrbitControls(this.camera, document.querySelector('#screen'));
        this.controls.target.copy(this.gameObject.position);
        this.controls.update();
    }

    update(dt){
        this.gameObject.transform.getWorldPosition(this.worldPos);
        
        this.moved.subVectors(this.worldPos, this.oldPos);
        this.oldPos.copy(this.worldPos);

        this.camera.position.add(this.moved);
        
        this.controls.target.copy(this.worldPos);
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
        //document.addEventListener('keydown', (e) => this._onKeyDown(e), false);
    }

    _onKeyDown(event){
        switch (event.keyCode) {
            case 50:  // 2
                const n = this.goa.array.length;
                const old = this.goa.array[this.ao];
                old.removeComponent("OrbitCamera");
                this.ao = (this.ao + 1) % n; 
                this.setActive(this.ao)
                break;
            
        } 
    }   

    toggle(){
        const n = this.goa.array.length;
        const old = this.goa.array[this.ao];
        old.removeComponent("OrbitCamera");
        this.ao = (this.ao + 1) % n; 
        this.setActive(this.ao)
    }

    setActive(n){
        let gameObject = this.goa.array[n];
        if (gameObject == undefined) return;
        this.ao = n;
        if (!gameObject.getComponent("OrbitCamera")){
            gameObject.addComponent(new OrbitCamera(gameObject, this.camera))
        }
    }
}

