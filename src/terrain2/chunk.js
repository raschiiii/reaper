import * as THREE from "three";

const RESOLUTION = 10;

export class Chunk {
    constructor(root, offset, dimensions, heightmap) {
        //console.log("create chunk", offset, dimensions);

        const t = dimensions.x / (RESOLUTION - 2);
        dimensions.x += 2 * t;
        dimensions.y += 2 * t;

        const color1 = new THREE.Color(
            Math.random(),
            Math.random(),
            Math.random()
        );

        const val = dimensions.x / (65536 / 2);
        const color2 = new THREE.Color();
        color2.lerpColors(
            new THREE.Color(0x523415),
            new THREE.Color(0x745c43),
            val
        );

        const material = new THREE.MeshStandardMaterial({
            color: color2,
            wireframe: false,
            side: THREE.DoubleSide,
            flatShading: true,
        });

        this._plane = new THREE.Mesh(
            new THREE.PlaneGeometry(
                dimensions.x,
                dimensions.y,
                RESOLUTION,
                RESOLUTION
            ),
            new THREE.MeshStandardMaterial({
                color: color2,
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
            //vertices[i + 2] = 0.0;
        }

        this._plane.geometry.attributes.position.needsUpdate = true;
        this._plane.geometry.computeVertexNormals();
    }

    buildSkirts() {
        let vertices = this._plane.geometry.attributes.position.array;

        function setHeight(x, z) {
            vertices[(x + z * (RESOLUTION + 1)) * 3 + 2] -= 10;
        }

        for (let i = 0; i <= RESOLUTION; i++) setHeight(0, i);
        for (let i = 0; i <= RESOLUTION; i++) setHeight(RESOLUTION, i);
        for (let i = 0; i <= RESOLUTION; i++) setHeight(i, 0);
        for (let i = 0; i <= RESOLUTION; i++) setHeight(i, RESOLUTION);

        this._plane.geometry.attributes.position.needsUpdate = true;

        /*
        let normals = this._plane.geometry.attributes.normal.array;
        for (let i = 0; i < normals.length; i = i + 3) {}
        this._plane.geometry.attributes.normal.needsUpdate = true;
        */
    }

    destroy() {
        this._plane.geometry.dispose();
        this._plane.material.dispose();
        const parent = this._plane.parent;
        parent.remove(this._plane);
    }
}
