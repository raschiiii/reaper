import { Component } from "../engine/component.js";

// only the active GameObject gets User input
export class PlayerInput extends Component {
    constructor(gameObject) {
        super(gameObject);

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
            this.gameObject.publish("pointerup", event);
        };

        this._mouseDown = (event) => {
            event.preventDefault();
            this.gameObject.publish("pointerdown", event);
        };

        document.addEventListener("keydown", this._keyDown, false);
        document.addEventListener("keyup", this._keyUp, false);
        document.addEventListener("pointermove", this._mousemove, false);
        document.addEventListener("pointerdown", this._mouseDown, false);
        document.addEventListener("pointerup", this._mouseUp, false);
        document.addEventListener("wheel", this._wheel, false);
    }

    destroy() {
        document.removeEventListener("keydown", this._keyDown, false);
        document.removeEventListener("keyup", this._keyUp, false);
        document.removeEventListener("pointermove", this._mousemove, false);
        document.removeEventListener("pointerdown", this._mouseDown, false);
        document.removeEventListener("pointerup", this._mouseUp, false);
        document.removeEventListener("wheel", this._wheel, false);
    }
}
