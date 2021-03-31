
export class GameObjectArray {
	constructor(){
		this.array = []
		this.toAdd = []
		this.toRemove = new Set()
	}

	get isEmpty(){
		return this.toAdd.length + this.array.length > 0;
	}

	add(element){
		this.toAdd.push(element)
	}

	remove(element){
		this.toRemove.add(element)
	}

	get(id){
		for (let element of this.array){
			if (element.id === id) return element;
		}
		return undefined
	}

	forEach(f) {
		this._addQueued();
		this._removeQueued();

		for (const element of this.array) {
			
			if (this.toRemove.has(element)) {
				continue;
			}

			f(element);
		}
		this._removeQueued();
	}
	
	_addQueued() {
		if (this.toAdd.length) {
			this.array.splice(this.array.length, 0, ...this.toAdd);
			this.toAdd = [];
		}
	}

	_removeQueued() {
		if (this.toRemove.size) {
			this.array = this.array.filter(element => !this.toRemove.has(element));
			this.toRemove.clear();
		}
	}
}

