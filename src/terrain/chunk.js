import * as THREE from "three";

const _RESOLUTION = 10;

class LookupTable {
    constructor() {
        this._chunkSize = 512;
        this._maxChunkSize = 1024;
        this._table = {};
    }

    _hash(pos) {
        const x = Math.floor(pos.x / this._chunkSize);
        const y = Math.floor(pos.y / this._chunkSize);
        return `${x}/${y}`;
    }

    insert(obj) {
        const key = this._hash(obj.pos);
        if (this._table[key]) {
            this._table[key].push(obj);
        } else {
            this._table[key] = [obj];
        }
    }

    _entry(pos) {
        return this._table[this._hash(pos)] || [];
    }

    lookup(pos, size) {
        if (size.x <= this._maxChunkSize) {
            if (size.x > this._chunkSize) {
                console.log("recurse");

                const offset = size.x / 2;
                const newSize = new THREE.Vector3(size.x / 2, size.y / 2);
                const p1 = this.lookup(new THREE.Vector2(pos.x + offset, pos.y + offset), newSize);
                const p2 = this.lookup(new THREE.Vector2(pos.x + offset, pos.y - offset), newSize);
                const p3 = this.lookup(new THREE.Vector2(pos.x - offset, pos.y + offset), newSize);
                const p4 = this.lookup(new THREE.Vector2(pos.x - offset, pos.y - offset), newSize);

                return [...p1, ...p2, ...p3, ...p4];
            } else {
                //console.log(pos);
                return this._entry(pos);
            }
        } else {
            return [];
        }
    }
}

const lookupTable = new LookupTable();
const radius = 60;
for (let i = 0; i < 50; i++) {
    lookupTable.insert({
        pos: new THREE.Vector2(
            radius * Math.random() - radius / 2,
            radius * Math.random() - radius / 2
        ),
    });
}

export class Buildings {
    constructor(root, offset, dimensions, heightmap, key) {
        function randomPos() {
            return new THREE.Vector3(
                offset.x + (dimensions.x * Math.random() - dimensions.x / 2),
                heightmap.get(offset.x, offset.y),
                offset.y + (dimensions.y * Math.random() - dimensions.y / 2)
            );
        }

        //console.log(dimensions.x);

        const terrainObjects = lookupTable.lookup(offset, dimensions);

        if (terrainObjects.length > 0) {
            console.log(offset, dimensions.x, terrainObjects.length);
            console.log(terrainObjects);

            //console.log({ locations: terrainObjects });

            this._buildings = new THREE.Group();

            for (const obj of terrainObjects) {
                const pos = obj.pos;
                const cube = new THREE.Mesh(
                    new THREE.BoxGeometry(
                        THREE.MathUtils.randInt(1, 3),
                        THREE.MathUtils.randInt(1, 5),
                        THREE.MathUtils.randInt(1, 3)
                    ),
                    new THREE.MeshStandardMaterial({
                        color: 0x857f76,
                    })
                );

                cube.castShadow = true;
                cube.position.set(pos.x, heightmap.get(pos.x, pos.y), pos.y);
                cube.rotateY(Math.random());
                this._buildings.add(cube);
            }

            root.add(this._buildings);
        }
    }

    destroy() {
        if (this._buildings) {
            const parent = this._buildings.parent;

            this._buildings.traverse(function (child) {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });

            parent.remove(this._buildings);
        }
    }
}

export class Chunk {
    constructor(root, offset, dimensions, heightmap, key) {
        //console.log({offset});
        const t = dimensions.x / (_RESOLUTION - 2);
        dimensions.x += 2 * t;
        dimensions.y += 2 * t;

        // just for debugging
        const color1 = new THREE.Color(Math.random(), Math.random(), Math.random());

        const color2 = new THREE.Color();
        color2.lerpColors(
            new THREE.Color(0x523415),
            new THREE.Color(0x745c43),
            dimensions.x / (65536 / 2)
        );

        const color3 = new THREE.Color(0x523415);

        this._plane = new THREE.Mesh(
            new THREE.PlaneGeometry(dimensions.x, dimensions.y, _RESOLUTION, _RESOLUTION),
            new THREE.MeshStandardMaterial({
                color: color1,
                wireframe: false,
                side: THREE.DoubleSide,
                flatShading: true,
            })
        );

        this.buildChunk(heightmap, offset);
        this.buildSkirts();

        this._plane.position.set(offset.x, 0, offset.y);
        this._plane.rotation.x = Math.PI * -0.5;
        this._plane.receiveShadow = true;
        root.add(this._plane);
    }

    buildChunk(heightmap, offset) {
        let vertices = this._plane.geometry.attributes.position.array;

        for (let i = 0; i < vertices.length; i = i + 3) {
            const x = vertices[i] + offset.x;
            const y = -vertices[i + 1] + offset.y;
            vertices[i + 2] = heightmap.get(x, y);
        }

        this._plane.geometry.attributes.position.needsUpdate = true;
        this._plane.geometry.computeVertexNormals();
    }

    buildSkirts() {
        let vertices = this._plane.geometry.attributes.position.array;

        function setHeight(x, z) {
            vertices[(x + z * (_RESOLUTION + 1)) * 3 + 2] -= 10;
        }

        for (let i = 0; i <= _RESOLUTION; i++) setHeight(0, i);
        for (let i = 0; i <= _RESOLUTION; i++) setHeight(_RESOLUTION, i);
        for (let i = 0; i <= _RESOLUTION; i++) setHeight(i, 0);
        for (let i = 0; i <= _RESOLUTION; i++) setHeight(i, _RESOLUTION);

        this._plane.geometry.attributes.position.needsUpdate = true;

        /*
        let normals = this._plane.geometry.attributes.normal.array;
        for (let i = 0; i < normals.length; i = i + 3) {}
        this._plane.geometry.attributes.normal.needsUpdate = true;
        */
    }

    destroy() {
        const parent = this._plane.parent;
        this._plane.geometry.dispose();
        this._plane.material.dispose();
        parent.remove(this._plane);
    }
}
