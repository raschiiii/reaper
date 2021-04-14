import * as THREE from "../three/build/three.module.js";
import { OrbitControls } from "../three/examples/jsm/controls/OrbitControls.js";

import { Component } from "../engine/component.js";

// only the active GameObject gets User input
export class PlayerInput extends Component {
    constructor(gameObject) {
        super(gameObject);

        console.log("add EventListeners");

        this._canvas = document.querySelector("#canvas");

        this._keyDown = (event) => {
            this.gameObject.publish("keydown", event);
        };

        this._keyUp = (event) => {
            this.gameObject.publish("keyup", event);
        };

        this._mousemove = (event) => {
            this.gameObject.publish("mousemove", event);
        };

        this._wheel = (event) => {
            console.log("wheel");
            this.gameObject.publish("wheel", event);
        };

        document.addEventListener("keydown", this._keyDown, false);
        document.addEventListener("keyup", this._keyUp, false);
        document.addEventListener("mousemove", this._mousemove, false);
        this._canvas.addEventListener("wheel", this._wheel);
    }

    destroy() {
        console.log("remove EventListeners")
        document.removeEventListener("keydown", this._keyDown, false);
        document.removeEventListener("keyup", this._keyUp, false);
        document.removeEventListener("mousemove", this._mousemove, false);
        this._canvas.removeEventListener("wheel", this._wheel);
    }
}
