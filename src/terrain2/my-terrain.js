import * as THREE from "three";
import { Vector2 } from "three";

import { Component } from "../engine/component";
import { MyQuadtree } from "./my-quadtree";

/*
const material = new THREE.MeshStandardMaterial({
    color: 0x000000,
    wireframe: true,
    side: THREE.DoubleSide,
    flatShading: true,
});
*/

class Chunk {
    constructor(root, offset, dimensions) {
        //console.log("create chunk", offset, dimensions);

        const material = new THREE.MeshStandardMaterial({
            color: new THREE.Color(Math.random(), Math.random(), Math.random()),
            wireframe: false,
            side: THREE.DoubleSide,
            flatShading: true,
        });

        this._plane = new THREE.Mesh(
            new THREE.PlaneBufferGeometry(dimensions.x, dimensions.y, 10, 10),
            material
        );

        this._plane.position.set(offset.x, 0, offset.y);
        this._plane.rotation.x = Math.PI * -0.5;
        this._plane.receiveShadow = true;
        root.add(this._plane);
    }

    destroy() {
        this._plane.geometry.dispose();
        this._plane.material.dispose();
        const parent = this._plane.parent;
        parent.remove(this._plane);
    }
}

export class Terrain extends Component {
    constructor(gameObject) {
        super(gameObject);

        this.root = new THREE.Object3D();
        this.gameObject.transform.add(this.root);

        this._chunks = {};

        //this._buildTerrainAround(new THREE.Vector3());
    }

    _buildTerrain(pos) {
        const size = 2048;
        const quadtree = new MyQuadtree(
            new THREE.Vector2(-size, -size),
            new THREE.Vector2(size, size),
            256
        );

        quadtree.insert(pos);
        const children = quadtree.getChildren();

        let newChunks = {};

        for (const child of children) {
            const key = child.key;

            if (key in this._chunks) {
                newChunks[key] = this._chunks[key];
                delete this._chunks[key];
                continue;
            }

            newChunks[key] = {
                position: [child.center.x, child.center.y],
                chunk: new Chunk(this.root, child.center, child.size),
            };
        }

        for (const key in this._chunks) {
            this._count--;
            this._chunks[key].chunk.destroy();
        }

        this._chunks = newChunks;
    }

    update(dt, params) {
        this._buildTerrain(params.camera.position);
    }

    getHeight(x, z) {
        return 0.0;
    }
}
