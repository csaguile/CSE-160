class Cylinder {
  constructor(segments = 24) {
    this.type = 'cylinder';
    this.color = [1, 1, 1, 1];
    this.matrix = new Matrix4();
    this.segments = segments;
  }

  makeVertices() {
    const vertices = [];
    const n = this.segments;
    const r = 0.5;
    const yTop = 0.5;
    const yBot = -0.5;

    for (let i = 0; i < n; i++) {
      const a1 = (i / n) * Math.PI * 2;
      const a2 = ((i + 1) / n) * Math.PI * 2;
      const x1 = Math.cos(a1) * r;
      const z1 = Math.sin(a1) * r;
      const x2 = Math.cos(a2) * r;
      const z2 = Math.sin(a2) * r;

      // Side rectangle as two triangles
      vertices.push(x1, yBot, z1,  x2, yBot, z2,  x2, yTop, z2);
      vertices.push(x1, yBot, z1,  x2, yTop, z2,  x1, yTop, z1);

      // Top cap
      vertices.push(0, yTop, 0,  x1, yTop, z1,  x2, yTop, z2);

      // Bottom cap
      vertices.push(0, yBot, 0,  x2, yBot, z2,  x1, yBot, z1);
    }

    return new Float32Array(vertices);
  }

  render() {
    const vertices = this.makeVertices();
    const vertexCount = vertices.length / 3;
    const colors = [];
    for (let i = 0; i < vertexCount; i++) colors.push(...this.color);

    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    gl.vertexAttribPointer(a_Color, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Color);

    gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
  }
}
