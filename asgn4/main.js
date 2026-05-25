'use strict';

const VSHADER = `
attribute vec4 a_Position;
attribute vec3 a_Normal;

uniform mat4 u_ModelMatrix;
uniform mat4 u_ViewMatrix;
uniform mat4 u_ProjectionMatrix;
uniform mat4 u_NormalMatrix;

varying vec3 v_WorldPos;
varying vec3 v_WorldNormal;

void main(){
  vec4 worldPos = u_ModelMatrix * a_Position;
  gl_Position = u_ProjectionMatrix * u_ViewMatrix * worldPos;
  v_WorldPos = worldPos.xyz;
  v_WorldNormal = normalize(mat3(u_NormalMatrix) * a_Normal);
}
`;

const FSHADER = `
precision mediump float;

uniform vec3 u_DiffuseColor;
uniform vec3 u_AmbientColor;
uniform vec3 u_LightColor;
uniform vec3 u_ViewPos;

uniform bool u_LightingOn;
uniform bool u_ShowNormals;

uniform bool u_PointOn;
uniform vec3 u_PointPos;

uniform bool u_SpotOn;
uniform vec3 u_SpotPos;
uniform vec3 u_SpotDir;      // direction the spotlight points (world space)
uniform float u_SpotCutoff;  // cos(angle)
uniform float u_SpotExp;     // spotlight falloff exponent

uniform float u_Shininess;

varying vec3 v_WorldPos;
varying vec3 v_WorldNormal;

void main(){
  vec3 N = normalize(v_WorldNormal);

  if(u_ShowNormals){
    gl_FragColor = vec4(N*0.5 + 0.5, 1.0);
    return;
  }

  vec3 base = u_DiffuseColor;

  if(!u_LightingOn){
    gl_FragColor = vec4(base, 1.0);
    return;
  }

  vec3 ambient = u_AmbientColor * base;

  vec3 V = normalize(u_ViewPos - v_WorldPos);
  vec3 specAccum = vec3(0.0);
  vec3 diffAccum = vec3(0.0);

  if(u_PointOn){
    vec3 L = normalize(u_PointPos - v_WorldPos);
    float diff = max(dot(N, L), 0.0);

    vec3 R = reflect(-L, N);
    float spec = pow(max(dot(V, R), 0.0), u_Shininess);

    diffAccum += diff * base * u_LightColor;
    specAccum += spec * u_LightColor;
  }

  if(u_SpotOn){
    vec3 Ls = normalize(u_SpotPos - v_WorldPos);
    float theta = dot(Ls, normalize(-u_SpotDir));

    if(theta > u_SpotCutoff){
      float spot = pow(theta, u_SpotExp);

      float diffS = max(dot(N, Ls), 0.0);
      vec3 Rs = reflect(-Ls, N);
      float specS = pow(max(dot(V, Rs), 0.0), u_Shininess);

      diffAccum += spot * diffS * base * u_LightColor;
      specAccum += spot * specS * u_LightColor;
    }
  }

  vec3 color = ambient + diffAccum + specAccum;
  gl_FragColor = vec4(color, 1.0);
}
`;

let gl, canvas, program;
let cubeMesh, sphereMesh, objMesh = null;

const state = {
  camOrbitDeg: 35,
  camElevDeg: 15,
  camDist: 9,
  camTarget: {x:0, y:1.6, z:0},

  lightingOn: true,
  showNormals: false,

  pointOn: true,
  spotOn: true,

  spin: true,
  lightRadius: 3.5,
  lightY: 4,
  lightColor: [1,1,1],

  spotCutoffDeg: 18,
  spotExp: 24,

  time: 0
};

let loc = {};

function hexToRgb01(hex){
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if(!m) return [1,1,1];
  return [parseInt(m[1],16)/255, parseInt(m[2],16)/255, parseInt(m[3],16)/255];
}

function setMat4(u, m){ gl.uniformMatrix4fv(u, false, m.elements); }
function setVec3(u, v){ gl.uniform3f(u, v[0], v[1], v[2]); }
function setBool(u, b){ gl.uniform1i(u, b ? 1 : 0); }

