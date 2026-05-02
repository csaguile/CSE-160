const VSHADER_SOURCE = `
  attribute vec4 a_Position;
  attribute vec4 a_Color;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  varying vec4 v_Color;
  void main() {
    gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_Color = a_Color;
  }
`;

const FSHADER_SOURCE = `
  precision mediump float;
  varying vec4 v_Color;
  void main() {
    gl_FragColor = v_Color;
  }
`;

let canvas;
let gl;
let a_Position;
let a_Color;
let u_ModelMatrix;
let u_GlobalRotateMatrix;


function setupWebGL() {
  canvas = document.getElementById('webgl');
  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return false;
  }
  gl.enable(gl.DEPTH_TEST);
  return true;
}


function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to initialize shaders.');
    return false;
  }

  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return false;
  }

  a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if (a_Color < 0) {
    console.log('Failed to get the storage location of a_Color');
    return false;
  }

  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return false;
  }

  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if (!u_GlobalRotateMatrix) {
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
    return false;
  }

  return true;
}


function addActionsForHtmlUI() {
  document.getElementById('playAllButton').onclick = function() {
    g_yellowAnimation = g_magentaAnimation = g_tailAnimation = true;
  };
  document.getElementById('stopAllButton').onclick = function() {
    g_yellowAnimation = g_magentaAnimation = g_tailAnimation = false;
  };

  document.getElementById('yellowOnButton').onclick  = function() { g_yellowAnimation  = true;  };
  document.getElementById('yellowOffButton').onclick = function() { g_yellowAnimation  = false; };
  document.getElementById('magentaOnButton').onclick  = function() { g_magentaAnimation = true;  };
  document.getElementById('magentaOffButton').onclick = function() { g_magentaAnimation = false; };

  document.getElementById('angleSlide').addEventListener('mousemove', function() {
    g_globalAngle = Number(this.value);
    renderAllShapes();
  });

  document.getElementById('yellowAngleSlide').addEventListener('mousemove', function() {
    g_yellowAngle = Number(this.value);
    renderAllShapes();
  });

  document.getElementById('magentaAngleSlide').addEventListener('mousemove', function() {
    g_magentaAngle = Number(this.value);
    renderAllShapes();
  });

  document.getElementById('tailOnButton').onclick = function() {
    g_tailAnimation = true;
  };
  
  document.getElementById('tailOffButton').onclick = function() {
    g_tailAnimation = false;
  };
  
  document.getElementById('tailAngleSlide').addEventListener('mousemove', function() {
    g_tailAngle = Number(this.value);
    renderAllShapes();
  });

}


function main() {
  if (!setupWebGL()) return;
  if (!connectVariablesToGLSL()) return;

  addActionsForHtmlUI();

  canvas.onmousedown = function(ev) {
    g_isDragging = true;
    g_lastMouseX = ev.clientX;
    g_lastMouseY = ev.clientY;

    // Trigger poke animation on shift+click
    if (ev.shiftKey) {
      g_pokeTimer = 60;  // ~1 second at 60fps
    }
  };
  canvas.onmouseup   = function()    { g_isDragging = false; };
  canvas.onmouseleave = function()   { g_isDragging = false; };
  canvas.onmousemove = function(ev) {
    if (!g_isDragging) return;
    g_globalAngle  -= (ev.clientX - g_lastMouseX) * 0.5;
    g_globalAngleX -= (ev.clientY - g_lastMouseY) * 0.5;
    g_lastMouseX = ev.clientX;
    g_lastMouseY = ev.clientY;
  };

  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  requestAnimationFrame(tick);
}

let g_globalAngle  = 0;
let g_globalAngleX = 0;
let g_isDragging   = false;
let g_lastMouseX   = 0;
let g_lastMouseY   = 0;
let g_yellowAngle = 0;
let g_magentaAngle = 0;
let g_tailAngle = 0;
let g_tailAnimation = false;
let g_yellowAnimation  = false;
let g_magentaAnimation = false;
let g_pokeTimer        = 0;  // time remaining for poke animation
let g_pokeEyeScale     = 1;   // eye scale during poke
let g_pokeArmAngle    = 0;  // wing angle during poke
let g_pokeBodyY        = 0;  // body jump height during poke
let g_armFlap = 0;
let g_bodyZ    = 0;
let g_startTime     = performance.now() / 1000;
let g_seconds       = 0;
let g_lastFrameTime = performance.now();


