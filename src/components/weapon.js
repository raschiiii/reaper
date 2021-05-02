import * as THREE from "three";
import { Component } from "../engine/component.js";
import { Physics } from "../physics/physics.js";
import { Hellfire } from "../physics/hellfire.js";
import { SmokeTrailEmitter } from "../particles/particle-emitter.js";
import { Paveway } from "../physics/paveway.js";

export class MissileControl extends Component {
    constructor(gameObject, id, goa, type = "AGM-114") {
        super(gameObject);

        this.id = id;
        this.goa = goa;

        this.gameObject.subscribe("fire", (e) => {
            if (e.hardpoint == this.id) {
                const transform = this.gameObject.transform;
                const parent = transform.parent;
                const scene = this.gameObject.root;

                let tmp = new THREE.Vector3();
                parent.getWorldPosition(tmp);
                parent.remove(transform);
                scene.add(transform);

                this.gameObject.position.copy(tmp);
                this.gameObject.velocity.copy(e.velocity);

                if (type === "AGM-114") {
                    this.gameObject.addComponent(
                        new SmokeTrailEmitter(this.gameObject)
                    );
                    this.gameObject.addComponent(
                        new Physics(
                            this.gameObject,
                            new Hellfire(this.gameObject)
                        )
                    );
                }

                if (type === "GBU-12") {
                    this.gameObject.publish("wings", {});

                    this.gameObject.addComponent(
                        new Physics(
                            this.gameObject,
                            new Paveway(this.gameObject)
                        )
                    );
                }

                this.gameObject.addComponent(
                    new LaserGuidance(this.gameObject, e.target)
                );

                this.goa.add(this.gameObject);
            }
        });
    }
}

export class LaserGuidance extends Component {
    constructor(gameObject, target) {
        super(gameObject);
        this._target = target;
        this._dirToTarget = new THREE.Vector3();
    }

    // negativ is to far right, positiv to far left
    _yawAngle(velocity, direction) {
        return (
            Math.atan2(direction.z, direction.x) -
            Math.atan2(velocity.z, velocity.x)
        );
    }

    // positive means too high, negativ is too low
    _pitchAngle(velocity, direction) {
        // angle between vector and x/z plane
        let vh = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
        let pitchV = Math.atan(velocity.y / vh);

        let dh = Math.sqrt(
            direction.x * direction.x + direction.z * direction.z
        );
        let pitchD = Math.atan(direction.y / dh);
        return pitchV - pitchD;
    }

    update(dt) {
        if (this._target) {
            this._dirToTarget.subVectors(
                this._target,
                this.gameObject.position
            );

            const distance = this._dirToTarget.length();

            this._dirToTarget.normalize();

            let v1 = this.gameObject.velocity.clone();
            v1.normalize();

            let v2 = this._dirToTarget.clone();
            v2.normalize();

            const yawAngle = this._yawAngle(v1, v2);
            const pitchAngle = this._pitchAngle(v1, v2);

            let rudderDeflection = 5000 * yawAngle;
            let wingDeflection = -7000 * pitchAngle;

            //this._debug.innerText = `distanceToTarget: ${distance.toFixed(2) * 10}
            // yaw=${ yawAngle }, pitch=${ pitchAngle }, deflection=${ wingDeflection }`;

            //this._debug.innerText = `angle=${ yawAngle }, deflection=${ rudderDeflection }`;
            //this._debug.innerText = `angle=${ pitchAngle }, deflection=${ wingDeflection }`;

            this.gameObject.publish("guidance", {
                rudder: rudderDeflection,
                wing: wingDeflection,
            });
        }
    }
}
