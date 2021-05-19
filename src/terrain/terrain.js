import * as THREE from "three";

import { Component } from "../engine/component";
import { FixedHeightMap, ImageHeightMap } from "./heightmap";
import { Quadtree } from "./quadtree";
import { Chunk } from "./chunk";
import { TerrainObjects } from "./terrain-objects";

export class Terrain extends Component {
    constructor(gameObject, params) {
        super(gameObject);

        this.root = new THREE.Object3D();
        this.gameObject.transform.add(this.root);

        //this._heightmap = new FixedHeightMap();
        this._heightmap = new ImageHeightMap(params.heightmap);

        this._chunks = {};
        /*
        const x = new Chunk(
            this.root,
            new THREE.Vector2(),
            new THREE.Vector2(256, 256),
            this._heightmap
        );
        */
    }

    _build(pos) {
        const quadtree = new Quadtree(65536, 512);

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
                chunk: new Chunk(this.root, child.center, child.size, this._heightmap, key),
                buildings: new TerrainObjects(this.root, child.center, child.size, this._heightmap, key),
            };
        }

        for (const key in this._chunks) {
            this._count--;
            this._chunks[key].chunk.destroy();
            if (this._chunks[key].buildings) this._chunks[key].buildings.destroy();
        }

        this._chunks = newChunks;
    }

    update(dt, params) {
        const pos = new THREE.Vector3();
        //if (params.camera.focusPoint && params.camera.zoom > 5) {
        if (params.camera.focusPoint) {
            pos.copy(params.camera.focusPoint);
        } else {
            pos.copy(params.camera.position);
        }

        this._build(pos);
    }

    getHeight(x, z) {
        return this._heightmap.get(x, z);
    }

    placeAt(x, z) {
        return new THREE.Vector3(x, this._heightmap.get(x, z), z);
    }
}
