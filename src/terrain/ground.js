import * as THREE from './three/build/three.module.js';
import { Component }  from './components.js';

export class Ground2 extends Component {
    constructor(gameObject){
        super(gameObject);
        const geometry = new THREE.PlaneGeometry( 7500, 7500, 10, 10 );
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ff00, 
            side: THREE.DoubleSide
            //wireframe: true
        });
        const mesh = new THREE.Mesh( geometry, material );
        mesh.receiveShadow = true;
        mesh.rotation.x = Math.PI * -0.5;
        mesh.position.setY(2.5)
        this.gameObject.transform.add( mesh )    
    }
}

export class Ground extends Component{
    constructor(gameObject, planeSize = 40){
        super(gameObject)

        //const loader = new THREE.TextureLoader();
        //const texture = loader.load('../assets/textures/checker.png');
        //texture.wrapS     = THREE.RepeatWrapping;
        //texture.wrapT     = THREE.RepeatWrapping;
        //texture.magFilter = THREE.NearestFilter;
        //texture.needsUpdate = false;
        //const repeats = planeSize / 50;
        //texture.repeat.set(repeats, repeats);
        //const planeMat = new THREE.MeshPhongMaterial({
        //    map: texture,
        //    side: THREE.DoubleSide,
        //});

        const planeMat = new THREE.MeshStandardMaterial({
            color: 0x00ff00, 
            wireframe: true
        });

        const planeGeo = new THREE.PlaneGeometry(planeSize, planeSize, 50, 50);
        
        const mesh = new THREE.Mesh(planeGeo, planeMat);
        
        mesh.receiveShadow = true;
        mesh.rotation.x = Math.PI * -.5;
        mesh.position.setY(2.5)
        gameObject.transform.add(mesh);
    }
}