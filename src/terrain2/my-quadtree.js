import * as THREE from "three";

const MIN_SIZE = 100;

class QuadtreeNode extends THREE.Box2 {
    children = [];
    constructor(min, max) {
        super(min, max);
    }

    get size() {
        return this.getSize(new THREE.Vector2());
    }
}

export class MyQuadtree {
    constructor(min, max) {
        this._root = new QuadtreeNode(min, max);
    }

    createChildren(node) {
        return [];
    }

    insert(pos) {
        this._insert(this._root, new THREE.Vector2(pos.x, pos.z));
    }

    _insert(node, pos) {
        debugger;
        const center = node.getCenter(new THREE.Vector2());
        const distance = center.distanceTo(pos);
        if (distance < node.size.x && node.size.x > MIN_SIZE) {
            console.log(`divide`);
            node.children = this.createChildren(node);

            for (let child of node.children) {
                this._insert(child, pos);
            }
        }
    }
}
