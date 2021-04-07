import * as THREE from '../three/build/three.module.js';
import { ImprovedNoise } from '../three/examples/jsm/math/ImprovedNoise.js';
import { Component }  from '../components.js';
import { QuadTree } from './quadtree.js';

const _MIN_CELL_SIZE    = 50;
const _FIXED_GRID_SIZE  =  3;

class FixedHeightMap {
    constructor(){

    }

    get(x,y){
        return 0;
    }
}

class ImageHeightMap {
    constructor(path){

        const that = this;

        const loader = new THREE.TextureLoader();
        loader.load(path, (result) => {
            const image = result.image;
            console.log(image)
            const canvas = document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = image.height;
            const context = canvas.getContext( '2d' );
            context.drawImage(image, 0, 0);

            that.data = context.getImageData(0, 0, image.width, image.height);

            console.log(that.data)
        });
    
    }

    _getPixel(x, y){
        const position = (x + this.data.width * y) * 4;
        return {
            r: this.data.data[position],
            g: this.data.data[position + 1],
            b: this.data.data[position + 2],
            a: this.data.data[position + 3]
        }
    }

    get(x, y){
        console.log("get")
        //console.log(this._getPixel(0,0))

        return 0;
    }
}

class RandomHeightMap {
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
        // bilenear interpolation
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
        const px1 = THREE.MathUtils.lerp(p11, p21, xp);
        const px2 = THREE.MathUtils.lerp(p12, p22, xp);
        return THREE.MathUtils.lerp(px1, px2, yp);
    }
}

class TerrainChunk {
    constructor(root, material, offset, dimensions, heightmap){

        this._heightmap = heightmap;

        //let m = new THREE.MeshStandardMaterial({
        //    color: 0x00ff00,
        //    wireframe: false,
        //    side: THREE.FrontSide,
        //    flatShading: true
        //});

        const geometry = new THREE.PlaneBufferGeometry(dimensions.x, dimensions.y, 10, 10);
        this._plane = new THREE.Mesh(geometry, material);
        
        let vertices = this._plane.geometry.attributes.position.array;
        
        for (let i = 0; i < vertices.length; i = i + 3) {
            vertices[i+2] = this._heightmap.get(vertices[i] + offset.x, -vertices[i+1] + offset.y) * 50;
        } 

        this._plane.geometry.attributes.position.needsUpdate = true;
        this._plane.geometry.computeVertexNormals();

        this._plane.position.set(offset.x, 0, offset.y)
        this._plane.rotation.x = Math.PI * -0.5;
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

        //this._heightmap = new RandomHeightMap();
        this._heightmap = new ImageHeightMap('../../assets/textures/heightmap.png');
        
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

        this.display2 = document.querySelector('#display2');
    }

    _updateVisible(){
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

    _updateVisibleQuadtree(){
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
        this.display2.innerText = `${Object.keys(this._chunks).length}`
    }

    update(dt){
        this._updateVisibleQuadtree();
    }

    _createChunk(offset, dimensions){
        const chunk = new TerrainChunk(this._root, this._material, offset, dimensions, this._heightmap);
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
