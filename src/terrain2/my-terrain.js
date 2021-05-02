import * as THREE from "three";

import { Component } from "../engine/component";

const material = new THREE.MeshStandardMaterial({
    color: Math.floor(Math.random() * 100000),
    wireframe: true,
    side: THREE.DoubleSide,
    flatShading: true,
});

class MyTerrainChunk {
    constructor(root, offset, dimensions) {
        console.log(
            `create chunk: dimensions = [${dimensions.x}, ${dimensions.y}], offset = [${offset.x}, ${offset.y}]`
        );

        this._plane = new THREE.Mesh(
            new THREE.PlaneBufferGeometry(dimensions.x, dimensions.y, 10, 10),
            material
        );
        this._plane.position.set(offset.x, 0, offset.y);
        this._plane.rotation.x = Math.PI * -0.5;
        this._plane.receiveShadow = true;
        root.add(this._plane);
    }
}

export class MyTerrain extends Component {
    constructor(gameObject) {
        super(gameObject);

        this.root = new THREE.Object3D();
        this.gameObject.transform.add(this.root);

        this._chunks = {};
        this._chunks["test"] = new MyTerrainChunk(
            this.root,
            new THREE.Vector2(0, 0),
            new THREE.Vector2(1000, 1000)
        );
    }

    update(dt, params) {}

    getHeight(x, z) {
        return 0.0;
    }
}
