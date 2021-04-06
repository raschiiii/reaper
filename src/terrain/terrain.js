import * as THREE from '../three/build/three.module.js';
import { Component }  from '../components.js';
import { QuadTree } from './quadtree.js';
import { utils } from './utils.js'

const _MIN_CELL_SIZE = 50;
const _FIXED_GRID_SIZE = 3;

class TerrainChunk {
    constructor(root, material, offset, dimensions = new THREE.Vector2(_MIN_CELL_SIZE, _MIN_CELL_SIZE)){
        const geometry = new THREE.PlaneGeometry(dimensions.x, dimensions.y, 5, 5);
        this.mesh = new THREE.Mesh(geometry, material);

        //console.log(dimensions)
        
        this.mesh.receiveShadow = true;
        this.mesh.rotation.x = Math.PI * -0.5;
        this.mesh.position.set(offset.x, 0, offset.y)
        root.add(this.mesh);
    }

    destroy(){
		this.mesh.geometry.dispose()
    }
}

export class TerrainManager extends Component {
    constructor(gameObject, params){
        super(gameObject);

        this._camera = params.camera;
        this._chunks = {};

        this._root = new THREE.Group();
        this.gameObject.transform.add(this._root);

        this._material = new THREE.MeshStandardMaterial({
            color: 0x00ff00, 
            wireframe: true
        });

        this.display2 = document.querySelector('#display2');
    }

    updateVisible(){
        const [xc, zc] = this._cell(this._camera.position) 

        const keys = {};

        for (let x = - _FIXED_GRID_SIZE; x <= _FIXED_GRID_SIZE; x++){
            for (let z = -_FIXED_GRID_SIZE; z <= _FIXED_GRID_SIZE; z++){
                const k = this._key(xc + x, zc + z);
                keys[k] = {
                    position: [xc + x, zc + z]
                }
            }
        }

        for (const key in keys){

            if (key in this._chunks) continue;
            
            const [xp, zp] = keys[key].position;

            const offset = new THREE.Vector2(xp * _MIN_CELL_SIZE, zp * _MIN_CELL_SIZE);

            this._chunks[key] = {
                position: [xp, zp],
                chunk: this._createChunk(offset)
            }
        }


    }

    updateVisibleQuadtree(){
        const quadtree = new QuadTree({
            min: new THREE.Vector2(-32000, -32000),
            max: new THREE.Vector2( 32000,  32000),
        });
        quadtree.Insert(this._camera.position);

        const children = quadtree.GetChildren();

        let c = new THREE.Vector2();
        let d = new THREE.Vector2();

        let newChunks = {};

        for (const child of children){

            child.bounds.getCenter(c);
            child.bounds.getSize(d);

            const key = this._key(c.x, c.y);

            if (key in this._chunks) {
                newChunks[key] = this._chunks[key];
                delete this._chunks[key];
                continue;
            }
            const offset = new THREE.Vector2(c.x, c.y);

            newChunks[key] = {
                position: [c.x, c.y],
                chunk: this._createChunk(offset, d)
            }

            //newChunks[key] = {
            //    position: [c.x, c.y],
            //    dimensions: d
            //}
        }

        for (const key in this._chunks){
            this._chunks[key].chunk.destroy();
        }

        this._chunks = newChunks;

        /*
        const intersection = utils.DictIntersection(this._chunks, newChunks);
        const difference = utils.DictDifference(newChunks, this._chunks);
        //const recycle = Object.values(utils.DictDifference(this._chunks, newChunks));

        newChunks = intersection;

        for (const key in difference){

            const offset = new THREE.Vector2(
                difference[key].position.x,
                difference[key].position.y
            );
            
            newChunks[key] = {
                position: difference[key].position,
                chunk: this._createChunk(offset, difference[key].dimensions)
            }
        }

        this._chunks = newChunks;
        */

        this.display2.innerText = `len: ${Object.keys(this._chunks).length}`
    }


    update(dt){
        
        this.updateVisibleQuadtree();
        //console.log(this._chunks)

        /*
        const newChunkKey = this._key(xc,zc);
        if (newChunkKey in this._chunks){
            return;
        }
        const offset = new THREE.Vector2(xc * _MIN_CELL_SIZE, zc * _MIN_CELL_SIZE);
        this._chunks[newChunkKey] = {
            position: [xc,zc],
            chunk: this._createChunk(offset)
        }
        */
    }

    _createChunk(offset, dimensions){
        const chunk = new TerrainChunk(this._root, this._material, offset, dimensions);
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

