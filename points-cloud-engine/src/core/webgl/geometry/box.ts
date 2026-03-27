import { Geometry } from "./base";

export class BoxGeometry extends Geometry {
  constructor(width: number = 1, height: number = 1, depth: number = 1) {
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const halfDepth = depth / 2;

    // 物体位置
    const vertices = new Float32Array([
      // 0123 前面
      halfWidth,
      halfHeight,
      halfDepth,
      -halfWidth,
      halfHeight,
      halfDepth,
      -halfWidth,
      -halfHeight,
      halfDepth,
      halfWidth,
      -halfHeight,
      halfDepth,
      // 0345 右面
      halfWidth,
      halfHeight,
      halfDepth,
      halfWidth,
      -halfHeight,
      halfDepth,
      halfWidth,
      -halfHeight,
      -halfDepth,
      halfWidth,
      halfHeight,
      -halfDepth,
      // 0156 上面
      halfWidth,
      halfHeight,
      halfDepth,
      halfWidth,
      halfHeight,
      -halfDepth,
      -halfWidth,
      halfHeight,
      -halfDepth,
      -halfWidth,
      halfHeight,
      halfDepth,
      // 1267 左面
      -halfWidth,
      halfHeight,
      halfDepth,
      -halfWidth,
      halfHeight,
      -halfDepth,
      -halfWidth,
      -halfHeight,
      -halfDepth,
      -halfWidth,
      -halfHeight,
      halfDepth,
      // 2347 下面
      -halfWidth,
      -halfHeight,
      halfDepth,
      halfWidth,
      -halfHeight,
      halfDepth,
      halfWidth,
      -halfHeight,
      -halfDepth,
      -halfWidth,
      -halfHeight,
      -halfDepth,
      // 4567 后面
      halfWidth,
      -halfHeight,
      -halfDepth,
      halfWidth,
      halfHeight,
      -halfDepth,
      -halfWidth,
      halfHeight,
      -halfDepth,
      -halfWidth,
      -halfHeight,
      -halfDepth,
    ]);

    // 法向量
    const normals = new Float32Array([
      // 0123 前面
      0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
      // 0345 右面
      1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
      // 0156 上面
      0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
      // 1267 左面
      -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
      // 2347 下面
      0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
      // 4567 后面
      0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
    ]);

    // 面
    const indices = new Uint8Array([
      0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14, 15, 16, 17, 18,
      16, 18, 19, 20, 21, 22, 20, 22, 23,
    ]);

    super(vertices, normals, indices);
  }
}
