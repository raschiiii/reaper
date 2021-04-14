import * as THREE from "../three/build/three.module.js";
import { OrbitControls } from "../three/examples/jsm/controls/OrbitControls.js";

import { Component } from "../engine/component.js";

// only the active GameObject gets User input
export class PlayerInput extends Component {
    constructor(gameObject) {
        super(gameObject);

        console.log("add EventListeners");

        this._screen = document.querySelector("#screen");
        this._canvas = document.querySelector('#canvas');

        this._keyDown = (event) => {
            this.gameObject.publish("keydown", event);
        };

        this._keyUp = (event) => {
            this.gameObject.publish("keyup", event);
        };

        this._mousemove = (event) => {
            this.gameObject.publish("pointermove", event);
        };

        this._wheel = (event) => {
            this.gameObject.publish("wheel", event);
        };

        this._mouseUp = (event) => {
            this.gameObject.publish("pointerup", event);
        };

        this._mouseDown = (event) => {
            this.gameObject.publish("pointerdown", event);
        };

        document.addEventListener("keydown", this._keyDown, false);
        document.addEventListener("keyup", this._keyUp, false);
        
        document.body.addEventListener("pointermove", this._mousemove, false);
        document.body.addEventListener("pointerdown", this._mouseDown, false);
        document.body.addEventListener("pointerup", this._mouseUp, false);

        this._screen.addEventListener("wheel", this._wheel, false);
    }

    destroy() {
        document.removeEventListener("keydown", this._keyDown, false);
        document.removeEventListener("keyup", this._keyUp, false);
        
        document.body.removeEventListener("pointermove", this._mousemove, false);
        document.body.removeEventListener("pointerdown", this._mouseDown, false);
        document.body.removeEventListener("pointerup", this._mouseUp, false);

        this._screen.removeEventListener("wheel", this._wheel, false);
    }
}
