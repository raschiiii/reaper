import * as THREE from "three";

import { Component } from "../engine/component";
import { ImageHeightMap } from "../terrain/heightmap";
import { LodQuadtree } from "./lod-quadtree";
import { Chunk } from "./chunk.js";

export class Terrain extends Component {
    constructor(gameObject, params) {
        super(gameObject);

        this.root = new THREE.Object3D();
        this.gameObject.transform.add(this.root);

        this._heightmap = new ImageHeightMap(params.heightmap);

        this._chunks = {};

        const x = new Chunk(
            this.root,
            new THREE.Vector2(),
            new THREE.Vector2(1024, 1024),
            this._heightmap
        );
    }

    _buildTerrain(pos) {
        const quadtree = new LodQuadtree(65536, 256);

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
                //position: [child.center.x, child.center.y],
                chunk: new Chunk(
                    this.root,
                    child.center,
                    child.size,
                    this._heightmap
                ),
            };
        }

        for (const key in this._chunks) {
            this._count--;
            this._chunks[key].chunk.destroy();
        }

        this._chunks = newChunks;
    }

    update(dt, params) {
        //this._buildTerrain(params.camera.position);
    }

    getHeight(x, z) {
        return 0.0;
    }
}
