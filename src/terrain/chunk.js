import * as THREE from "three";

const _RESOLUTION = 10;
const TEXTURE = new THREE.TextureLoader().load("assets/textures/red.png");
TEXTURE.minFilter = THREE.NearestFilter;
TEXTURE.magFilter = THREE.NearestFilter;

const load = function (key) {
    return new THREE.TextureLoader().load(`assets/textures/terrain/tile_${key}.png`);
};

const TEXTURES = {
    "256_-256": load("256_-256"),
    "-256_-256": load("-256_-256"),
    "256_256": load("256_256"),
    "-256_256": load("-256_256"),
};

export class Chunk {
    constructor(root, offset, dimensions, heightmap, key) {
        this.oldDim = dimensions.clone();

        const t = dimensions.x / (_RESOLUTION - 2);
        dimensions.x += 2 * t;
        dimensions.y += 2 * t;

        // just for debugging
        const color1 = new THREE.Color(Math.random(), Math.random(), Math.random());
        const color2 = new THREE.Color().lerpColors(
            new THREE.Color(0x523415),
            new THREE.Color(0x745c43),
            dimensions.x / (65536 / 2)
        );
        const color3 = new THREE.Color(0x87683b);

        let material;

        if (TEXTURES[key]) {
            console.log("found");
            material = new THREE.MeshStandardMaterial({
                color: color3,
                map: TEXTURES[key],
                wireframe: false,
                side: THREE.DoubleSide,
                flatShading: true,
            });
        } else {
            material = new THREE.MeshStandardMaterial({
                color: color3,
                wireframe: false,
                side: THREE.DoubleSide,
                flatShading: true,
            });
        }

        /*
        material = new THREE.MeshStandardMaterial({
            color: color3,
            wireframe: false,
            side: THREE.DoubleSide,
            flatShading: true,
        });
        */

        const geometry = new THREE.PlaneGeometry(dimensions.x, dimensions.y, _RESOLUTION, _RESOLUTION);

        this._plane = new THREE.Mesh(geometry, material);

        this.buildChunk(heightmap, offset);
        this.buildSkirts();
        //this.fixUVs();

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
            vertices[(x + z * (_RESOLUTION + 1)) * 3 + 2] -= 30;
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

    fixUVs() {
        let uvs = this._plane.geometry.attributes.uv.array;
        //const geometry = new THREE.PlaneGeometry(this.oldDim.x, this.oldDim.y, _RESOLUTION - 2, _RESOLUTION - 2);
        //const tmp = geometry.attributes.uv.array;

        /*
        for (let x = 1; x < _RESOLUTION; x++) {
            for (let y = 1; y < _RESOLUTION; y++) {
                uvs[(x + y * (_RESOLUTION + 1)) * 2] = tmp[(x - 1 + (y - 1) * (_RESOLUTION + 1)) * 2];
                uvs[(x + y * (_RESOLUTION + 1)) * 2 + 1] = tmp[(x - 1 + (y - 1) * (_RESOLUTION + 1)) * 2];
            }
        }
        */

        this._plane.geometry.attributes.uv.needsUpdate = true;
    }

    destroy() {
        const parent = this._plane.parent;
        this._plane.geometry.dispose();
        this._plane.material.dispose();
        parent.remove(this._plane);
    }
}
