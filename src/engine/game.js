import { GameObjectArray } from "./game-object-array.js";
import { GameEvents } from "./game-events.js";
import { SpatialHashGrid } from "../collision/hashgrid.js";

export class Game {
    constructor() {
        this.events = new GameEvents();
        this.objects = new GameObjectArray();
        this.colliders = new SpatialHashGrid();
    }
}
