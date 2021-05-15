import * as THREE from "three";

import { Component } from "../engine/component.js";
import { Smoke, SmokeTrail } from "./particles.js";

export class ParticleEmitter extends Component {
    constructor(gameObject, smoke) {
        super(gameObject);
        this._smoke = smoke;
    }

    update(dt, params) {
        this.gameObject.transform.getWorldPosition(this._smoke._source);
        this._smoke.update(dt, params.camera);
    }

    destroy() {
        this._smoke.destroy();
    }
}

export class SmokeTrailEmitter extends ParticleEmitter {
    constructor(gameObject) {
        super(gameObject, new SmokeTrail(gameObject.root));
    }
}

export class SmokeEmitter extends ParticleEmitter {
    constructor(gameObject) {
        super(gameObject, new Smoke(gameObject.root));
    }
}

export class DebugEmitter extends ParticleEmitter {
    constructor(gameObject, smoke) {
        super(gameObject, smoke);
    }
}
