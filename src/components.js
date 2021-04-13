import * as THREE from "./three/build/three.module.js";
import { GLTFLoader } from "./three/examples/jsm/loaders/GLTFLoader.js";

import { Physics } from "./physics/physics.js";
import { Component } from "./component.js";
import { AABB } from "./collision.js";
import {
    SmokeEmitter,
    SmokeTrailEmitter,
} from "./particles/particle-emitter.js";

// allows a gameObject to subscribe to the events of another gameobject
export class EventRelay extends Component {
    constructor(gameObject, hostObject, eventTypes) {
        super(gameObject);

        this.hostObject = hostObject;

        for (let eventType of eventTypes) {
            this.hostObject.subscribe(eventType, (event) => {
                this.gameObject.publish(eventType, event);
            });
        }
    }
}

// listens to collisions and destroys the GameObject
export class Explosive extends Component {
    constructor(gameObject) {
        super(gameObject);

        let hasExploded = false;

        this.gameObject.subscribe("collision", () => {
            if (!hasExploded) {
                hasExploded = true;
                this.gameObject.lifetime = 10;

                this.gameObject.removeComponent(AABB);
                this.gameObject.removeComponent(Physics);
                this.gameObject.removeComponent(SmokeTrailEmitter);

                this.gameObject.addComponent(new SmokeEmitter(this.gameObject));
            }
        });
    }
}

export class Sound extends Component {
    constructor(gameObject, listener, buffer, params) {
        super(gameObject);
        this.sound = new THREE.PositionalAudio(listener);
        this.sound.setBuffer(buffer);
        this.sound.setLoop(params.loop);
        this.sound.setVolume(params.volume);
        this.sound.setRefDistance(20);
        this.gameObject.transform.add(this.sound);
        if (params.autoplay) this.sound.play();

        this.gameObject.subscribe("paused", (event) => {
            if (event.paused) {
                this.sound.pause();
            } else {
                this.sound.play();
            }
        });
    }
}
