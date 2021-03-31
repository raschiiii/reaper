import * as THREE from './three/build/three.module.js';
import { OrbitControls } from './three/examples/jsm/controls/OrbitControls.js';

import { Component } from './components.js';

export class JoystickInput extends Component {
    constructor(gameObject){
        super(gameObject);
    }
}

export class OrbitCamera extends Component {
    constructor(gameObject, camera){
        super(gameObject);
        this.camera = camera;

        this.oldPos = new THREE.Vector3();
        this.trans = new THREE.Vector3();
        this.oldPos.copy(this.gameObject.position);

        this.camera.position.copy(this.gameObject.position)
        this.camera.position.z += 5;
        this.controls = new OrbitControls(this.camera, document.querySelector('#canvas'));
        this.controls.update();
    }

    update(dt){

        this.trans.subVectors(this.gameObject.position, this.oldPos);
        this.oldPos.copy(this.gameObject.position);

        if (this.trans.length() > 0.1) this.camera.position.add(this.trans);
        this.controls.target.copy(this.gameObject.position);

        this.controls.update();
    }
}

export class ViewManager {
    constructor(goa, camera){
        this.goa  = goa;
        this.activeObject = 0;

        this.camera = camera;

        document.addEventListener('keydown',   (e) => this._onKeyDown(e),     false);
        document.addEventListener('keyup',     (e) => this._onKeyUp(e),       false);
    }

    _onKeyDown(event){
        switch (event.keyCode) {
            case 68:  // d
                
                let n = this.goa.array.length;
                //console.log(n)

                const old = this.goa.array[this.activeObject];
                old.removeComponent("OrbitCamera");

                this.activeObject = (this.activeObject + 1) % n; 
                
                let gameObject = this.goa.array[this.activeObject];
                gameObject.addComponent(new OrbitCamera(gameObject, this.camera))
                

                console.log(old)
                console.log(gameObject)

                break;
            }
    }   

    _onKeyUp(event){

    }

    setActive(n){
        let gameObject = this.goa.array[n];
        if (gameObject == undefined) return;
        this.activeObject = n;
        if (!gameObject.getComponent("OrbitCamera")){
            gameObject.addComponent(new OrbitCamera(gameObject, this.camera))
        }
    }
}

