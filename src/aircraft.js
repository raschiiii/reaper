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
            console.log(e);
        })
        
        document.addEventListener('keydown', (e) => {
            switch(e.keyCode){
                case 76: // l
                    this.laserTrack();
                    //this._track = true;
                    break;

                case 75: // k
                    this._track = false;
                    break;

                case 38: // arrow up
                    this._sensorRotation.x += 0.1;
                    break;

                case 40: // arrow down
                    this._sensorRotation.x -= 0.1;
                    break;

                case 37: // arrow left
                    this._sensorRotation.y += 0.1;
                    break;

                case 39: // arrow right
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

        //this._raycaster.set(this._camera.position, new THREE.Vector3(0,-1,0));
        this._raycaster.set(this._camera.position, dir);
        
        const intersects = this._raycaster.intersectObjects(this.gameObject.root.children, true);
        //console.log(intersects);

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
    constructor(gameObject, listener, params){
        super(gameObject);
        (async () => {
            const audioLoader = new THREE.AudioLoader();

            const buffer = await new Promise((resolve, reject) => {
                audioLoader.load(params.path, data => resolve(data), null, reject);
            });

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


        })();
    }
}