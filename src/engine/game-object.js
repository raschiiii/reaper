import * as THREE from "../three/build/three.module.js";

export class GameObject {
    constructor(parent) {
        this.id = this._generateId();
        this.components = [];
        this.subscribers = {};

        this.transform = new THREE.Object3D();
        parent.add(this.transform);

        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3(1, 0, 0);
        this.active = true;
        this.lifetime = undefined;
    }

    _generateId() {
        return Math.floor(Math.random() * 1000000); // not really a good idea
    }

    subscribe(event, callback) {
        if (!this.subscribers[event]) {
            this.subscribers[event] = [];
        }

        let index = this.subscribers[event].push(callback) - 1;

        return {
            unsubscribe: () => {
                // not optimal, but works if no big changes with subscribers
                this.subscribers[event][index] = () => {};
            },
        };
    }

    publish(event, data) {
        if (!this.subscribers[event]) return;
        this.subscribers[event].forEach((callback) => callback(data));
    }

    addComponent(component) {
        this.components.push(component);
        return component;
    }

    removeComponent(component) {
        let comp = this.getComponent(component);
        this.components = this.components.filter(
            (c) => c.name != component.name
        );
        if (comp) comp.destroy();
    }

    getComponent(component) {
        return this.components.find((c) => c.name == component.name);
    }

    update(dt, params) {
        for (const component of this.components) {
            component.update(dt, params);
        }
    }

    destroy() {
        console.log(`destroy GameObject(id=${this.id})`);
        this.publish("destroy", {});
        for (let component of this.components) {
            component.destroy();
        }
    }

    set position(p) {
        this.transform.position.set(p.x, p.y, p.z);
    }

    get position() {
        return this.transform.position;
    }

    get root() {
        let tmp = this.transform;
        while (tmp.parent !== null) {
            tmp = tmp.parent;
        }
        return tmp;
    }
}
