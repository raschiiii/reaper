import * as THREE from "three";

import { Component } from "../engine/component";
import { FixedHeightMap, ImageHeightMap } from "../terrain/heightmap";
import { LodQuadtree } from "./lod-quadtree";
import { Buildings, Chunk } from "./chunk";

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
        const quadtree = new LodQuadtree(65536, 512);

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
                buildings: new Buildings(
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
            this._chunks[key].buildings.destroy();
        }

        this._chunks = newChunks;
    }

    update(dt, params) {
        this._build(params.camera.position);
    }

    getHeight(x, z) {
        return this._heightmap.get(x, z);
    }

    placeAt(x, z) {
        return new THREE.Vector3(x, this._heightmap.get(x, z), z);
    }
}
