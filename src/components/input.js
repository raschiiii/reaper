import * as THREE from "../three/build/three.module.js";
import { OrbitControls } from "../three/examples/jsm/controls/OrbitControls.js";

import { Component } from "../engine/component.js";

// only the active GameObject gets User input
export class PlayerInput extends Component {
    constructor(gameObject) {
        super(gameObject);

        console.log("add EventListeners");

        this._screen = document.querySelector("#screen");
        this._canvas = document.querySelector("#canvas");

        this._keyDown = (event) => {
            this.gameObject.publish("keydown", event);
        };

        this._keyUp = (event) => {
            this.gameObject.publish("keyup", event);
        };

        this._mousemove = (event) => {
            event.preventDefault();
            this.gameObject.publish("pointermove", event);
        };

        this._wheel = (event) => {
            this.gameObject.publish("wheel", event);
        };

        this._mouseUp = (event) => {
            event.preventDefault();
            //console.log("pointerup");
            this.gameObject.publish("pointerup", event, false);
        };

        this._mouseDown = (event) => {
            event.preventDefault();
            //console.log("pointerdown");
            this.gameObject.publish("pointerdown", event, false);
        };

        document.addEventListener("keydown", this._keyDown, false);
        document.addEventListener("keyup", this._keyUp, false);

        this._screen.addEventListener("pointermove", this._mousemove, false);
        this._screen.addEventListener("pointerdown", this._mouseDown, false);
        this._screen.addEventListener("pointerup", this._mouseUp, false);

        this._screen.addEventListener("wheel", this._wheel, false);
    }

    destroy() {
        document.removeEventListener("keydown", this._keyDown, false);
        document.removeEventListener("keyup", this._keyUp, false);

        this._screen.removeEventListener("pointermove", this._mousemove, false);
        this._screen.removeEventListener("pointerdown", this._mouseDown, false);
        this._screen.removeEventListener("pointerup", this._mouseUp, false);

        this._screen.removeEventListener("wheel", this._wheel, false);
    }
}