function bindMesh(mesh){
  gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vboPos);
  gl.vertexAttribPointer(loc.a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(loc.a_Position);

  gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vboNor);
  gl.vertexAttribPointer(loc.a_Normal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(loc.a_Normal);

  if(mesh.isIndexed){
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.ibo);
  }
}

function drawMesh(mesh){
  if(mesh.isIndexed){
    gl.drawElements(gl.TRIANGLES, mesh.indexCount, mesh.indexType, 0);
  }else{
    gl.drawArrays(gl.TRIANGLES, 0, mesh.vertexCount);
  }
}

function initGL(){
  canvas = document.getElementById('webgl');
  gl = getWebGLContext(canvas);
  if(!gl){ alert('WebGL not supported'); return; }

  // Allow UNSIGNED_INT element indices in WebGL1 if available (some OBJ meshes may need it)
  gl.getExtension('OES_element_index_uint');

  program = createProgram(gl, VSHADER, FSHADER);
  gl.useProgram(program);

  // attribs
  loc.a_Position = gl.getAttribLocation(program, 'a_Position');
  loc.a_Normal = gl.getAttribLocation(program, 'a_Normal');

  // mats
  loc.u_ModelMatrix = gl.getUniformLocation(program, 'u_ModelMatrix');
  loc.u_ViewMatrix = gl.getUniformLocation(program, 'u_ViewMatrix');
  loc.u_ProjectionMatrix = gl.getUniformLocation(program, 'u_ProjectionMatrix');
  loc.u_NormalMatrix = gl.getUniformLocation(program, 'u_NormalMatrix');

  // colors / lighting
  loc.u_DiffuseColor = gl.getUniformLocation(program, 'u_DiffuseColor');
  loc.u_AmbientColor = gl.getUniformLocation(program, 'u_AmbientColor');
  loc.u_LightColor = gl.getUniformLocation(program, 'u_LightColor');
  loc.u_ViewPos = gl.getUniformLocation(program, 'u_ViewPos');

  loc.u_LightingOn = gl.getUniformLocation(program, 'u_LightingOn');
  loc.u_ShowNormals = gl.getUniformLocation(program, 'u_ShowNormals');

  loc.u_PointOn = gl.getUniformLocation(program, 'u_PointOn');
  loc.u_PointPos = gl.getUniformLocation(program, 'u_PointPos');

  loc.u_SpotOn = gl.getUniformLocation(program, 'u_SpotOn');
  loc.u_SpotPos = gl.getUniformLocation(program, 'u_SpotPos');
  loc.u_SpotDir = gl.getUniformLocation(program, 'u_SpotDir');
  loc.u_SpotCutoff = gl.getUniformLocation(program, 'u_SpotCutoff');
  loc.u_SpotExp = gl.getUniformLocation(program, 'u_SpotExp');

  loc.u_Shininess = gl.getUniformLocation(program, 'u_Shininess');

  // meshes
  cubeMesh = createMesh(gl, createCube());
  sphereMesh = createMesh(gl, createSphere(28, 28, 1));

  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0,0,0,1);
}

