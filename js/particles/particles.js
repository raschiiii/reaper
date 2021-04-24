import * as THREE from "../three/build/three.module.js";

import { ParticleSystem } from "./particle-system.js";

export class Explosion extends ParticleSystem {
    constructor(parent, texturePath, listener) {
        super(parent, {
            numParticles: 1000,
            particleLifetime: 15,
            particlesPerSecond: 20,
            texture: texturePath,
            blending: THREE.NormalBlending,
            alphaDegrading: 0.1,
        });

        this._gravity = false;
        this.params.alphaDegrading = 1;
        this.params.scaleValue = 0.5;
        this.particlesPerImpact = 5;

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

            let t1 = 0,
                t2 = 0;
            this._particles[unused].velocity.set(
                t1 * Math.random() - t2,
                t1 * Math.random() - t2 * 2,
                t1 * Math.random() - t2
            );

            this._particles[unused].lifetime = this.params.particleLifetime;
            this._particles[unused].size = 2.0;
            this._particles[unused].alpha = 1.0;
            this._particles[unused].color = new THREE.Color("orange");
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

export class Explosion2 extends ParticleSystem {
    constructor(parent) {
        super(parent, {
            numParticles: 100,
            particleLifetime: 5,
            particlesPerSecond: 20,
            texture: "../assets/textures/hexagon.png",
            blending: THREE.NormalBlending,
            alphaDegrading: 0.1,
            scaleValue: 0.5,
            particlesPerImpact: 3,
        });
    }

    impact(pos) {
        for (let i = 0; i < this.params.particlesPerImpact; i++) {
            let unused = this._findUnusedParticle();
            this._particles[unused].position.copy(pos);

            let t1 = 0,
                t2 = 0;
            this._particles[unused].velocity.set(
                t1 * Math.random() - t2,
                t1 * Math.random() - t2 * 2,
                t1 * Math.random() - t2
            );

            this._particles[unused].lifetime = this.params.particleLifetime;
            this._particles[unused].size = i + 1;
            this._particles[unused].alpha = 0.5;
            this._particles[unused].color = new THREE.Color("orange");
        }
    }

    update(dt, camera) {
        this._points.material.uniforms.pointMultiplier.value =
            (window.innerHeight /
                (2.0 * Math.tan((0.5 * 60.0 * Math.PI) / 180.0))) *
            camera.zoom;
        this._updateParticles(dt);
        this._updateGeometry();
    }
}

export class Impact extends ParticleSystem {
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
            /*
            numParticles: 1000,
            particleLifetime: 15,
            particlesPerSecond: 10,
            texture: "./assets/textures/hexagon.png",
            blending: THREE.NormalBlending,
            alphaDegrading: 0.05,
            startSize: 0.1,
            scaleValue: 0.2
            */

            numParticles: 200,
            particleLifetime: 15,
            particlesPerSecond: 0.5,
            texture: "./assets/textures/hexagon.png",
            blending: THREE.NormalBlending,
            alphaDegrading: 0.0,
            startSize: 0.1,
            scaleValue: 0.2,

            lerpV: 0.1,
        });
        this._source = source;

        this.startColor = new THREE.Color("orange");
        this.endColor = new THREE.Color("grey");
    }

    _createParticle(unused) {
        this._particles[unused].position.x =
            this._source.x + 0.25 * Math.random() - 0.125;
        this._particles[unused].position.y =
            this._source.y + 0.25 * Math.random() - 0.125;
        this._particles[unused].position.z =
            this._source.z + 0.25 * Math.random() - 0.125;

        this._particles[unused].velocity.set(0.0, 0.7, 0);
        this._particles[unused].lifetime = this.params.particleLifetime;
        this._particles[unused].size = this.params.startSize * Math.random();
        this._particles[unused].color = new THREE.Color();
        this._particles[unused].alpha = 0.5;

        this._particles[unused].lerpValue = 0.0;
    }

    _updateParticles(dt) {
        for (let i = 0; i < this.params.numParticles; i++) {
            const particle = this._particles[i];

            if (particle.lifetime > 0) {
                particle.lifetime -= dt;

                if (particle.lifetime > 0) {
                    particle.position.x += particle.velocity.x * dt;
                    particle.position.y += particle.velocity.y * dt;
                    particle.position.z += particle.velocity.z * dt;

                    if (this._gravity) particle.velocity.y -= 9.81 * dt;

                    particle.size += this.params.scaleValue * dt;
                    particle.alpha -= this.params.alphaDegrading * dt;
                    particle.lerpValue += (1.0 / 7.0) * dt;

                    //particle.lerpValue = Math.min(particle.lerpValue, 1.0);
                    particle.color.lerpColors(
                        this.startColor,
                        this.endColor,
                        particle.lerpValue
                    );

                    /*
                    this._particles[i].color.lerpColors(
                        this.startColor,
                        this.endColor,
                        this._particles[i].lifetime /
                            this.params.particleLifetime
                    );
                    */

                    //console.log(this._particles[i].lifetime / this.params.particleLifetime)dd
                } else {
                    particle.position.copy(this._cache);
                    particle.alpha = 0;
                }
            }
        }
    }
}

export class SmokeTrail extends ParticleSystem {
    constructor(parent, source = new THREE.Vector3()) {
        super(parent, {
            numParticles: 500,
            particleLifetime: 2,
            particlesPerSecond: 200,
            texture: "assets/textures/hexagon.png",
            blending: THREE.NormalBlending,
            alphaDegrading: 1.0,
            startSize: 0.1,
            scaleValue: 0.5,
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
        this._particles[unused].lifetime = this.params.particleLifetime;
        this._particles[unused].size = this.params.startSize * Math.random();
        this._particles[unused].color = new THREE.Color();
        this._particles[unused].alpha = 1 - Math.random() * 2;
    }
}
