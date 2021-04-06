import * as THREE from './three/build/three.module.js';
import { Component }  from './components.js';

const _MIN_CELL_SIZE = 50;

class TerrainChunk {
    constructor(root, material, offset){
        const geometry = new THREE.PlaneGeometry(_MIN_CELL_SIZE, _MIN_CELL_SIZE, 10, 10);
        const mesh = new THREE.Mesh(geometry, material);
        
        mesh.receiveShadow = true;
        mesh.rotation.x = Math.PI * -0.5;
        mesh.position.set(offset.x, 0, offset.y)
        
        root.add(mesh);
    }
}

export class TerrainManager extends Component {
    constructor(gameObject, params){
        super(gameObject);

        this._camera = params.camera;
        this._chunks = [];

        this._root = new THREE.Group();
        this.gameObject.transform.add(this._root);

        this._material = new THREE.MeshStandardMaterial({
            color: 0x00ff00, 
            wireframe: true
        });



    }

    update(dt){

        //console.log("update");

        const [x, z] = this._cell(this._camera.position) 
        const newChunkKey = this._key(x,z);

        //console.log(newChunkKey);

        if (newChunkKey in this._chunks){
            return;
        }

        const offset = new THREE.Vector2(x * _MIN_CELL_SIZE, z * _MIN_CELL_SIZE);

        this._chunks[newChunkKey] = {
            position: [x,z],
            chunk: this._createChunk(offset)
        }

        console.log(`create ${newChunkKey}`)



    }

    _createChunk(offset){
        const chunk = new TerrainChunk(this._root, this._material, offset);
        return chunk;
    }

    _cell(p){
        const xp = p.x + _MIN_CELL_SIZE * 0.5;
        const yp = p.z + _MIN_CELL_SIZE * 0.5;
        const x = Math.floor(xp / _MIN_CELL_SIZE);
        const z = Math.floor(yp / _MIN_CELL_SIZE);
        return [x, z];
    }

    _key(x, z){
        return `${x}/${z}`;
    }
}

