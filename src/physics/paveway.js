import { MissileODE } from "./missile-ode.js";

export class Paveway extends MissileODE {
    constructor(gameObject) {
        super(gameObject, {
            x: gameObject.position.x * 10.0,
            y: gameObject.position.z * 10.0,
            z: gameObject.position.y * 10.0,
            vx: gameObject.velocity.x * 10,
            vy: gameObject.velocity.z * 10,
            vz: gameObject.velocity.y * 10,
            diameter: 0.18,
            mass: 40.0,
            thrust: 0,
            burnTime: 0,
        });

        const steering_lift = 2000;

        this.gameObject.subscribe("guidance", (event) => {
            this.wing_lift = event.wing;
            this.rudder_lift = event.rudder;
        });

        this.gameObject.subscribe("keydown", (event) => {
            switch (event.code) {
                case "KeyW":
                    this.wing_lift = steering_lift;
                    break;
                case "KeyS":
                    this.wing_lift = -steering_lift;
                    break;
                case "KeyA":
                    this.rudder_lift = -steering_lift;
                    break;
                case "KeyD":
                    this.rudder_lift = steering_lift;
                    break;
            }
        });

        this.gameObject.subscribe("keyup", (event) => {
            switch (event.code) {
                case "KeyW":
                    this.wing_lift = 0;
                    break;
                case "KeyS":
                    this.wing_lift = 0;
                    break;
                case "KeyA":
                    this.rudder_lift = 0;
                    break;
                case "KeyD":
                    this.rudder_lift = 0;
                    break;
            }
        });
    }
}
