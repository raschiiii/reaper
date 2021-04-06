import * as THREE from './three/build/three.module.js';
import { Component } from "./components.js";

export class Sensor extends Component {
    constructor(gameObject, camera){
        super(gameObject);

        this._camera = camera;
        this._camera.position.x += 0.9;
        this._camera.position.y -= 0.2;
        this.gameObject.transform.add(this._camera);

        this._raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0,-1,0));

        this._track  = true;
        this._target = new THREE.Vector3(0,-5,0);

        this.gameObject.subscribe("sensor", (e) => {
            console.log(e);
        })
        
        document.addEventListener('keydown', (e) => {
            switch(e.keyCode){
                case 76: // l
                    if (!this._track){
                        this.laserTrack();
                    }
                    this._track = !this._track;
                    break;

                case 38: // arrow up
                    this._camera.rotateX(0.1);
                    //this._camera.rotateOnWorldAxis(new THREE.Vector3(1,0,0), 0.1)
                    break;

                case 40: // arrow down
                    this._camera.rotateX(-0.1);
                    //this._camera.rotateOnWorldAxis(new THREE.Vector3(1,0,0), -0.1)
                    break;
            }
        }, false);

    }

    laserTrack(){
        console.log("intersects")
        
        let pos = new THREE.Vector3();
        this._camera.getWorldPosition(pos);

        let dir = new THREE.Vector3(1,0,0);
        let q = new THREE.Quaternion();
        this._camera.getWorldQuaternion(q);
        dir.applyQuaternion(q);

        this._raycaster.set(pos, dir);
        const intersects = this._raycaster.intersectObjects(this.gameObject.root.children, true);
        console.log(intersects);
    }

    update(dt){
        //if (this._track){
        //    this._camera.lookAt(this._target);
        //}
    }
}