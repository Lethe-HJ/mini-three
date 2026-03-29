import type { ShaderProgram } from "../common/program";
import type { BoundingSphere } from "../utils/culling/frustum";
import {
  createIbo,
  createVao,
  createVbo,
  deleteIbo,
  deleteVao,
  deleteVbo,
} from "./gpu";

/** 索引缓冲区：与 WebGL `drawElements` 的 UNSIGNED_BYTE / SHORT / INT 对应 */
export type IndexArray = Uint8Array | Uint16Array | Uint32Array;

/** 根据 `indices` 的实际类型返回 `gl.UNSIGNED_BYTE` | `UNSIGNED_SHORT` | `UNSIGNED_INT` */
export function indexArrayToElementType(
  gl: WebGL2RenderingContext,
  indices: IndexArray,
): number {
  if (indices instanceof Uint32Array) {
    return gl.UNSIGNED_INT;
  }
  if (indices instanceof Uint16Array) {
    return gl.UNSIGNED_SHORT;
  }
  return gl.UNSIGNED_BYTE;
}

export class Geometry {
  private static sortIdSeq = 1;
  /** 同 `ShaderProgram` 下按 geometry/VAO 批处理排序用，实例稳定递增 id */
  readonly sortId: number;
  vertices: Float32Array;
  normals: Float32Array;
  indices: IndexArray;
  private boundingSphere: BoundingSphere | null = null;
  /**
   * GPU 侧顶点/索引缓冲（即 VBO + IBO）：`ARRAY_BUFFER` ×2 + `ELEMENT_ARRAY_BUFFER` ×1。
   * 首次上传后常驻显存，避免每帧 `createBuffer` / `bufferData`。
   */
  private gpuObject:
    | {
        gl: WebGL2RenderingContext;
        vertices: WebGLBuffer;
        normals: WebGLBuffer;
        indices: WebGLBuffer;
      }
    | undefined;
  /** 按 ShaderProgram 缓存 VAO（属性指针 + 元素缓冲绑定） */
  private vaoByProgram = new Map<ShaderProgram, WebGLVertexArrayObject>();

  constructor(
    vertices: Float32Array,
    normals: Float32Array,
    indices: IndexArray,
  ) {
    this.sortId = Geometry.sortIdSeq++;
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

  attach(gl: WebGL2RenderingContext, sp: ShaderProgram): void {
    const a_positionLocation = sp.getAttribLocation("a_position");
    const a_normalLocation = sp.getAttribLocation("a_normal");

    if (!this.gpuObject || this.gpuObject.gl !== gl) {
      if (this.gpuObject) {
        const _gl = this.gpuObject.gl;
        for (const vao of this.vaoByProgram.values()) {
          deleteVao(_gl, vao);
        }
        this.vaoByProgram.clear();
        if (_gl !== gl) {
          deleteVbo(_gl, this.gpuObject.vertices);
          deleteVbo(_gl, this.gpuObject.normals);
          deleteIbo(_gl, this.gpuObject.indices);
        }
      }
      this.gpuObject = {
        gl,
        vertices: createVbo(gl, this.vertices),
        normals: createVbo(gl, this.normals),
        indices: createIbo(gl, this.indices),
      };
    }

    const gpuObject = this.gpuObject;
    let vao = this.vaoByProgram.get(sp);
    if (!vao) {
      const attribs = [
        {
          buffer: gpuObject.vertices,
          location: a_positionLocation,
          size: 3,
          type: gl.FLOAT,
        },
        {
          buffer: gpuObject.normals,
          location: a_normalLocation,
          size: 3,
          type: gl.FLOAT,
        },
      ];
      const created = createVao(gl, attribs, gpuObject.indices);
      this.vaoByProgram.set(sp, created);
      vao = created;
    }
    gl.bindVertexArray(vao);
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
