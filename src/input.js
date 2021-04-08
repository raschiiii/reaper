import * as THREE from './three/build/three.module.js';
import { OrbitControls } from './three/examples/jsm/controls/OrbitControls.js';

import { Component } from './components.js';

export class JoystickInput extends Component {
    constructor(gameObject){
        super(gameObject);
    }
}

export class PilotInput extends Component {
    constructor(gameObject){
        super(gameObject);

        this._target = null;

        this.gameObject.subscribe("laser", (e) => {
            this._target = e.target;
            console.log("got laser target")
        })

        document.addEventListener('keydown', (e) => {
            switch(e.code){
                case "KeyF": 
                    this.gameObject.publish("fire", { 
                        hardpoint: 1, 
                        target: this._target,
                        position: this.gameObject.position,
                        velocity: this.gameObject.velocity
                    });                    
                    break;
            }
        });

        
    }
}

