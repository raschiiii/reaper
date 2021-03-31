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
        this.controls = new OrbitControls(camera, document.querySelector('#canvas'));
    }

    update(dt){
        this.controls.update();
    }
}