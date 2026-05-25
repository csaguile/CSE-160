'use strict';

// ---------- Cube (24 vertices: 4 per face, correct normals) ----------
function createCube() {
  const p = [
    // +X
    1, -1, -1,  1,  1, -1,  1,  1,  1,  1, -1,  1,
    // -X
   -1, -1,  1, -1,  1,  1, -1,  1, -1, -1, -1, -1,
    // +Y
   -1,  1, -1, -1,  1,  1,  1,  1,  1,  1,  1, -1,
    // -Y
   -1, -1,  1, -1, -1, -1,  1, -1, -1,  1, -1,  1,
    // +Z
   -1, -1,  1,  1, -1,  1,  1,  1,  1, -1,  1,  1,
    // -Z
    1, -1, -1, -1, -1, -1, -1,  1, -1,  1,  1, -1,
  ];

  const n = [
    // +X
    1,0,0,  1,0,0,  1,0,0,  1,0,0,
    // -X
   -1,0,0, -1,0,0, -1,0,0, -1,0,0,
    // +Y
    0,1,0,  0,1,0,  0,1,0,  0,1,0,
    // -Y
    0,-1,0, 0,-1,0, 0,-1,0, 0,-1,0,
    // +Z
    0,0,1,  0,0,1,  0,0,1,  0,0,1,
    // -Z
    0,0,-1, 0,0,-1, 0,0,-1, 0,0,-1,
  ];

  const idx = [
     0, 1, 2,   0, 2, 3,      // +X
     4, 5, 6,   4, 6, 7,      // -X
     8, 9,10,   8,10,11,      // +Y
    12,13,14,  12,14,15,      // -Y
    16,17,18,  16,18,19,      // +Z
    20,21,22,  20,22,23       // -Z
  ];

  return {
    positions: new Float32Array(p),
    normals: new Float32Array(n),
    indices: new Uint16Array(idx)
  };
}

// ---------- Sphere (lat/long) ----------
function createSphere(latBands=24, longBands=24, radius=1) {
  const positions = [];
  const normals = [];
  const indices = [];

  for (let lat=0; lat<=latBands; lat++) {
    const theta = lat * Math.PI / latBands;
    const sinT = Math.sin(theta);
    const cosT = Math.cos(theta);

    for (let lon=0; lon<=longBands; lon++) {
      const phi = lon * 2*Math.PI / longBands;
      const sinP = Math.sin(phi);
      const cosP = Math.cos(phi);

      const x = cosP * sinT;
      const y = cosT;
      const z = sinP * sinT;

      normals.push(x, y, z);
      positions.push(radius*x, radius*y, radius*z);
    }
  }

  for (let lat=0; lat<latBands; lat++) {
    for (let lon=0; lon<longBands; lon++) {
      const first  = lat*(longBands+1) + lon;
      const second = first + longBands + 1;

      indices.push(first, second, first+1);
      indices.push(second, second+1, first+1);
    }
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    indices: (positions.length/3 > 65535) ? new Uint32Array(indices) : new Uint16Array(indices)
  };
}

// ---------- GL mesh helper ----------
function createMesh(gl, geo) {
  const mesh = {
    vboPos: gl.createBuffer(),
    vboNor: gl.createBuffer(),
    ibo: null,
    indexCount: 0,
    indexType: null,
    vertexCount: geo.positions.length / 3,
    isIndexed: !!geo.indices
  };

  gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vboPos);
  gl.bufferData(gl.ARRAY_BUFFER, geo.positions, gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vboNor);
  gl.bufferData(gl.ARRAY_BUFFER, geo.normals, gl.STATIC_DRAW);

  if (mesh.isIndexed) {
    mesh.ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geo.indices, gl.STATIC_DRAW);
    mesh.indexCount = geo.indices.length;
    mesh.indexType = (geo.indices instanceof Uint32Array) ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT;
  }

  return mesh;
}
