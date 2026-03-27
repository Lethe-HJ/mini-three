import type { Mat4 } from "../matrix/matrix4";

export type Vec3 = [number, number, number];

export const v3 = {
  vectorMultiply(v: number[], m: Mat4): number[] {
    const dst: number[] = [];
    for (let i = 0; i < 4; ++i) {
      dst[i] = 0.0;
      for (let j = 0; j < 4; ++j) {
        dst[i] += v[j] * m[j * 4 + i];
      }
    }
    return dst;
  },

  cross(a: Vec3, b: Vec3): Vec3 {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  },
  subtractVectors(a: Vec3, b: Vec3): Vec3 {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  },
  normalize(v: Vec3): Vec3 {
    const length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    // 确定不会除以 0
    if (length > 0.00001) {
      return [v[0] / length, v[1] / length, v[2] / length];
    } else {
      return [0, 0, 0];
    }
  },
};
