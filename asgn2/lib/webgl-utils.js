// Minimal WebGLUtils helper for CSE160-style projects.
var WebGLUtils = {
  setupWebGL: function(canvas) {
    return canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  }
};
