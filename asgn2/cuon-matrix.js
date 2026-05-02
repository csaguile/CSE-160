// Small Matrix4 class compatible with the methods used in this project.
class Matrix4 {
  constructor(src) {
    if (src && src.elements) {
      this.elements = new Float32Array(src.elements);
    } else {
      this.elements = new Float32Array(16);
      this.setIdentity();
    }
  }

  setIdentity() {
    const e = this.elements;
    e[0] = 1; e[4] = 0; e[8]  = 0; e[12] = 0;
    e[1] = 0; e[5] = 1; e[9]  = 0; e[13] = 0;
    e[2] = 0; e[6] = 0; e[10] = 1; e[14] = 0;
    e[3] = 0; e[7] = 0; e[11] = 0; e[15] = 1;
    return this;
  }

  set(src) {
    this.elements.set(src.elements);
    return this;
  }

  concat(other) {
    const a = this.elements;
    const b = other.elements;
    const e = new Float32Array(16);

    for (let i = 0; i < 4; i++) {
      const ai0 = a[i];
      const ai1 = a[i + 4];
      const ai2 = a[i + 8];
      const ai3 = a[i + 12];
      e[i]      = ai0 * b[0]  + ai1 * b[1]  + ai2 * b[2]  + ai3 * b[3];
      e[i + 4]  = ai0 * b[4]  + ai1 * b[5]  + ai2 * b[6]  + ai3 * b[7];
      e[i + 8]  = ai0 * b[8]  + ai1 * b[9]  + ai2 * b[10] + ai3 * b[11];
      e[i + 12] = ai0 * b[12] + ai1 * b[13] + ai2 * b[14] + ai3 * b[15];
    }

    this.elements = e;
    return this;
  }

  multiply(other) {
    return this.concat(other);
  }

  translate(x, y, z) {
    const t = new Matrix4();
    const e = t.elements;
    e[12] = x;
    e[13] = y;
    e[14] = z;
    return this.concat(t);
  }

  scale(x, y, z) {
    const s = new Matrix4();
    const e = s.elements;
    e[0] = x;
    e[5] = y;
    e[10] = z;
    return this.concat(s);
  }

  setRotate(angle, x, y, z) {
    this.setIdentity();
    return this.rotate(angle, x, y, z);
  }

  rotate(angle, x, y, z) {
    let len = Math.sqrt(x * x + y * y + z * z);
    if (len === 0) return this;
    x /= len;
    y /= len;
    z /= len;

    const rad = Math.PI * angle / 180;
    const s = Math.sin(rad);
    const c = Math.cos(rad);
    const nc = 1 - c;

    const r = new Matrix4();
    const e = r.elements;
    e[0] = x * x * nc + c;
    e[1] = y * x * nc + z * s;
    e[2] = z * x * nc - y * s;
    e[3] = 0;

    e[4] = x * y * nc - z * s;
    e[5] = y * y * nc + c;
    e[6] = z * y * nc + x * s;
    e[7] = 0;

    e[8] = x * z * nc + y * s;
    e[9] = y * z * nc - x * s;
    e[10] = z * z * nc + c;
    e[11] = 0;

    e[12] = 0;
    e[13] = 0;
    e[14] = 0;
    e[15] = 1;

    return this.concat(r);
  }
}
