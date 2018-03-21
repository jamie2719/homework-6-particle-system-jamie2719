import {vec3, vec4, mat3, mat4, vec2} from 'gl-matrix';
import * as Stats from 'stats-js';
import * as DAT from 'dat-gui';
import Square from './geometry/Square';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';
import Particle from './geometry/Particle';
import Mesh from './geometry/Mesh'

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  numParticles: 20,
  forceDirection: 'attract',
  dragScale: .2,
  meshAttractor: 'None',
  Reset: function() { loadScene() }
  
};

let square: Square;
let time: number = 0.0;
let particles: Array<Particle>;
let offsetsArray: Array<number>;
let colorsArray: Array<number>;
let n = 0;
let currMouse: vec4;
let currDir: boolean = true;
let clicked: boolean = false;
let cube: Mesh;
let triangle: Mesh;
let dodec: Mesh;

function loadScene() {
  clicked = false;
  square = new Square();
  square.create();
  particles = new Array<Particle>();
  offsetsArray = new Array<number>();
  colorsArray = new Array<number>();
  currMouse = vec4.fromValues(0, 0, 0, 1);

  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  var gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  
  var triStr = document.getElementById('triangle.obj').innerHTML;
  triangle = new Mesh(triStr, vec3.fromValues(0, 0, 0));
  triangle.create();

  var cubeStr = document.getElementById('cube.obj').innerHTML;
  cube = new Mesh(cubeStr, vec3.fromValues(0, 0, 0));
  cube.create();

  var dodecStr = document.getElementById('dodecahedron.obj').innerHTML;
  dodec = new Mesh(dodecStr, vec3.fromValues(0, 0, 0));
  dodec.create();

  var scaleMat = mat4.create();
  scaleMat = mat4.fromScaling(scaleMat, vec3.fromValues(10, 10, 10));

  for(var i = 0; i < triangle.positions.length; i += 4) {
    var currPos = vec4.fromValues(triangle.positions[i], triangle.positions[i+1], triangle.positions[i+2], triangle.positions[i+3]);
    currPos = vec4.transformMat4(currPos, currPos, scaleMat);
    triangle.positions[i] = currPos[0];
    triangle.positions[i+1] = currPos[1];
    triangle.positions[i+2] = currPos[2];
  }

  for(var i = 0; i < dodec.positions.length; i += 4) {
    var currPos = vec4.fromValues(dodec.positions[i], dodec.positions[i+1], dodec.positions[i+2], dodec.positions[i+3]);
    currPos = vec4.transformMat4(currPos, currPos, scaleMat);
    dodec.positions[i] = currPos[0];
    dodec.positions[i+1] = currPos[1];
    dodec.positions[i+2] = currPos[2];
  }



  n= controls.numParticles;
  for(let i = 0; i < n; i++) {
    for(let j = 0; j < n; j++) {
      var randX = (Math.random() * 2 - 1)/100;
      var randY = (Math.random() * 2 - 1)/100;
      var randZ = (Math.random() * 2 - 1)/100;

      //initialize all particles with 0 acceleration
      var currParticle = new Particle(vec3.fromValues(i, j, 0), vec3.fromValues(0, 0, 0), vec3.fromValues(0, 0, 0));
      particles.push(currParticle);
      offsetsArray.push(i);
      offsetsArray.push(j);
      offsetsArray.push(0);

      colorsArray.push(i / n);
      colorsArray.push(j / n);
      colorsArray.push(1.0);
      colorsArray.push(1.0); // Alpha channel

    }
  }
  let offsets: Float32Array = new Float32Array(offsetsArray);
  let colors: Float32Array = new Float32Array(colorsArray);


  square.setInstanceVBOs(offsets, colors);
  square.setNumInstances(n * n); // 10x10 grid of "particles"
}

