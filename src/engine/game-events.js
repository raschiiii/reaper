export class GameEvents {
    constructor() {
        this.subscribers = {};
    }

    subscribe(event, callback) {
        if (!this.subscribers[event]) {
            this.subscribers[event] = [];
        }

        let index = this.subscribers[event].push(callback) - 1;

        return {
            unsubscribe: () => {
                // not optimal, but works if no big changes with subscribers
                this.subscribers[event][index] = () => {};
            },
        };
    }

    publish(event, data) {
        if (!this.subscribers[event]) return;
        this.subscribers[event].forEach((callback) => callback(data));
    }
}
