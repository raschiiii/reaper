import * as THREE from '../three/build/three.module.js';
import { ImprovedNoise } from '../three/examples/jsm/math/ImprovedNoise.js';
import { Component }  from '../components.js';
import { QuadTree } from './quadtree.js';
import { utils } from './utils.js'

const _MIN_CELL_SIZE = 50;
const _FIXED_GRID_SIZE = 3;

class TerrainChunk {
    constructor(root, material, offset, dimensions, heightmap){
        const geometry = new THREE.PlaneGeometry(dimensions.x, dimensions.y, 5, 5);
        this.mesh = new THREE.Mesh(geometry, material);

        this.mesh.receiveShadow = true;
        this.mesh.rotation.x = Math.PI * -0.5;
        this.mesh.position.set(offset.x, 0, offset.y)
        root.add(this.mesh);
    }

    destroy(){
		this.mesh.geometry.dispose()
    }
}

class HeightMap {
    constructor(){
        this._values = []
    }

    _rand(x,y){
        const k = x + '.' + y;
        if (!(k in this._values)){
            this._values[k] = Math.random();
        }
        return this._values[k];
    }   

    get(x,y){
        const x1 = Math.floor(x);
        const y1 = Math.floor(y);
        const x2 = x1 + 1;
        const y2 = y1 + 1;
        
        const xp = x - x1;
        const yp = y - y1;

        const p11 = this._rand(x1, y1);
        const p21 = this._rand(x2, y1);
        const p12 = this._rand(x1, y2);
        const p22 = this._rand(x2, y2);

        const px1 = THREE.MathUtils.lerp(xp, p11, p21);
        const px2 = THREE.MathUtils.lerp(xp, p12, p22);

        return THREE.MathUtils.lerp(yp, px1, px2)
    }
}

class TerrainChunk2 {

    constructor(root, material, offset, dimensions, heightmap){
        const geometry = new THREE.PlaneBufferGeometry(dimensions.x, dimensions.y, 10, 10);

        this._hm = heightmap
        this._plane = new THREE.Mesh(geometry, material);
        this._plane.rotation.x = Math.PI * -0.5;
        this.offset = offset;
        
        let vertices = this._plane.geometry.attributes.position.array;
        
        //console.log(`${vertices[0]}, ${vertices[1]}, ${offset.x}, ${offset.y}`)

        for (let i = 0; i < vertices.length; i = i + 3) {
            vertices[i + 2] = this._hm.get(vertices[i] + offset.x, -vertices[i + 1] + offset.y) * 100;
        } 

        this._plane.geometry.attributes.position.needsUpdate = true;
        this._plane.geometry.computeVertexNormals();
        this._plane.position.set(offset.x, 0, offset.y)
        this._plane.receiveShadow = true;

        root.add(this._plane);
    }

    destroy(){
		this._plane.geometry.dispose()
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
            wireframe: false,
            side: THREE.FrontSide,
            flatShading: true
        });

        this.heightmap = new HeightMap();
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


        let center = new THREE.Vector2();
        let dimensions = new THREE.Vector2();

        let newChunks = {};

        for (const child of children){

            child.bounds.getCenter(center);
            child.bounds.getSize(dimensions);

            const key = this._key(center.x, center.y);

            if (key in this._chunks) {
                newChunks[key] = this._chunks[key];
                delete this._chunks[key];
                continue;
            }
            const offset = new THREE.Vector2(center.x, center.y);

            newChunks[key] = {
                position: [center.x, center.y],
                chunk: this._createChunk(offset, dimensions)
            }
        }

        for (const key in this._chunks) this._chunks[key].chunk.destroy();

        this._chunks = newChunks;

        this.display2.innerText = `len: ${Object.keys(this._chunks).length}`
    }


    update(dt){
        this.updateVisibleQuadtree();
    }

    _createChunk(offset, dimensions){
        const chunk = new TerrainChunk2(this._root, this._material, offset, dimensions, this.heightmap);
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

