import * as THREE from '../three/build/three.module.js';
import { FlightmodelODE } from './flightmodel-ode.js';
import { ODESolver } from './physics.js';

export class Cessna extends FlightmodelODE {
    constructor(gameObject, pos, vel){
        super(gameObject, {
            x: pos.x * 10.0,
            y: pos.z * 10.0,
            z: pos.y * 10.0,

            vx: vel.x * 10,
            vy: vel.z * 10,
            vz: vel.y * 10,

            wingArea: 16.2,
            wingSpan: 10.9,
            tailArea: 2.0,
            clSlope0: 0.0889,
            clSlope1: -0.1,
            cl0: 0.178,
            cl1: 3.2,
            alphaClMax: 16.0,
            cdp: 0.034,
            eff: 0.77,
            mass: 1114.0,
            engineRps: 40.0,
            enginePower: 11931.0,
            propDiameter: 1.905,
            a: 1.83,
            b: -1.32
        });

        let alpha = document.querySelector('#alpha');
        let bank = document.querySelector('#bank');

        let that = this;
        let thrustSlider = document.querySelector('#slider3');
        thrustSlider.oninput = function() {
            that.throttle = this.value;
            throttle.innerText = that.throttle
        } 

        let bankSlider = document.querySelector('#slider2');
        bankSlider.oninput = function() {
            that.bank  = this.value / 10 
            bank.innerText = that.bank / 10
        } 

        let aoaSlider = document.querySelector('#slider1');
        aoaSlider.oninput = function() {
            that.alpha  = this.value / 10
            alpha.innerText = that.alpha
        } 
    }
}