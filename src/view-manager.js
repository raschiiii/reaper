import * as THREE from "./three/build/three.module.js";
import { Component } from "./engine/component.js";

import { OrbitControls } from "./three/examples/jsm/controls/OrbitControls.js";
import { PlayerInput } from "./components/input.js";

export class PlayerView extends Component {
    constructor(gameObject, camera) {
        super(gameObject);

        this._speed = document.querySelector("#speed");
        this._altitude = document.querySelector("#altitude");

        this.camera = camera;

        this.oldPos = new THREE.Vector3();
        this.moved = new THREE.Vector3();
        this.worldPos = new THREE.Vector3();

        this.gameObject.transform.getWorldPosition(this.worldPos);

        this.oldPos.copy(this.worldPos);
        this.camera.position.set(
            this.worldPos.x - 1,
            this.worldPos.y + 1,
            this.worldPos.z - 1
        );

        this.controls = new OrbitControls(
            this.camera,
            document.querySelector("#screen")
        );
        this.controls.target.copy(this.gameObject.position);
        this.controls.update();
    }

    update(dt) {
        this.gameObject.transform.getWorldPosition(this.worldPos);
        this.moved.subVectors(this.worldPos, this.oldPos);
        this.oldPos.copy(this.worldPos);
        this.camera.position.add(this.moved);
        this.controls.target.copy(this.worldPos);
        this.controls.update();

        this._speed.innerText = `${(
            this.gameObject.velocity.length() * 10
        ).toFixed(2)} km/h`;
        this._altitude.innerText = `${(this.gameObject.position.y * 10).toFixed(
            2
        )} m`;
    }

    destroy() {
        this.controls.dispose();
    }
}

export class ViewManager {
    constructor(goa, camera) {
        this._goa = goa;
        this._activeIndex = -1;
        this.activeGameObject = null;
        this._camera = camera;
    }

    _init() {
        this._activeIndex = 0;
        const newActive = this._goa.array[this._activeIndex];
        this.activeGameObject = newActive.id;
        newActive.addComponent(new PlayerView(newActive, this._camera));
        newActive.addComponent(new PlayerInput(newActive));
    }

    setActive(i) {

        if (i == this._activeIndex) return;

        const newActive = this._goa.array[i];

        if (!newActive) {
            console.error("error");
            return;
        }

        const oldActive = this._goa.array[this._activeIndex];
        if (oldActive) {
            oldActive.removeComponent(PlayerView);
            oldActive.removeComponent(PlayerInput);
        } else {
            console.error("error");
        }

        this.activeGameObject = newActive.id;
        this._activeIndex = i;

        newActive.addComponent(new PlayerView(newActive, this._camera));
        newActive.addComponent(new PlayerInput(newActive));
    }

    toggle() {
        const n = this._goa.array.length;
        let i = this._activeIndex;

        const oldActive = this._goa.array[i];
        if (oldActive) {
            oldActive.removeComponent(PlayerView);
            oldActive.removeComponent(PlayerInput);
        } 

        i = (i + 1) % n;
        this._activeIndex = i;

        let newActive = this._goa.array[i];

        if (newActive == undefined) {
            console.error("error");
            this.toggle();
            return;
        }

        this.activeGameObject = newActive.id;

        if (!newActive.getComponent(PlayerView)) {
            newActive.addComponent(new PlayerView(newActive, this._camera));
        } else {
            console.error("error");
        }

        if (!newActive.getComponent(PlayerInput)) {
            newActive.addComponent(new PlayerInput(newActive));
        } else {
            console.error("error");
        }
    }
}
