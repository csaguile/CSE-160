'use strict';

// OBJ loader supporting: v, vn, f (tri/quad/ngon).
// Outputs NON-INDEXED triangle lists (drawArrays), so it works even for very large meshes in WebGL1.

function parseOBJ(text) {
  const lines = text.split(/\r?\n/);
  const V = [[0,0,0]];
  const VN = [[0,0,0]];
  const faces = [];

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const parts = line.split(/\s+/);
    const tag = parts[0];

    if (tag === 'v') {
      V.push([parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3])]);
    } else if (tag === 'vn') {
      VN.push([parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3])]);
    } else if (tag === 'f') {
      const verts = parts.slice(1).map(tok => {
        const [v, vt, vn] = tok.split('/');
        return { v: parseInt(v,10), vn: vn ? parseInt(vn,10) : 0 };
      });
      faces.push(verts);
    }
  }

  const positions = [];
  const normals = [];
  const hasNormals = VN.length > 1;

  function cross(a,b){
    return [
      a[1]*b[2]-a[2]*b[1],
      a[2]*b[0]-a[0]*b[2],
      a[0]*b[1]-a[1]*b[0]
    ];
  }
  function norm(v){
    const len = Math.hypot(v[0],v[1],v[2]) || 1;
    return [v[0]/len, v[1]/len, v[2]/len];
  }

  function pushVertex(vIndex, vnIndex, fallbackNormal){
    const p = V[vIndex];
    positions.push(p[0], p[1], p[2]);

    let n = fallbackNormal;
    if (hasNormals && vnIndex > 0) n = VN[vnIndex];
    normals.push(n[0], n[1], n[2]);
  }

  for (const face of faces) {
    // triangulate as fan: (0,i,i+1)
    for (let i=1; i+1<face.length; i++) {
      const a = face[0], b = face[i], c = face[i+1];

      // If no normals, compute face normal and use it for the three vertices
      let fn = [0,1,0];
      if (!hasNormals) {
        const pa = V[a.v], pb = V[b.v], pc = V[c.v];
        const e1 = [pb[0]-pa[0], pb[1]-pa[1], pb[2]-pa[2]];
        const e2 = [pc[0]-pa[0], pc[1]-pa[1], pc[2]-pa[2]];
        fn = norm(cross(e1, e2));
      }

      pushVertex(a.v, a.vn, fn);
      pushVertex(b.v, b.vn, fn);
      pushVertex(c.v, c.vn, fn);
    }
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals)
    // no indices: drawArrays
  };
}

async function readOBJFile(file) {
  const text = await file.text();
  return parseOBJ(text);
}
