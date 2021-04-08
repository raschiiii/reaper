import * as THREE from './three/build/three.module.js';
import { Component } from "./components.js";

export class Sensor extends Component {
    constructor(gameObject, camera){
        super(gameObject);

        this._camera = camera;
        
        // this.helper = new THREE.ArrowHelper(new THREE.Vector3(1,0,0), new THREE.Vector3(), 5, 0xff0000);
        // this.gameObject.root.add(this.helper);

        this._sensorRotation = new THREE.Euler(0, -Math.PI/2, 0, "YZX");
        this._camera.rotation.copy(this._sensorRotation);

        this._cameraDummy = new THREE.Object3D();
        this._cameraDummy.position.x += 0.9;
        this._cameraDummy.position.y -= 0.2;

        this.gameObject.transform.add(this._cameraDummy);

        this._raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0,-1,0));

        this._track  = false;
        this._target = new THREE.Vector3(0,-5,0);

        this.gameObject.subscribe("sensor", (e) => {
            //console.log(e);
        })
        
        document.addEventListener('keydown', (e) => {
            switch(e.code){
                case "KeyL": // l
                    this.laserTrack();
                    break;

                case "KeyK": // k
                    this._track = false;
                    break;

                case "KeyW": // arrow up
                    this._sensorRotation.x += 0.1;
                    break;

                case "KeyS": // arrow down
                    this._sensorRotation.x -= 0.1;
                    break;

                case "KeyA": // arrow left
                    this._sensorRotation.y += 0.1;
                    break;

                case "KeyD": // arrow right
                    this._sensorRotation.y -= 0.1;
                    break;
            }
        }, false);

    }

    laserTrack(){
        console.log("laser")

        let dir = new THREE.Vector3(0,0,-1);
        dir.applyEuler(this._camera.rotation);
        dir.normalize();

        this._raycaster.set(this._camera.position, dir);
        
        const intersects = this._raycaster.intersectObjects(this.gameObject.root.children, true);

        if (intersects.length > 0){
            this._target.copy(intersects[0].point);
            this._track = true;
        }
        
        //for ( let i = 0; i < intersects.length; i ++ ) {
        //    intersects[ i ].object.material.color.set( 0xff0000 );
        //}
    }

    update(dt){
        let o = new THREE.Vector3();
        this._cameraDummy.getWorldPosition(o);
        this._camera.position.copy(o);
        this._camera.rotation.copy(this._sensorRotation);
         
        if (this._track){
            this._camera.lookAt(this._target);
        }
    }
}

export class Sound extends Component {
    constructor(gameObject, listener, buffer, params){
        super(gameObject);

        this.sound = new THREE.Audio(listener);
        this.sound.setBuffer( buffer );
        this.sound.setLoop( params.loop );
        this.sound.setVolume( params.volume );
        if (params.autoplay) this.sound.play();
        
        this.gameObject.subscribe("paused", (event) => {
            if (event.paused){
                this.sound.pause();
            } else {
                this.sound.play();
            }
        })
    }
}