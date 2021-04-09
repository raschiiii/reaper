import * as THREE from './three/build/three.module.js';
import { GLTFLoader } from './three/examples/jsm/loaders/GLTFLoader.js';

import { Smoke, SmokeEmitter } from './particles.js';
import { Physics } from './physics/physics.js';
import { Component } from './components.js';

// allows a gameObject to subscribe to the events of another gameobject
export class EventRelay extends Component {
    constructor(gameObject, hostObject, eventTypes){
        super(gameObject);

        this.hostObject = hostObject;
        
        for (let eventType of eventTypes){
            this.hostObject.subscribe(eventType, (event) => {
                this.gameObject.publish(eventType, event);
            });
        }
    }
}

// listens to collisions and destroys the GameObject
export class Explosive extends Component {
    constructor(gameObject){
        super(gameObject);

        let hasExploded = false;

        this.gameObject.subscribe("collision", () => {
            if (!hasExploded){
                hasExploded = true;
                this.gameObject.lifetime = 0;
                const physics = this.gameObject.getComponent(Physics.name);
                if (physics) this.gameObject.removeComponent(Physics.name);

                const smoke = this.gameObject.getComponent("SmokeEmitter");
                if (smoke) this.gameObject.removeComponent("SmokeEmitter");

            }
        });
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