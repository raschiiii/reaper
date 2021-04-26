import * as THREE from "../three/build/three.module.js";

import { Component } from "../engine/component.js";
import { QuadTree } from "./quadtree.js";

const _MIN_CELL_SIZE = 50;
const _FIXED_GRID_SIZE = 3;

class FixedHeightMap {
    constructor() {}

    get(x, y) {
        return 0;
    }
}

class ImageHeightMap {
    constructor(image) {
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0);
        this._data = context.getImageData(0, 0, image.width, image.height);
    }

    get(x, y) {
        const getPixel = (x, y) => {
            const position = (x + this._data.width * y) * 4;
            const data = this._data.data;
            return data[position] / 255.0;
        };
        const sat = (x) => {
            return Math.min(Math.max(x, 0.0), 1.0);
        };

        // where to place to heightmap image
        const offset = new THREE.Vector2(-16000, -16000);
        const dimensions = new THREE.Vector2(32000, 32000);

        const xf = 1.0 - sat((x - offset.x) / dimensions.x);
        const yf = sat((y - offset.y) / dimensions.y);
        const w = this._data.width - 1;
        const h = this._data.height - 1;
        const x1 = Math.floor(xf * w);
        const y1 = Math.floor(yf * h);
        const x2 = THREE.MathUtils.clamp(x1 + 1, 0, w);
        const y2 = THREE.MathUtils.clamp(y1 + 1, 0, h);
        const xp = xf * w - x1;
        const yp = yf * h - y1;
        const p11 = getPixel(x1, y1);
        const p21 = getPixel(x2, y1);
        const p12 = getPixel(x1, y2);
        const p22 = getPixel(x2, y2);
        const px1 = THREE.MathUtils.lerp(p11, p21, xp);
        const px2 = THREE.MathUtils.lerp(p12, p22, xp);
        return THREE.MathUtils.lerp(px1, px2, yp) * 500;
    }
}

class RandomHeightMap {
    constructor() {
        this._values = [];
    }

    _rand(x, y) {
        const k = x + "." + y;
        if (!(k in this._values)) {
            this._values[k] = Math.random();
        }
        return this._values[k];
    }

    get(x, y) {
        const x1 = Math.floor(x);
        const y1 = Math.floor(y);
        const x2 = x1 + 1;
        const y2 = y1 + 1;
        const xp = x - x1;
        const yp = y - y1;
        const p11 = this._rand(x1, y1);
        const p21 = this._rand(x2, y1);
        const p12 = this._rand(x1, y2);
        const p22 = this._rand(x2, y2);
        const px1 = THREE.MathUtils.lerp(p11, p21, xp);
        const px2 = THREE.MathUtils.lerp(p12, p22, xp);
        return THREE.MathUtils.lerp(px1, px2, yp);
    }
}

