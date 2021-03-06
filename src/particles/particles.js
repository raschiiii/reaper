import * as THREE from "three";

import { ParticleSystem } from "./particle-system.js";

const HEXAGON = new THREE.TextureLoader().load("assets/textures/hexagon.png");
const RECTANGLE = new THREE.TextureLoader().load("assets/textures/rectangle.png");

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
                audioLoader.load("assets/audio/explosion.mp3", (data) => resolve(data), null, reject);
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
            (window.innerHeight / (2.0 * Math.tan((0.5 * 60.0 * Math.PI) / 180.0))) * camera.zoom;
        this._updateParticles(dt);
        this._updateGeometry();
    }
}

export class Spark extends ParticleSystem {
    constructor(parent) {
        super(parent, {
            numParticles: 400,
            particleLifetime: 0.75,
            particlesPerSecond: 20,
            textureAsset: RECTANGLE,
            blending: THREE.AdditiveBlending,
            alphaDegrading: 0.05,
            scaleValue: 0,
            particlesPerImpact: 30,
            gravity: true,
        });
        //        this._gravity = true;
    }

    impact(pos) {
        for (let i = 0; i < this.params.particlesPerImpact; i++) {
            let unused = this._findUnusedParticle();

            const particle = this._particles[unused];

            particle.position.copy(pos);

            particle.velocity.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
            particle.velocity.normalize();
            particle.velocity.multiplyScalar(7);

            particle.lifetime = this.params.particleLifetime;
            particle.size = 0.15;
            particle.rotation = 0;
            particle.alpha = 0.5;
            particle.color = new THREE.Color("orange");
        }
    }

    update(dt, camera) {
        this._points.material.uniforms.pointMultiplier.value =
            (window.innerHeight / (2.0 * Math.tan((0.5 * 60.0 * Math.PI) / 180.0))) * camera.zoom;
        this._updateParticles(dt);
        this._updateGeometry();
    }
}

export class BasicSmoke extends ParticleSystem {
    constructor(parent, params, source = new THREE.Vector3()) {
        super(parent, params);
        this._source = source;
    }

    _createParticle(unused) {
        const particle = this._particles[unused];
        particle.position.x = this._source.x + this.params.spread * Math.random() - this.params.spread / 2;
        particle.position.y = this._source.y + this.params.spread * Math.random() - this.params.spread / 2;
        particle.position.z = this._source.z + this.params.spread * Math.random() - this.params.spread / 2;
        particle.velocity.copy(this.params.velocity);
        particle.lifetime = this.params.particleLifetime * THREE.MathUtils.randFloat(0.75, 1.0);
        particle.size = this.params.startSize;
        particle.color = new THREE.Color();
        particle.alpha = this.params.alphaStartValue;
        particle.lerpValue = 0.0;
    }

    _updateParticles(dt) {
        for (let i = 0; i < this.params.numParticles; i++) {
            const particle = this._particles[i];

            if (particle.lifetime > 0) {
                particle.lifetime -= dt;

                if (particle.lifetime > 0) {
                    const wind = 1 + (1 - particle.lifetime / this.params.particleLifetime) * 3;
                    if (this._gravity) particle.velocity.y -= 9.81 * dt;
                    particle.position.x += particle.velocity.x * dt * wind;
                    particle.position.y += particle.velocity.y * dt;
                    particle.position.z += particle.velocity.z * dt * wind;
                    particle.size += this.params.scaleValue * dt;
                    particle.alpha -= this.params.alphaDegrading * dt;
                    particle.rotation += dt * this.params.rotationValue;
                    particle.lerpValue += (1.0 / this.params.colorTransition) * dt;
                    particle.lerpValue = Math.min(particle.lerpValue, 1.0);
                    particle.color.lerpColors(this.params.startColor, this.params.endColor, particle.lerpValue);
                } else {
                    particle.position.copy(this._cache);
                    particle.alpha = 0;
                }
            }
        }
    }
}

