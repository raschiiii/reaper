import * as THREE from "../three/build/three.module.js";

const _VS = `
uniform float pointMultiplier;
attribute float size;
attribute float angle;
attribute vec4 colour;
varying vec4 vColour;
varying vec2 vAngle;

void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = size * pointMultiplier / gl_Position.w;
    vAngle = vec2(cos(angle), sin(angle));
    vColour = colour;
}`;

const _FS = `
uniform sampler2D diffuseTexture;
varying vec4 vColour;
varying vec2 vAngle;

void main() {
    vec2 coords = (gl_PointCoord - 0.5) * mat2(vAngle.x, vAngle.y, -vAngle.y, vAngle.x) + 0.5;
    gl_FragColor = texture2D(diffuseTexture, coords) * vColour;
}`;

export class ParticleSystem {
    constructor(parent, params) {
        this.params = params;

        this._lastUsedParticle = 0;
        this._elapsed = 0;
        this._gravity = false;
        this._duration = 1.0 / params.particlesPerSecond;
        this._cache = new THREE.Vector3(0, 0, 0);
        this.active = true;
        this._particles = [];
        this._zoom = 1;

        for (let i = 0; i < this.params.numParticles; i++) {
            this._particles.push({
                position: new THREE.Vector3(0, 0, 0),
                lifetime: -1,
                size: this.params.startSize,
                rotation: Math.random() * 2.0 * Math.PI,
                color: new THREE.Color(),
                velocity: new THREE.Vector3(),
                alpha: 0,
            });
        }

        const uniforms = {
            diffuseTexture: {
                value: new THREE.TextureLoader().load(params.texture), // TODO update this
            },
            pointMultiplier: {
                value:
                    (window.innerHeight /
                        (2.0 * Math.tan((0.5 * 60.0 * Math.PI) / 180.0))) *
                    this._zoom,
            },
        };

        // depth test with log depth buffer does not work correctly in linux/firefox
        this._material = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: _VS,
            fragmentShader: _FS,
            depthTest: false, // TODO fix this, does not work
            depthWrite: false,
            blending: params.blending,
            transparent: true,
            vertexColors: true,
        });

        this._geometry = new THREE.BufferGeometry();
        this._geometry.computeBoundingSphere();
        this._geometry.boundingSphere.set(this._cache, 16000);
        this._points = new THREE.Points(this._geometry, this._material);

        this._updateGeometry();
        parent.add(this._points);
    }

    destroy() {
        this._points.material.dispose();
        this._points.geometry.dispose();
        this._points.parent.remove(this._points);
    }

    _findUnusedParticle() {
        for (
            let i = this._lastUsedParticle;
            i < this.params.numParticles;
            i++
        ) {
            if (this._particles[i].lifetime <= 0) {
                this._lastUsedParticle = i;
                return i;
            }
        }
        for (let i = 0; i < this._lastUsedParticle; i++) {
            if (this._particles[i].lifetime <= 0) {
                this._lastUsedParticle = i;
                return i;
            }
        }
        this._lastUsedParticle = 0;
        return 0;
    }

    _updateGeometry() {
        const positions = [];
        const sizes = [];
        const colours = [];
        const angles = [];

        for (let p of this._particles) {
            positions.push(p.position.x, p.position.y, p.position.z);
            colours.push(p.color.r, p.color.g, p.color.b, p.alpha);
            sizes.push(p.size);
            angles.push(p.rotation);
        }

        this._points.geometry.setAttribute(
            "position",
            new THREE.Float32BufferAttribute(positions, 3)
        );
        this._points.geometry.setAttribute(
            "size",
            new THREE.Float32BufferAttribute(sizes, 1)
        );
        this._points.geometry.setAttribute(
            "angle",
            new THREE.Float32BufferAttribute(angles, 1)
        );
        this._points.geometry.setAttribute(
            "colour",
            new THREE.Float32BufferAttribute(colours, 4)
        );
        this._points.geometry.attributes.position.needsUpdate = true;
        this._points.geometry.attributes.size.needsUpdate = true;
        this._points.geometry.attributes.colour.needsUpdate = true;
        this._points.geometry.attributes.angle.needsUpdate = true;
    }

    _createParticle(unused) {
        const particle = this._particles[unused];
        particle.position.set(0, 1, 0);
        particle.velocity.set(0, 1, 0);
        particle.lifetime = this.params.particleLifetime;
        particle.size = this.params.startSize;
        particle.color = new THREE.Color();
        particle.alpha = 1;
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
                } else {
                    particle.position.copy(this._cache);
                    particle.alpha = 0;
                }
            }
        }
    }

    _createParticles(dt) {
        this._elapsed += dt;

        if (this._elapsed >= this._duration && this.active) {
            let numNewParticles = Math.floor(this._elapsed / this._duration);
            if (numNewParticles > this.params.particlesPerSecond)
                numNewParticles = this.params.particlesPerSecond;

            for (let i = 0; i < numNewParticles; i++) {
                this._createParticle(this._findUnusedParticle());
            }
            this._elapsed = 0;
        }
    }

    update(dt, camera) {
        this._points.material.uniforms.pointMultiplier.value =
            (window.innerHeight /
                (2.0 * Math.tan((0.5 * 60.0 * Math.PI) / 180.0))) *
            camera.zoom;

        this._createParticles(dt);
        this._updateParticles(dt);
        this._updateGeometry();
    }
}
