import * as THREE from "three";

const _RESOLUTION = 10;
const TEXTURE = new THREE.TextureLoader().load("assets/textures/red.png");
TEXTURE.minFilter = THREE.NearestFilter;
TEXTURE.magFilter = THREE.NearestFilter;

export class Chunk {
    constructor(root, offset, dimensions, heightmap, key) {
        console.log(key);

        //const t = dimensions.x / (_RESOLUTION - 2);
        //dimensions.x += 2 * t;
        //dimensions.y += 2 * t;

        // just for debugging
        const color1 = new THREE.Color(Math.random(), Math.random(), Math.random());
        const color2 = new THREE.Color();
        color2.lerpColors(new THREE.Color(0x523415), new THREE.Color(0x745c43), dimensions.x / (65536 / 2));
        const color3 = new THREE.Color(0x523415);

        this._plane = new THREE.Mesh(
            new THREE.PlaneGeometry(dimensions.x, dimensions.y, _RESOLUTION, _RESOLUTION),
            new THREE.MeshStandardMaterial({
                color: color1,
                //map: TEXTURE,
                wireframe: false,
                side: THREE.DoubleSide,
                flatShading: true,
            })
        );

        this.buildChunk(heightmap, offset);
        //this.buildSkirts();

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

    destroy() {
        const parent = this._plane.parent;
        this._plane.geometry.dispose();
        this._plane.material.dispose();
        parent.remove(this._plane);
    }
}
