import * as THREE from './three/build/three.module.js';

import { Component }  from './components.js';


export class Ground extends Component{
    constructor(gameObject, planeSize = 40){
        super(gameObject)

        const loader = new THREE.TextureLoader();
        const texture = loader.load('../assets/textures/checker.png');
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.magFilter = THREE.NearestFilter;
        const repeats = planeSize / 2;
        texture.repeat.set(repeats, repeats);

        const planeGeo = new THREE.PlaneGeometry(planeSize, planeSize);
        const planeMat = new THREE.MeshPhongMaterial({
        map: texture,
            side: THREE.DoubleSide,
        });
        const mesh = new THREE.Mesh(planeGeo, planeMat);
        mesh.receiveShadow = true;
        mesh.rotation.x = Math.PI * -.5;
        mesh.position.setY(2.5)
        gameObject.transform.add(mesh);
    }

    collide(aabb){

    }
}