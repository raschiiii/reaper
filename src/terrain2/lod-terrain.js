import * as THREE from "three";

import { Component } from "../engine/component";
import { ImageHeightMap } from "../terrain/heightmap";
import { LodQuadtree } from "./lod-quadtree";

/*
const material = new THREE.MeshStandardMaterial({
    color: 0x000000,
    wireframe: true,
    side: THREE.DoubleSide,
    flatShading: true,
});
*/

class Chunk {
    constructor(root, offset, dimensions, heightmap) {
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

        this.buildChunk(heightmap, offset);

        this._plane.position.set(offset.x, 0, offset.y);
        this._plane.rotation.x = Math.PI * -0.5;
        this._plane.receiveShadow = true;
        root.add(this._plane);
    }

    buildChunk(heightmap, offset) {
        let vertices = this._plane.geometry.attributes.position.array;

        for (let i = 0; i < vertices.length; i = i + 3) {
            vertices[i + 2] = heightmap.get(
                vertices[i] + offset.x,
                -vertices[i + 1] + offset.y
            );
        }

        this._plane.geometry.attributes.position.needsUpdate = true;
        this._plane.geometry.computeVertexNormals();
    }

    buildChunkWithSkirts(heightmap, offset) {}

    destroy() {
        this._plane.geometry.dispose();
        this._plane.material.dispose();
        const parent = this._plane.parent;
        parent.remove(this._plane);
    }
}

export class Terrain extends Component {
    constructor(gameObject, params) {
        super(gameObject);

        this.root = new THREE.Object3D();
        this.gameObject.transform.add(this.root);

        this._heightmap = new ImageHeightMap(params.heightmap);

        this._chunks = {};

        /*
        const x = new Chunk(
            this.root,
            new THREE.Vector2(),
            new THREE.Vector2(1024, 1024)
        );
        */
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
        this._buildTerrain(params.camera.position);
    }

    getHeight(x, z) {
        return 0.0;
    }
}
