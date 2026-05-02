function createShader(gl, source, type) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.log('Shader compile error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function initShaders(gl, vshader, fshader) {
  const vertexShader = createShader(gl, vshader, gl.VERTEX_SHADER);
  const fragmentShader = createShader(gl, fshader, gl.FRAGMENT_SHADER);
  if (!vertexShader || !fragmentShader) return false;

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.log('Program link error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return false;
  }

  gl.useProgram(program);
  gl.program = program;
  return true;
}
