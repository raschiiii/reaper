import * as THREE from "three";
import { Component } from "../engine/component.js";

export class AABB extends Component {
    constructor(gameObject, size = new THREE.Vector3(1, 1, 1)) {
        super(gameObject);

        this.box = new THREE.Box3(
            new THREE.Vector3(-size.x / 2, -size.y / 2, -size.z / 2),
            new THREE.Vector3(size.x / 2, size.y / 2, size.z / 2)
        );

        this._offset = new THREE.Vector3(0, 0, 0);
        this._center = new THREE.Vector3(0, 0, 0);
        this.update(0);

        /*
        this.gameObject.transform.add(
            new THREE.Mesh(
                new THREE.BoxGeometry(size.x, size.y, size.z),
                new THREE.MeshBasicMaterial({
                    color: "#dadada",
                    wireframe: true,
                    transparent: true,
                })
            )
        );
        */
    }

    get min() {
        return this.box.min;
    }

    get max() {
        return this.box.max;
    }

    update() {
        this._collided = false;
        this.box.getCenter(this._center);
        this._offset.subVectors(this.gameObject.position, this._center);
        this.box.translate(this._offset);
    }

    collide(aabb) {
        if (aabb.box.intersectsBox(this.box)) {
            let d0, d1;

            d0 = this.box.max.x - aabb.box.min.x;
            d1 = aabb.box.max.x - this.box.min.x;
            let x = d0 < d1 ? d0 : -d1;

            d0 = this.box.max.y - aabb.box.min.y;
            d1 = aabb.box.max.y - this.box.min.y;
            let y = d0 < d1 ? d0 : -d1;

            d0 = this.box.max.z - aabb.box.min.z;
            d1 = aabb.box.max.z - this.box.min.z;
            let z = d0 < d1 ? d0 : -d1;

            aabb.gameObject.publish("collision", { depth: [x, y, z] });
            this.gameObject.publish("collision", { depth: [x, y, z] });
            console.log("collision");
            return true;
        } else {
            return false;
        }
    }

    collide2(aabb) {
        if (aabb.box.intersectsBox(this.box)) {
            let d0, d1;

            d0 = this.box.max.x - aabb.box.min.x;
            d1 = aabb.box.max.x - this.box.min.x;
            let x = d0 < d1 ? d0 : -d1;

            d0 = this.box.max.y - aabb.box.min.y;
            d1 = aabb.box.max.y - this.box.min.y;
            let y = d0 < d1 ? d0 : -d1;

            d0 = this.box.max.z - aabb.box.min.z;
            d1 = aabb.box.max.z - this.box.min.z;
            let z = d0 < d1 ? d0 : -d1;

            return [x, y, z];
        } else {
            return null;
        }
    }
}