function raycast(camera: Camera, screenPos: vec2) : vec3 {
  var eye =  camera.position;
  var fov = camera.fovy;
  var ref = camera.target;

  var sx = (screenPos[0]);
  var sy = (screenPos[1]);
  var alpha = fov / 2.0 * (Math.PI / 180);
  var forward = vec3.create();
  var right = vec3.create();
  var localUp = vec3.create();

  forward = camera.forward;
  right = camera.right;
  localUp = camera.up;

  var A = camera.aspectRatio;

  //convert screen point to world point
  var len = 0.1;
  var V = vec3.create();
  V = vec3.scale(V, localUp, len * Math.tan(alpha));
  var H = vec3.create();
  H = vec3.scale(H, right, len * A * Math.tan(alpha));
  H = vec3.scale(H, H, sx);
  V = vec3.scale(V, V, sy);
  H = vec3.add(H, H, V);
  var p = vec3.create();
  forward = vec3.scale(forward, forward, len);
  p = vec3.add(p, eye, forward);


  var p = vec3.add(p, p, H); //world point 

  //get ray from world point
  var dir = vec3.create();
  dir = vec3.subtract(dir, p, eye);
  dir = vec3.normalize(dir, dir);
  var origin = eye;
  return dir;
}



function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  // Add controls to the gui
  const gui = new DAT.GUI();
  gui.add(controls, 'numParticles', 0, 30).step(2);
  var forceDir = gui.add(controls, 'forceDirection', [ 'attract', 'repel'] );
  gui.add(controls, 'dragScale', 0, 1).step(.1);
  gui.add(controls, 'meshAttractor', ['None', 'Triangle', 'Cube', 'Dodecahedron']);
  gui.add(controls, 'Reset');
  

  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');

  
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene
  loadScene();

  const camera = new Camera(vec3.fromValues(50, 50, 10), vec3.fromValues(50, 50, 0));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.2, 0.2, 0.2, 1);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE); // Additive blending

  const lambert = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/particle-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/particle-frag.glsl')),
  ]);

  // This function will be called every frame
  function tick() {
    camera.update();
    renderer.setClearColor(.02, (Math.sin(time*.01) + 1) / 10.0, (Math.cos(time*.01) + 1) / 4.0, 1);

    if(controls.meshAttractor == 'None') {
      if(clicked) {
        for(var i = 0; i < particles.length; i++) {
      
            particles[i].updateAcceleration(vec3.fromValues(currMouse[0], currMouse[1], currMouse[2]), currDir, controls.dragScale); 
            particles[i].curr_p = particles[i].updatePosition(.1);
            //update vbo array
            offsetsArray[3*i] = particles[i].curr_p[0];
            offsetsArray[3*i+1] = particles[i].curr_p[1];
            offsetsArray[3*i+2] = particles[i].curr_p[2];
      }
    }
    

        let offsets: Float32Array = new Float32Array(offsetsArray);
        let colors: Float32Array = new Float32Array(colorsArray);
        square.setInstanceVBOs(offsets, colors);
        square.setNumInstances(n * n); 
    
    }

    else if(controls.meshAttractor == 'Triangle') {
      //for each vertex in mesh
      var currParticleIndex = 0; //needs to be 8 for cube
      while(currParticleIndex < particles.length) {
        for(var i = 0; i < triangle.positions.length; i+=4) {
          if(currParticleIndex >= particles.length) {
            break;
          }
          //calculate acceleration for curr particle to accelerate towards curr vertex
          particles[currParticleIndex].updateAcceleration(vec3.fromValues(triangle.positions[i], triangle.positions[i+1], triangle.positions[i+2]), true, controls.dragScale);
          currParticleIndex++;
        }
      }
      for(var i = 0; i < particles.length; i++) {
        particles[i].curr_p = particles[i].updatePosition(.1);
        //update vbo array
        offsetsArray[3*i] = particles[i].curr_p[0];
        offsetsArray[3*i+1] = particles[i].curr_p[1];
        offsetsArray[3*i+2] = particles[i].curr_p[2];
      }
        let offsets: Float32Array = new Float32Array(offsetsArray);
        let colors: Float32Array = new Float32Array(colorsArray);
        square.setInstanceVBOs(offsets, colors);
        square.setNumInstances(n * n); 
        clicked = true;
    }
    
    else if(controls.meshAttractor == 'Cube') {
    //for each vertex in mesh
    var currParticleIndex = 0; //needs to be 8 for cube
    while(currParticleIndex < particles.length) {
      for(var i = 0; i < cube.positions.length; i+=4) {
        if(currParticleIndex >= particles.length) {
          break;
        }
        //calculate acceleration for curr particle to accelerate towards curr vertex
        particles[currParticleIndex].updateAcceleration(vec3.fromValues(cube.positions[i], cube.positions[i+1], cube.positions[i+2]), true, controls.dragScale);
        currParticleIndex++;
      }
    }
    for(var i = 0; i < particles.length; i++) {
      particles[i].curr_p = particles[i].updatePosition(.1);
      //update vbo array
      offsetsArray[3*i] = particles[i].curr_p[0];
      offsetsArray[3*i+1] = particles[i].curr_p[1];
      offsetsArray[3*i+2] = particles[i].curr_p[2];
    }
      let offsets: Float32Array = new Float32Array(offsetsArray);
      let colors: Float32Array = new Float32Array(colorsArray);
      square.setInstanceVBOs(offsets, colors);
      square.setNumInstances(n * n); 
      clicked = true;
  }

  else if(controls.meshAttractor == 'Dodecahedron') {
    //for each vertex in mesh
    var currParticleIndex = 0; //needs to be 8 for cube
    while(currParticleIndex < particles.length) {
      for(var i = 0; i < dodec.positions.length; i+=4) {
        //console.log(currParticleIndex);
        if(currParticleIndex >= particles.length) {
          break;
        }
        //calculate acceleration for curr particle to accelerate towards curr vertex
        particles[currParticleIndex].updateAcceleration(vec3.fromValues(dodec.positions[i], dodec.positions[i+1], dodec.positions[i+2]), true, controls.dragScale);
        currParticleIndex++;
      }
    }
    for(var i = 0; i < particles.length; i++) {
      particles[i].curr_p = particles[i].updatePosition(.1);
      //update vbo array
      offsetsArray[3*i] = particles[i].curr_p[0];
      offsetsArray[3*i+1] = particles[i].curr_p[1];
      offsetsArray[3*i+2] = particles[i].curr_p[2];
    }
      let offsets: Float32Array = new Float32Array(offsetsArray);
      let colors: Float32Array = new Float32Array(colorsArray);
      square.setInstanceVBOs(offsets, colors);
      square.setNumInstances(n * n); 
      clicked = true;
  }


    stats.begin();
    lambert.setTime(time++);
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();
    renderer.render(camera, lambert, [
      square,
    ]);
    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();

  //add event listener for mouse click
  window.addEventListener("click", function (event) {
    if(event.altKey) {
      clicked = true;
      var mouse2 = vec2.fromValues(event.x, event.y); //pixel space
      mouse2[0] = mouse2[0] * 2.0 / window.innerWidth - 1.0; //pixel to NDC (screen)
      mouse2[1] = 1.0 - (mouse2[1] * 2.0 / window.innerHeight);

      //raycast 
      var dir = raycast(camera, mouse2);
      var origin = camera.position;
      //check if this ray from eye intersects unit plane at origin
      var planeNormal = vec3.create();
      planeNormal = vec3.normalize(planeNormal, camera.position);
      var denom = vec3.dot(planeNormal, dir);
      var S = vec3.fromValues(0, 0, 0);
      S = vec3.subtract(S, S, origin);
      var numer = vec3.dot(planeNormal, S);
      var t = numer / denom;

      var worldP = vec3.create();
      worldP = vec3.scale(worldP, dir, t);
      worldP = vec3.add(worldP, origin, worldP);

      currMouse = vec4.fromValues(worldP[0], worldP[1], worldP[2], 1);
      
    }
  });


  forceDir.onFinishChange(function() {
    for(var i = 0; i < particles.length; i++) {
      if(controls.forceDirection == 'attract') {
        currDir = true;
      }
      else {
        currDir = false;
      }
    }
  });

  // Start the render loop
  tick();
}

main();
