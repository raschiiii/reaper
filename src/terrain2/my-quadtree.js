import * as THREE from "three";

export class MyQuadtree {
    constructor(min, max) {
        this.root = new THREE.Box2(min, max);
    }

    getChildren() {}

    insert(pos) {}
}