export class Smoke extends BasicSmoke {
    constructor(parent, source = new THREE.Vector3()) {
        super(
            parent,
            {
                numParticles: 200,
                particleLifetime: 15,
                particlesPerSecond: 1.5,
                //texture: "assets/textures/hexagon.png",
                textureAsset: HEXAGON,
                blending: THREE.AdditiveBlending,
                alphaDegrading: 0.0,
                alphaStartValue: 1.0,
                startSize: 0.75,
                scaleValue: 0.3,
                rotationValue: 0.1,
                colorTransition: 2.0,
                startColor: new THREE.Color("orange"),
                endColor: new THREE.Color(0x2c2c2c),
                spread: 0,
                velocity: new THREE.Vector3(0.1, 0.7, 0.1),
            },
            source
        );
    }
}

export class SmokeTrail extends BasicSmoke {
    constructor(parent, source = new THREE.Vector3()) {
        super(
            parent,
            {
                numParticles: 1000,
                particleLifetime: 20,
                particlesPerSecond: 50,
                textureAsset: HEXAGON,
                blending: THREE.AdditiveBlending,
                alphaDegrading: 1.0,
                alphaStartValue: 1.0,
                startSize: 0.1,
                rotationValue: 0.0,
                scaleValue: 0.5,
                colorTransition: 0.2,
                startColor: new THREE.Color("orange"),
                endColor: new THREE.Color(0x2c2c2c),
                spread: 0.125,
                velocity: new THREE.Vector3(0.1, 0.2, 0),
            },
            source
        );
    }
}

export class Explosion2 extends BasicSmoke {
    constructor(parent, listener) {
        super(parent, {
            numParticles: 500,
            particleLifetime: 2.5,
            particlesPerSecond: 20,
            //texture: "assets/textures/hexagon.png",
            textureAsset: HEXAGON,
            blending: THREE.AdditiveBlending,
            particlesPerImpact: 3,
            alphaDegrading: 0.0,
            alphaStartValue: 1.0,
            startSize: 0.1,
            rotationValue: 1.0,
            scaleValue: 0.7,
            colorTransition: 2,
            startColor: new THREE.Color("orange"),
            endColor: new THREE.Color(0x2c2c2c),
            spread: 0.125,
            velocity: new THREE.Vector3(0.1, 0.3, 0),
        });

        (async () => {
            const audioLoader = new THREE.AudioLoader();
            const buffer = await new Promise((resolve, reject) => {
                audioLoader.load("assets/audio/explosion.mp3", (data) => resolve(data), null, reject);
            });

            this.sound = new THREE.PositionalAudio(listener);
            this.sound.setBuffer(buffer);
            this.sound.setRefDistance(20);
            parent.add(this.sound);
        })();
    }

    impact(pos) {
        if (this.sound) {
            if (this.sound.isPlaying) {
                this.sound.stop();
                this.sound.play();
            } else {
                this.sound.play();
            }
        }

        for (let i = 0; i < this.params.particlesPerImpact; i++) {
            let unused = this._findUnusedParticle();

            const particle = this._particles[unused];

            particle.position.copy(pos);

            /*
            let t1 = 2.5;
            let t2 = t1 / 2;
            particle.velocity.set(
                -t1 * Math.random() - t2,
                -2 * (t1 * Math.random() - t2),
                -t1 * Math.random() - t2
            );
            */

            /*
            particle.velocity.set(
                Math.random() * 0.5,
                Math.random() * 1.0,
                Math.random() * 0.5
            );
            */

            particle.velocity.set(0, 0.4, 0);

            particle.lifetime = this.params.particleLifetime;
            particle.size = (i + 1) * 1.5;
            particle.alpha = this.params.alphaStartValue;
            particle.color = new THREE.Color();
            particle.lerpValue = 0.0;
        }
    }

    update(dt, camera) {
        this._points.material.uniforms.pointMultiplier.value =
            (window.innerHeight / (2.0 * Math.tan((0.5 * 60.0 * Math.PI) / 180.0))) * camera.zoom;
        this._updateParticles(dt);
        this._updateGeometry();
    }
}