function initUI(){
  const $ = (id)=>document.getElementById(id);

  $('camOrbit').addEventListener('input', e=> state.camOrbitDeg = parseFloat(e.target.value));
  $('camElev').addEventListener('input', e=> state.camElevDeg = parseFloat(e.target.value));
  $('camDist').addEventListener('input', e=> state.camDist = parseFloat(e.target.value));

  $('spin').addEventListener('input', e=> state.spin = (parseInt(e.target.value,10)===1));
  $('lightRadius').addEventListener('input', e=> state.lightRadius = parseFloat(e.target.value));
  $('lightY').addEventListener('input', e=> state.lightY = parseFloat(e.target.value));
  $('lightColor').addEventListener('input', e=> state.lightColor = hexToRgb01(e.target.value));

  $('spotCutoff').addEventListener('input', e=> state.spotCutoffDeg = parseFloat(e.target.value));
  $('spotExp').addEventListener('input', e=> state.spotExp = parseFloat(e.target.value));

  const btnLighting = $('toggleLighting');
  const btnNormals  = $('toggleNormals');
  const btnPoint    = $('togglePoint');
  const btnSpot     = $('toggleSpot');

  btnLighting.addEventListener('click', ()=>{
    state.lightingOn = !state.lightingOn;
    btnLighting.textContent = `Lighting: ${state.lightingOn ? 'ON' : 'OFF'}`;
  });

  btnNormals.addEventListener('click', ()=>{
    state.showNormals = !state.showNormals;
    btnNormals.textContent = `Normal View: ${state.showNormals ? 'ON' : 'OFF'}`;
  });

  btnPoint.addEventListener('click', ()=>{
    state.pointOn = !state.pointOn;
    btnPoint.textContent = `Point Light: ${state.pointOn ? 'ON' : 'OFF'}`;
  });

  btnSpot.addEventListener('click', ()=>{
    state.spotOn = !state.spotOn;
    btnSpot.textContent = `Spot Light: ${state.spotOn ? 'ON' : 'OFF'}`;
  });

  $('objFile').addEventListener('change', async (e)=>{
    const f = e.target.files && e.target.files[0];
    if(!f) return;
    try{
      const geo = await readOBJFile(f);
      objMesh = createMesh(gl, geo);
    }catch(err){
      console.error(err);
      alert('Could not load OBJ (check console).');
    }
  });

  window.addEventListener('keydown', (e)=>{
    const step = 0.25;
    if(e.key === 'w' || e.key === 'W') state.camTarget.z -= step;
    if(e.key === 's' || e.key === 'S') state.camTarget.z += step;
    if(e.key === 'a' || e.key === 'A') state.camTarget.x -= step;
    if(e.key === 'd' || e.key === 'D') state.camTarget.x += step;
    if(e.key === 'q' || e.key === 'Q') state.camTarget.y -= step;
    if(e.key === 'e' || e.key === 'E') state.camTarget.y += step;
  });
}

function computeCamera(){
  const orbit = state.camOrbitDeg * Math.PI/180;
  const elev  = state.camElevDeg  * Math.PI/180;
  const r = state.camDist;

  const cx = state.camTarget.x + r * Math.cos(elev) * Math.cos(orbit);
  const cy = state.camTarget.y + r * Math.sin(elev);
  const cz = state.camTarget.z + r * Math.cos(elev) * Math.sin(orbit);

  const view = new Matrix4();
  view.setLookAt(cx,cy,cz, state.camTarget.x,state.camTarget.y,state.camTarget.z, 0,1,0);
  return { view, eye:[cx,cy,cz] };
}

