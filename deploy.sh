#!/bin/bash

build=build.zip
remote=neuromancer:/var/www/vaporware.ga/reaper/

zip -ur $build assets/ 

zip -ur $build index.html
zip -ur $build js/*.js 
zip -ur $build js/terrain/ src/physics/ src/particles/ 
zip -ur $build js/components/ src/engine/ src/collision/  

zip -ur $build LICENSE

# zip -ur $build js/three/build/three.module.js 
# zip -ur $build js/three/examples/jsm/libs/stats.module.js 
# zip -ur $build js/three/examples/jsm/controls/OrbitControls.js
# zip -ur $build js/three/examples/jsm/loaders/GLTFLoader.js 
# zip -ur $build js/three/examples/jsm/postprocessing/* 
# zip -ur $build js/three/examples/jsm/shaders/* 

scp $build $remote

rm -f $build
