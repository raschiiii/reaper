import * as THREE from './three/build/three.module.js';
import { Component } from './components.js';

import { OrbitControls } from './three/examples/jsm/controls/OrbitControls.js';

export class OrbitCamera extends Component {
    constructor(gameObject, camera){
        super(gameObject);
        this.camera = camera;

        this.oldPos   = new THREE.Vector3();
        this.moved    = new THREE.Vector3();
        this.worldPos = new THREE.Vector3();
       
        this.gameObject.transform.getWorldPosition(this.worldPos);

        this.oldPos.copy(this.worldPos);
        this.camera.position.set(
            this.worldPos.x - 1,
            this.worldPos.y + 1,
            this.worldPos.z - 1
        );

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
        this._goa  = goa;
        this._activeIndex = 0;
        this.activeGameObject = null;
        this._camera = camera;
    }

    toggle(){
        const n = this._goa.array.length;
        const old = this._goa.array[this._activeIndex];
        old.removeComponent("OrbitCamera");
        this._activeIndex = (this._activeIndex + 1) % n; 
        this.setActive(this._activeIndex)
    }

    setActive(n){
        let gameObject = this._goa.array[n];
        
        if (gameObject == undefined) return;

        this.activeGameObject = gameObject.id;
        this._activeIndex = n;
        
        if (!gameObject.getComponent("OrbitCamera")){
            gameObject.addComponent(new OrbitCamera(gameObject, this._camera))
        }
    }
}