class TerrainChunk2 {
    constructor(root, material, offset, dimensions, heightmap) {
        this._heightmap = heightmap;

        let divisions = 5;
        const skirt = dimensions.x / divisions;

        divisions += 2;
        dimensions.x += skirt * 2;
        dimensions.y += skirt * 2;

        const mat = new THREE.MeshStandardMaterial({
            color: Math.floor(Math.random() * 50000),
            wireframe: false,
            side: THREE.DoubleSide,
            flatShading: true,
        });

        this._plane = new THREE.Mesh(
            new THREE.PlaneBufferGeometry(
                dimensions.x,
                dimensions.y,
                divisions,
                divisions
            ),
            material
        );

        let vertices = this._plane.geometry.attributes.position.array;
        let normals = this._plane.geometry.attributes.normal.array;
        console.log(normals.length);

        for (let i = 0; i < vertices.length; i = i + 3) {
            vertices[i + 2] = this._heightmap.get(
                vertices[i] + offset.x,
                -vertices[i + 1] + offset.y
            );
            //vertices[i + 2] = 0;
        }

        this._plane.geometry.computeVertexNormals();

        const h = -30;
        let x, y;

        const fix = function (skrt, edge) {
            vertices[skrt * 3 + 2] = vertices[edge * 3 + 2] + h;
            vertices[skrt * 3 + 1] = vertices[edge * 3 + 1];
            vertices[skrt * 3 + 0] = vertices[edge * 3 + 0];
        };

        const fixN = function (skrt, edge) {
            normals[skrt * 3 + 2] = normals[edge * 3 + 2];
            normals[skrt * 3 + 1] = normals[edge * 3 + 1];
            normals[skrt * 3 + 0] = normals[edge * 3 + 0];
        };

        y = 0;
        for (x = 0; x <= divisions; x++) {
            fix(y + (divisions + 1) * x, y + 1 + (divisions + 1) * x);
            fixN(y + (divisions + 1) * x, y + 1 + (divisions + 1) * x);

            //vertices[ (y + (divisions+1) * x) * 3 + 2] = vertices[ ((y+1) + (divisions+1) * x) * 3 + 2] + h;
            //vertices[ (y + (divisions+1) * x) * 3 + 1] = vertices[ ((y+1) + (divisions+1) * x) * 3 + 1];
            //vertices[ (y + (divisions+1) * x) * 3 + 0] = vertices[ ((y+1) + (divisions+1) * x) * 3 + 0];
        }

        y = divisions;
        for (x = 0; x <= divisions; x++) {
            fix(y + (divisions + 1) * x, y - 1 + (divisions + 1) * x);
            fixN(y + (divisions + 1) * x, y - 1 + (divisions + 1) * x);

            //vertices[ (y + (divisions+1) * x) * 3 + 2] = vertices[ ((y-1) + (divisions+1) * x) * 3 + 2] + h;
            //vertices[ (y + (divisions+1) * x) * 3 + 1] = vertices[ ((y-1) + (divisions+1) * x) * 3 + 1];
            //vertices[ (y + (divisions+1) * x) * 3 + 0] = vertices[ ((y-1) + (divisions+1) * x) * 3 + 0];
        }

        x = 0;
        for (y = 0; y <= divisions; y++) {
            fix(y + (divisions + 1) * x, y + (divisions + 1) * (x + 1));
            fixN(y + (divisions + 1) * x, y + (divisions + 1) * (x + 1));

            //vertices[ (y + (divisions+1) * x) * 3 + 2] = vertices[ (y + (divisions+1) * (x+1)) * 3 + 2] + h;
            //vertices[ (y + (divisions+1) * x) * 3 + 1] = vertices[ (y + (divisions+1) * (x+1)) * 3 + 1];
            //vertices[ (y + (divisions+1) * x) * 3 + 0] = vertices[ (y + (divisions+1) * (x+1)) * 3 + 0];
        }

        x = divisions;
        for (y = 0; y <= divisions; y++) {
            fix(y + (divisions + 1) * x, y + (divisions + 1) * (x - 1));

            //vertices[ (y + (divisions+1) * x) * 3 + 2] += h;
            //vertices[ (y + (divisions+1) * x) * 3 + 2] = vertices[ (y + (divisions+1) * (x-1)) * 3 + 2] + h;
            //vertices[ (y + (divisions+1) * x) * 3 + 1] = vertices[ (y + (divisions+1) * (x-1)) * 3 + 1];
            //vertices[ (y + (divisions+1) * x) * 3 + 0] = vertices[ (y + (divisions+1) * (x-1)) * 3 + 0];
        }

        this._plane.geometry.attributes.position.needsUpdate = true;
        this._plane.geometry.attributes.normal.needsUpdate = true;

        this._plane.position.set(offset.x, 0, offset.y);
        this._plane.rotation.x = Math.PI * -0.5;
        this._plane.receiveShadow = true;
        root.add(this._plane);
    }

    destroy() {
        this._plane.geometry.dispose();
    }
}

class TerrainChunk {
    constructor(root, material, offset, dimensions, heightmap) {
        this._heightmap = heightmap;

        const _geometry = new THREE.PlaneBufferGeometry(
            dimensions.x,
            dimensions.y,
            10,
            10
        );

        /*const _material = new THREE.MeshStandardMaterial({
            color: Math.floor(Math.random() * 50000),
            wireframe: false,
            side: THREE.DoubleSide,
            flatShading: true,
        });*/

        this._plane = new THREE.Mesh(_geometry, material);

        let vertices = this._plane.geometry.attributes.position.array;

        for (let i = 0; i < vertices.length; i = i + 3) {
            vertices[i + 2] = this._heightmap.get(
                vertices[i] + offset.x,
                -vertices[i + 1] + offset.y
            );
        }

        this._plane.geometry.attributes.position.needsUpdate = true;
        this._plane.geometry.computeVertexNormals();
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
