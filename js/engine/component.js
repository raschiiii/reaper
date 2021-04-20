import * as THREE from "../three/build/three.module.js";

// base class for all components
export class Component {
    constructor(gameObject) {
        this.gameObject = gameObject;
        this.name = this.constructor.name;
    }
    update(dt, params) {}
    destroy() {}
}