function updateAnimationAngles() {
  if (g_yellowAnimation)  g_yellowAngle  = 30 * Math.sin(g_seconds * 1.5);
  if (g_magentaAnimation) g_magentaAngle = 18 * Math.sin(g_seconds * 0.9);
  if (g_tailAnimation) {
    g_tailAngle = 10 * Math.sin(g_seconds * 2);
  }
  g_armFlap = 25 * Math.sin(g_seconds * 2.0);         // always-on: ±10° flap
  g_bodyZ    = 0.02 * Math.sin(g_seconds * 1.2);       // always-on: sway ±0.06 in Z

  // Update poke animation
  if (g_pokeTimer > 0) {
    g_pokeTimer--;
    const t = g_pokeTimer / 60;  // normalized time 0-1
    const shake = Math.sin(g_pokeTimer * 0.5) * 0.1;  // shake oscillation
    g_pokeEyeScale = 1 + 1.5 * Math.sin(t * Math.PI);  // eyes grow big then shrink
    g_pokeArmAngle = 60 * Math.sin(t * Math.PI);      // arm movement
    g_pokeBodyY = 0.15 * Math.sin(t * Math.PI) + shake;  // jump up with shake
  } else {
    g_pokeEyeScale = 1;
    g_pokeArmAngle = 0;
    g_pokeBodyY = 0;
  }
}

function tick() {
  const now = performance.now();
  const fps = Math.round(1000 / (now - g_lastFrameTime));
  g_lastFrameTime = now;

  g_seconds = now / 1000 - g_startTime;
  updateAnimationAngles();

  const renderStart = performance.now();
  renderAllShapes();
  const renderMs = (performance.now() - renderStart).toFixed(2);

  document.getElementById('fps').innerHTML =
    'FPS: ' + fps + '&nbsp;&nbsp;|&nbsp;&nbsp;render: ' + renderMs + ' ms';

  requestAnimationFrame(tick);
}

