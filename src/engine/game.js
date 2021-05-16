import { GameObjectArray } from "./game-object-array.js";
import { GameEvents } from "./game-events.js";

export class Game {
    constructor() {
        this.events = new GameEvents();
        this.objects = new GameObjectArray();
    }
}
