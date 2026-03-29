import type { Mat4 } from "../../common/math/matrix/matrix4";

export interface BoundingSphere {
  center: [number, number, number];
  radius: number;
}

export interface BoundingAABB {
  min: [number, number, number];
  max: [number, number, number];
}

interface Plane {
  nx: number;
  ny: number;
  nz: number;
  d: number;
}

const createPlane = (): Plane => ({ nx: 0, ny: 0, nz: 0, d: 0 });

export class Frustum {
  /** 固定 6 面，每帧仅原地更新，避免 `setFromProjectionMatrix` 反复分配 plane 对象 */
  private readonly planes: Plane[] = [
    createPlane(),
    createPlane(),
    createPlane(),
    createPlane(),
    createPlane(),
    createPlane(),
  ];

  setFromProjectionMatrix(vpMatrix: Mat4): this {
    const m = vpMatrix;
    const p = this.planes;
    this.normalizePlaneInto(
      p[0],
      m[3] + m[0],
      m[7] + m[4],
      m[11] + m[8],
      m[15] + m[12],
    ); // left
    this.normalizePlaneInto(
      p[1],
      m[3] - m[0],
      m[7] - m[4],
      m[11] - m[8],
      m[15] - m[12],
    ); // right
    this.normalizePlaneInto(
      p[2],
      m[3] + m[1],
      m[7] + m[5],
      m[11] + m[9],
      m[15] + m[13],
    ); // bottom
    this.normalizePlaneInto(
      p[3],
      m[3] - m[1],
      m[7] - m[5],
      m[11] - m[9],
      m[15] - m[13],
    ); // top
    this.normalizePlaneInto(
      p[4],
      m[3] + m[2],
      m[7] + m[6],
      m[11] + m[10],
      m[15] + m[14],
    ); // near
    this.normalizePlaneInto(
      p[5],
      m[3] - m[2],
      m[7] - m[6],
      m[11] - m[10],
      m[15] - m[14],
    ); // far
    return this;
  }

  intersectsSphere(sphere: BoundingSphere): boolean {
    for (let i = 0; i < this.planes.length; i++) {
      const plane = this.planes[i];
      const distance =
        plane.nx * sphere.center[0] +
        plane.ny * sphere.center[1] +
        plane.nz * sphere.center[2] +
        plane.d;
      if (distance < -sphere.radius) {
        return false;
      }
    }
    return true;
  }

  intersectsAABB(_aabb: BoundingAABB): boolean {
    // TODO: 第二阶段补齐 AABB 与平面相交测试
    return true;
  }

  private normalizePlaneInto(
    out: Plane,
    nx: number,
    ny: number,
    nz: number,
    d: number,
  ): void {
    const len = Math.hypot(nx, ny, nz);
    if (len === 0) {
      out.nx = nx;
      out.ny = ny;
      out.nz = nz;
      out.d = d;
      return;
    }
    out.nx = nx / len;
    out.ny = ny / len;
    out.nz = nz / len;
    out.d = d / len;
  }
}