function render(){
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const cam = computeCamera();
  const proj = new Matrix4();
  proj.setPerspective(60, canvas.width/canvas.height, 0.1, 100);

  setMat4(loc.u_ViewMatrix, cam.view);
  setMat4(loc.u_ProjectionMatrix, proj);

  setBool(loc.u_LightingOn, state.lightingOn);
  setBool(loc.u_ShowNormals, state.showNormals);
  setVec3(loc.u_AmbientColor, [0.15,0.15,0.15]);
  setVec3(loc.u_LightColor, state.lightColor);
  setVec3(loc.u_ViewPos, cam.eye);
  gl.uniform1f(loc.u_Shininess, 48.0);

  // Point light position (spins if enabled)
  let pointPos = [state.lightRadius, state.lightY, 0];
  if(state.spin){
    pointPos = [
      Math.cos(state.time)*state.lightRadius,
      state.lightY,
      Math.sin(state.time)*state.lightRadius
    ];
  }
  setBool(loc.u_PointOn, state.pointOn);
  setVec3(loc.u_PointPos, pointPos);

  // Spotlight: fixed above scene, points at camera target
  const spotPos = [0, 8, 0];
  const dir = [
    state.camTarget.x - spotPos[0],
    state.camTarget.y - spotPos[1],
    state.camTarget.z - spotPos[2]
  ];
  const len = Math.hypot(dir[0],dir[1],dir[2]) || 1;
  dir[0]/=len; dir[1]/=len; dir[2]/=len;

  setBool(loc.u_SpotOn, state.spotOn);
  setVec3(loc.u_SpotPos, spotPos);
  setVec3(loc.u_SpotDir, dir);
  gl.uniform1f(loc.u_SpotCutoff, Math.cos(state.spotCutoffDeg*Math.PI/180));
  gl.uniform1f(loc.u_SpotExp, state.spotExp);

  // ---- Draw ----
  bindMesh(cubeMesh);

  // Ground
  {
    const m = new Matrix4();
    m.setTranslate(0, -1.1, 0);
    m.scale(12, 0.2, 12);

    const nmat = new Matrix4();
    nmat.setInverseOf(m); nmat.transpose();

    setMat4(loc.u_ModelMatrix, m);
    setMat4(loc.u_NormalMatrix, nmat);
    setVec3(loc.u_DiffuseColor, [0.25, 0.35, 0.25]);
    drawMesh(cubeMesh);
  }

  // Center cube
  {
    const m = new Matrix4();
    m.setTranslate(0, 1.4, 0);
    m.rotate(25, 0,1,0);
    m.rotate(12, 1,0,0);
    m.scale(1.2, 1.2, 1.2);

    const nmat = new Matrix4();
    nmat.setInverseOf(m); nmat.transpose();

    setMat4(loc.u_ModelMatrix, m);
    setMat4(loc.u_NormalMatrix, nmat);
    setVec3(loc.u_DiffuseColor, [0.2, 0.55, 0.95]);
    drawMesh(cubeMesh);
  }

  // Light marker cube
  {
    const m = new Matrix4();
    m.setTranslate(pointPos[0], pointPos[1.4], pointPos[2]);
    m.scale(0.15, 0.15, 0.15);

    const nmat = new Matrix4();
    nmat.setInverseOf(m); nmat.transpose();

    setMat4(loc.u_ModelMatrix, m);
    setMat4(loc.u_NormalMatrix, nmat);
    setVec3(loc.u_DiffuseColor, [1.0, 0.95, 0.2]);
    drawMesh(cubeMesh);
  }

  // Spheres
  bindMesh(sphereMesh);
  {
    const m = new Matrix4();
    m.setTranslate(-2.2, 1.7, 1.8);
    m.scale(0.9, 0.9, 0.9);

    const nmat = new Matrix4();
    nmat.setInverseOf(m); nmat.transpose();

    setMat4(loc.u_ModelMatrix, m);
    setMat4(loc.u_NormalMatrix, nmat);
    setVec3(loc.u_DiffuseColor, [0.9, 0.3, 0.25]);
    drawMesh(sphereMesh);
  }
  {
    const m = new Matrix4();
    m.setTranslate(2.0, 2.0, -1.6);
    m.scale(1.1, 1.1, 1.1);

    const nmat = new Matrix4();
    nmat.setInverseOf(m); nmat.transpose();

    setMat4(loc.u_ModelMatrix, m);
    setMat4(loc.u_NormalMatrix, nmat);
    setVec3(loc.u_DiffuseColor, [0.85, 0.85, 0.9]);
    drawMesh(sphereMesh);
  }

  // OBJ model
  if(objMesh){
    bindMesh(objMesh);
    const m = new Matrix4();
    m.setTranslate(0, 1.2, -3.2);
    m.scale(1.2, 1.2, 1.2);
    m.rotate(-30, 0,1,0);

    const nmat = new Matrix4();
    nmat.setInverseOf(m); nmat.transpose();

    setMat4(loc.u_ModelMatrix, m);
    setMat4(loc.u_NormalMatrix, nmat);
    setVec3(loc.u_DiffuseColor, [0.9, 0.75, 0.25]);
    drawMesh(objMesh);
  }



}

function tick(){
  state.time += 0.016;
  render();
  requestAnimationFrame(tick);
}

function main(){
  initGL();
  initUI();
  tick();
}

main();
