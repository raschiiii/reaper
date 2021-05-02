import * as THREE from "three";

import { Component } from "../engine/component.js";
import { QuadTree } from "./quadtree.js";
import {
    FixedHeightMap,
    ImageHeightMap,
    RandomHeightMap,
} from "./heightmap.js";

import { TerrainChunk } from "./terrain-chunk.js";

const _MIN_CELL_SIZE = 50;
const _FIXED_GRID_SIZE = 3;

export class TerrainManager extends Component {
    constructor(gameObject, params) {
        super(gameObject);

        //this._heightmap = new RandomHeightMap();
        this._heightmap = new ImageHeightMap(params.heightmap);
        //this._heightmap = new FixedHeightMap();

        this._camera = params.camera;
        this._chunks = {};

        this._root = new THREE.Group();
        this.gameObject.transform.add(this._root);

        this._material = new THREE.MeshStandardMaterial({
            color: 0xaa895e,
            wireframe: false,
            side: THREE.DoubleSide,
            flatShading: true,
            roughness: 1.0,
        });

        this._count = 0;
    }

    _updateVisibleQuadtree() {
        const quadtree = new QuadTree({
            min: new THREE.Vector2(-32000, -32000),
            max: new THREE.Vector2(32000, 32000),
        });
        quadtree.Insert(this._camera.position);
        const children = quadtree.GetChildren();

        let center = new THREE.Vector2();
        let dimensions = new THREE.Vector2();

        let newChunks = {};

        for (const child of children) {
            child.bounds.getCenter(center);
            child.bounds.getSize(dimensions);

            const key = this._key(center.x, center.y);

            if (key in this._chunks) {
                newChunks[key] = this._chunks[key];
                delete this._chunks[key];
                continue;
            }
            const offset = new THREE.Vector2(center.x, center.y);

            newChunks[key] = {
                position: [center.x, center.y],
                chunk: this._createChunk(offset, dimensions),
            };
        }

        for (const key in this._chunks) {
            this._count--;
            this._chunks[key].chunk.destroy();
        }
        this._chunks = newChunks;
    }

    update(dt) {
        this._updateVisibleQuadtree();
        //this._debug.innerText = `chunks: ${this._count}`
    }

    _createChunk(offset, dimensions) {
        this._count++;
        const chunk = new TerrainChunk(
            this._root,
            this._material,
            offset,
            dimensions,
            this._heightmap
        );
        return chunk;
    }

    _cell(p) {
        const xp = p.x + _MIN_CELL_SIZE * 0.5;
        const yp = p.z + _MIN_CELL_SIZE * 0.5;
        const x = Math.floor(xp / _MIN_CELL_SIZE);
        const z = Math.floor(yp / _MIN_CELL_SIZE);
        return [x, z];
    }

    _key(x, z) {
        return `${x}/${z}`;
    }

    getHeight(x, z) {
        return this._heightmap.get(x, z);
    }

    placeAt(x, z) {
        return new THREE.Vector3(x, this.getHeight(x, z), z);
    }
}
