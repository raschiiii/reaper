import * as THREE from "../three/build/three.module.js";
import { Component } from "../engine/component.js";
import { GLTFLoader } from "../three/examples/jsm/loaders/GLTFLoader.js";

export class SimpleModel extends Component {
  constructor(gameObject, gltf, params) {
    super(gameObject);

    let rotation = params.rotation ? params.rotation : new THREE.Vector3();
    let position = params.position ? params.position : new THREE.Vector3();
    let scale = params.scale ? params.scale : new THREE.Vector3(1, 1, 1);

    this.model = gltf.scene.clone();

    this.model.position.copy(position);
    this.model.rotateX(rotation.x);
    this.model.rotateY(rotation.y);
    this.model.rotateZ(rotation.z);
    this.model.scale.copy(scale);

    this.model.traverse(function (object) {
      if (object.isMesh) object.castShadow = true;
    });

    this.gameObject.transform.add(this.model);
  }

  destroy() {
    for (const child of this.model.children) {
      child.geometry.dispose();
      child.material.dispose();
    }
    this.model.parent.remove(this.model);
  }
}

export class AirplaneModel extends Component {
  constructor(gameObject, gltf, params) {
    super(gameObject);

    let rotation = params.rotation ? params.rotation : new THREE.Vector3();
    let position = params.position ? params.position : new THREE.Vector3();
    let scale = params.scale ? params.scale : new THREE.Vector3(1, 1, 1);

    this.model = gltf.scene;
    this.model.position.copy(position);
    this.model.rotateX(rotation.x);
    this.model.rotateY(rotation.y);
    this.model.rotateZ(rotation.z);
    this.model.scale.copy(scale);

    this.model.traverse(function (object) {
      if (object.isMesh) object.castShadow = true;
    });

    //console.log(this.model)

    this.propellor = this.model.children[3];
    this.gameObject.transform.add(this.model);
  }

  update(dt) {
    if (this.propellor) this.propellor.rotateZ(400.0 * dt);
  }

  destroy() {
    for (const child of this.model.children) {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    }
    this.model.parent.remove(this.model);
  }
}
