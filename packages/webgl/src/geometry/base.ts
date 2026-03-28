import type { ShaderProgram } from "../common/program";
import type { BoundingSphere } from "../utils/culling/frustum";

/** 索引缓冲区：与 WebGL `drawElements` 的 UNSIGNED_BYTE / SHORT / INT 对应 */
export type IndexArray = Uint8Array | Uint16Array | Uint32Array;

/** 根据 `indices` 的实际类型返回 `gl.UNSIGNED_BYTE` | `UNSIGNED_SHORT` | `UNSIGNED_INT` */
export function indexArrayToElementType(gl: WebGLRenderingContext, indices: IndexArray): number {
  if (indices instanceof Uint32Array) {
    return gl.UNSIGNED_INT;
  }
  if (indices instanceof Uint16Array) {
    return gl.UNSIGNED_SHORT;
  }
  return gl.UNSIGNED_BYTE;
}

export class Geometry {
  vertices: Float32Array;
  normals: Float32Array;
  indices: IndexArray;
  private boundingSphere: BoundingSphere | null = null;

  constructor(vertices: Float32Array, normals: Float32Array, indices: IndexArray) {
    this.vertices = vertices;
    this.normals = normals;
    this.indices = indices;
  }

  getBoundingSphere(): BoundingSphere {
    if (this.boundingSphere) {
      return this.boundingSphere;
    }
    this.boundingSphere = this.computeBoundingSphere();
    return this.boundingSphere;
  }

  attach(gl: WebGLRenderingContext, sp: ShaderProgram): void {
    const a_positionLocation = sp.getAttribLocation("a_position");
    const vertices_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertices_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
    gl.vertexAttribPointer(a_positionLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_positionLocation);

    const a_normalLocation = sp.getAttribLocation("a_normal");
    const normal_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normal_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);
    gl.vertexAttribPointer(a_normalLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_normalLocation);

    const indices_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices_buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);
  }

  private computeBoundingSphere(): BoundingSphere {
    if (this.vertices.length < 3) {
      return { center: [0, 0, 0], radius: 0 };
    }

    let minX = this.vertices[0];
    let minY = this.vertices[1];
    let minZ = this.vertices[2];
    let maxX = this.vertices[0];
    let maxY = this.vertices[1];
    let maxZ = this.vertices[2];

    for (let i = 3; i < this.vertices.length; i += 3) {
      const x = this.vertices[i];
      const y = this.vertices[i + 1];
      const z = this.vertices[i + 2];
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (z < minZ) minZ = z;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
      if (z > maxZ) maxZ = z;
    }

    const centerX = (minX + maxX) * 0.5;
    const centerY = (minY + maxY) * 0.5;
    const centerZ = (minZ + maxZ) * 0.5;

    let radiusSq = 0;
    for (let i = 0; i < this.vertices.length; i += 3) {
      const dx = this.vertices[i] - centerX;
      const dy = this.vertices[i + 1] - centerY;
      const dz = this.vertices[i + 2] - centerZ;
      const distSq = dx * dx + dy * dy + dz * dz;
      if (distSq > radiusSq) radiusSq = distSq;
    }

    return {
      center: [centerX, centerY, centerZ],
      radius: Math.sqrt(radiusSq),
    };
  }
}
