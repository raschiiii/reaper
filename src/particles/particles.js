import * as THREE from "../three/build/three.module.js";

import { ParticleSystem } from "./particle-system.js";

export class Explosion extends ParticleSystem {
    constructor(parent, texturePath, listener) {
        super(parent, {
            numParticles: 1000,
            particleLifetime: 15,
            particlesPerSecond: 20,
            texture: texturePath,
            blending: THREE.AdditiveBlending,
            alphaDegrading: 0.1,
        });

        this._gravity = false;
        this.alphaDegrading = 1;
        this.scaleValue = 0.5;
        this.particlesPerImpact = 200;

        this.light = new THREE.PointLight(0x000000, 5, 5, 2);
        parent.add(this.light);
        this.light.color.setHex(0x000000);
        this.on = false;

        this.counter = 0;
        this.duration = 0.05;

        (async () => {
            const audioLoader = new THREE.AudioLoader();
            const buffer = await new Promise((resolve, reject) => {
                audioLoader.load(
                    "assets/audio/explosion.mp3",
                    (data) => resolve(data),
                    null,
                    reject
                );
            });
            this.sound = new THREE.PositionalAudio(listener);
            this.sound.setBuffer(buffer);
            this.sound.setRefDistance(20);
            parent.add(this.sound);
        })();
    }

    impact(pos) {
        this.light.position.copy(pos);
        this.on = true;
        this.counter = 0;
        this.light.color.setHex(0xffffff);

        if (this.sound) {
            if (this.sound.isPlaying) {
                this.sound.stop();
                this.sound.play();
            } else {
                this.sound.play();
            }
        }

        for (let i = 0; i < this.particlesPerImpact; i++) {
            let unused = this._findUnusedParticle();
            this._particles[unused].position.copy(pos);

            let t1 = 20,
                t2 = 10;
            this._particles[unused].velocity.set(
                t1 * Math.random() - t2,
                t1 * Math.random() - t2 * 2,
                t1 * Math.random() - t2
            );

            this._particles[unused].lifetime = this.particleLifetime;
            this._particles[unused].size = 2.0;
            this._particles[unused].alpha = 1.0;
        }
    }

    update(dt, camera) {
        if (this.on) {
            this.counter += dt;
            if (this.counter >= this.duration) {
                this.light.color.setHex(0x000000);
                this.on = false;
                this.counter = 0;
            }
        }

        this._points.material.uniforms.pointMultiplier.value =
            (window.innerHeight /
                (2.0 * Math.tan((0.5 * 60.0 * Math.PI) / 180.0))) *
            camera.zoom;

        this._updateParticles(dt);
        this._updateGeometry();
    }
}

export class BulletImpact extends ParticleSystem {
    constructor(parent, texturePath) {
        super(parent, {
            numParticles: 100,
            particleLifetime: 1,
            particlesPerSecond: 1,
            texture: texturePath,
            blending: THREE.AdditiveBlending,
        });

        this._gravity = true;
        this.alphaDegrading = 1;
        this.scaleValue = 0.05;
        this.particlesPerImpact = 5;
    }

    impact(pos) {
        for (let i = 0; i < this.particlesPerImpact; i++) {
            let unused = this._findUnusedParticle();
            this._particles[unused].position.copy(pos);

            let t1 = 10,
                t2 = 5;
            this._particles[unused].velocity.set(
                t1 * Math.random() - t2,
                t1 * Math.random() - t2,
                t1 * Math.random() - t2
            );

            this._particles[unused].lifetime = this.particleLifetime;
            this._particles[unused].size = 0.1;
            this._particles[unused].alpha = 1;
        }
    }

    update(dt) {
        this._updateParticles(dt);
        this._updateGeometry();
    }
}

export class Smoke extends ParticleSystem {
    constructor(parent, source = new THREE.Vector3()) {
        super(parent, {
            numParticles: 1000,
            particleLifetime: 15,
            particlesPerSecond: 10,
            texture: "./assets/textures/smoke.png",
            blending: THREE.NormalBlending,
            alphaDegrading: 0,
            startSize: 0.1,
            scaleValue: 0.2,
        });
        this._source = source;
    }

    _createParticle(unused) {
        this._particles[unused].position.x =
            this._source.x + 0.25 * Math.random() - 0.125;
        this._particles[unused].position.y =
            this._source.y + 0.25 * Math.random() - 0.125;
        this._particles[unused].position.z =
            this._source.z + 0.25 * Math.random() - 0.125;

        this._particles[unused].velocity.set(0.1, 0.5, 0);
        this._particles[unused].lifetime = this.particleLifetime;
        this._particles[unused].size = this.startSize * Math.random();
        this._particles[unused].color = new THREE.Color();
        this._particles[unused].alpha = 1 * Math.random();
    }
}

export class SmokeTrail extends ParticleSystem {
    constructor(parent, source = new THREE.Vector3()) {
        super(parent, {
            numParticles: 1000,
            particleLifetime: 2,
            particlesPerSecond: 500,
            texture: "assets/textures/smoke.png",
            blending: THREE.NormalBlending,
            alphaDegrading: 0.5,
            startSize: 0.1,
            scaleValue: 1,
        });

        this._spread = 0.25;
        this._source = source;
    }

    _createParticle(unused) {
        this._particles[unused].position.x =
            this._source.x + this._spread * Math.random() - this._spread / 2;
        this._particles[unused].position.y =
            this._source.y + this._spread * Math.random() - this._spread / 2;
        this._particles[unused].position.z =
            this._source.z + this._spread * Math.random() - this._spread / 2;

        this._particles[unused].velocity.set(0.1, 0.3, 0);
        this._particles[unused].lifetime = this.particleLifetime;
        this._particles[unused].size = this.startSize * Math.random();
        this._particles[unused].color = new THREE.Color();
        this._particles[unused].alpha = 1 - Math.random() * 2;
    }
}