function renderAllShapes() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const globalRotMat = new Matrix4();
  globalRotMat.setRotate(g_globalAngle, 0, 1, 0);
  globalRotMat.rotate(g_globalAngleX, 1, 0, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  const body = new Cube();
  body.color = [0.15, 0.55, 0.18, 1.0];
  body.matrix.setIdentity();
  body.matrix.translate(0.0, 0.15 + g_pokeBodyY, g_bodyZ);  // add poke jump
  const bodyCoord = new Matrix4(body.matrix); // saved before scale for chain attachments
  body.matrix.scale(0.4, 0.30, 0.28);
  body.render();

  const neck = new Cube();
  neck.color = [0.15, 0.55, 0.18, 1.0];
  neck.matrix = new Matrix4(bodyCoord);
  neck.matrix.translate(0.2, 0.14, 0.0);
  neck.matrix.rotate(g_magentaAngle, 0, 1, 0);
  const neckCoord = new Matrix4(neck.matrix);
  neck.matrix.scale(0.18, 0.5, 0.1);
  neck.render();

  const head = new Cube();
  head.color = [0.15, 0.55, 0.18, 1.0];
  head.matrix = new Matrix4(neckCoord);
  head.matrix.translate(0.04, 0.3, 0.0);
  const headCoord = new Matrix4(head.matrix);
  head.matrix.scale(0.35, 0.4, 0.18);
  head.render();

  const snout = new Cube();
  snout.color = [0.15, 0.55, 0.18, 1.0];
  snout.matrix = new Matrix4(neckCoord);
  snout.matrix.translate(0.08, 0.2, 0.0);
  const snoutCoord = new Matrix4(head.matrix);
  snout.matrix.scale(0.4, 0.2, 0.18);
  snout.render();


  for (const side of [-1, 1]) {
    const eye = new Cylinder();
    eye.color = [0.05, 0.05, 0.08, 1.0];
    eye.matrix = new Matrix4(headCoord);
    eye.matrix.translate(0.03, 0.02, side * 0.09);
    eye.matrix.rotate(90, 1, 0, 0);   // rotate axis so flat face points outward in Z
    eye.matrix.scale(0.04 * g_pokeEyeScale, 0.015 * g_pokeEyeScale, 0.04 * g_pokeEyeScale);  // add poke eye scale
    eye.render();

    // White pupil (poke) 
    if (g_pokeTimer > 0) {
      const pupil = new Cylinder();
      pupil.color = [1.0, 1.0, 1.0, 1.0];
      pupil.matrix = new Matrix4(headCoord);
      pupil.matrix.translate(0.035, 0.02, side * 0.095);
      pupil.matrix.rotate(90, 1, 0, 0);
      // Smaller base but grows proportionally with eye
      pupil.matrix.scale(0.02 * g_pokeEyeScale, 0.04 * g_pokeEyeScale, 0.02 * g_pokeEyeScale);
      pupil.render();
    }
  }

  const tailBase = new Cube();
  tailBase.color = [0.15, 0.53, 0.18, 1.0];
  tailBase.matrix = new Matrix4(bodyCoord);
  tailBase.matrix.translate(-0.24, 0.08, 0.0);
  tailBase.matrix.rotate(g_tailAngle, 0, 0, 1);
  tailBase.matrix.scale(0.2, 0.1, 0.18);
  tailBase.render();


  const tailTri = new Cube();
  tailTri.color = [0.15, 0.53, 0.18, 1.0];
  tailTri.matrix = new Matrix4(bodyCoord);
  tailTri.matrix.translate(-0.26, 0.04, 0.0);
  const tailTricoord = new Matrix4(tailTri.matrix);
  tailTri.matrix.rotate(-30 + g_tailAngle, 0, 0, 1);
    tailTri.matrix.scale(0.39, 0.1, 0.18);
  tailTri.render();
  
  const tailTriTip = new Cube();
  tailTriTip.color = [0.15, 0.53, 0.18, 1.0];
  tailTriTip.matrix = new Matrix4(tailTricoord);
  tailTriTip.matrix.translate(-0.2, 0.2, 0.0);
  tailTriTip.matrix.rotate(-60 - g_tailAngle, 0, 0, 1);
  tailTriTip.matrix.scale(0.29, 0.11, 0.18);
  tailTriTip.render();


  for (const side of [-1, 1]) {
    const arm = new Cube();
    arm.color = [0.15, 0.54+-0.01*side, 0.18, 1.0];
    arm.matrix = new Matrix4(bodyCoord);

    arm.matrix.translate(0.3, 0.0, side * 0.17);
    arm.matrix.rotate(side * (10 - g_armFlap + g_pokeArmAngle), 0, 0, 1);  
    const armCoord = new Matrix4(arm.matrix);
    arm.matrix.scale(0.3, 0.05, 0.12);
    arm.render();

    const hand = new Cube();
    hand.color = [0.15, 0.54+-0.01*side, 0.18, 1.0];
    hand.matrix = new Matrix4(armCoord);
    hand.matrix.translate(0.1, -0.02, 0.0);
    hand.matrix.scale(0.1, 0.09, 0.12);
    hand.render();



  }

  const leftUpper = new Cube();
  leftUpper.color = [0.15, 0.55, 0.18, 1.0];
  leftUpper.matrix = new Matrix4(bodyCoord);
  leftUpper.matrix.translate(-0.1, -0.2, -0.08);
  leftUpper.matrix.rotate(-30, 0, 0, 1);
  leftUpper.matrix.rotate(g_yellowAngle, 0, 0, 1); 
  const leftUpperCoord = new Matrix4(leftUpper.matrix);
  leftUpper.matrix.scale(0.13, 0.25, 0.12);
  leftUpper.render();

  const leftLower = new Cube();
  leftLower.color = [0.15, 0.55, 0.18, 1.0];
  leftLower.matrix = new Matrix4(leftUpperCoord);
  leftLower.matrix.translate(0.02, -0.13, 0.0);
  leftLower.matrix.rotate(30, 0, 0, 1); 
  const leftLowerCoord = new Matrix4(leftLower.matrix);
  leftLower.matrix.scale(0.1, 0.15, 0.09);
  leftLower.render();

  const leftFoot = new Cube();
  leftFoot.color = [0.15, 0.55, 0.18, 1.0];
  leftFoot.matrix = new Matrix4(leftLowerCoord);
  leftFoot.matrix.translate(0.06, -0.10, 0.0);  
  leftFoot.matrix.scale(0.2, 0.05, 0.08);
  leftFoot.render();

  const rightUpper = new Cube();
  rightUpper.color = [0.15, 0.5, 0.18, 1.0];
  rightUpper.matrix = new Matrix4(bodyCoord);
  rightUpper.matrix.translate(-0.1, -0.2, 0.08);
  rightUpper.matrix.rotate(-30, 0, 0, 1);
  rightUpper.matrix.rotate(-g_yellowAngle * 0.8, 0, 0, 1);  // opposite phase
  const rightUpperCoord = new Matrix4(rightUpper.matrix);
  rightUpper.matrix.scale(0.13, 0.25, 0.12);
  rightUpper.render();

  const rightLower = new Cube();
  rightLower.color = [0.15, 0.5, 0.18, 1.0];
  rightLower.matrix = new Matrix4(rightUpperCoord);
  rightLower.matrix.translate(0.02, -0.13, 0.0);
  rightLower.matrix.rotate(30, 0, 0, 1);
  const rightLowerCoord = new Matrix4(rightLower.matrix);
  rightLower.matrix.scale(0.1, 0.15, 0.09);
  rightLower.render();

  const rightFoot = new Cube();
  rightFoot.color = [0.15, 0.5, 0.18, 1.0];
  rightFoot.matrix = new Matrix4(rightLowerCoord);
  rightFoot.matrix.translate(0.06, -0.10, 0.0);
  rightFoot.matrix.scale(0.2, 0.05, 0.08);
  rightFoot.render();
}