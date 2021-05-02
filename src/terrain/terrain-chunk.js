import * as THREE from "three";

export class TerrainChunk {
    constructor(root, material, offset, dimensions, heightmap) {
        this._heightmap = heightmap;

        const _geometry = new THREE.PlaneBufferGeometry(
            dimensions.x,
            dimensions.y,
            10,
            10
        );

        /*
        const _material = new THREE.MeshStandardMaterial({
            color: Math.floor(Math.random() * 50000),
            wireframe: true,
            side: THREE.DoubleSide,
            flatShading: true,
        });
        */

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
