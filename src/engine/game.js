import { GameObjectArray } from "./game-object-array.js";
import { GameEvents } from "./game-events.js";

export class Game {
    constructor() {
        this.array = new GameObjectArray();
        this.events = new GameEvents();
        window.game = this;
    }
}
