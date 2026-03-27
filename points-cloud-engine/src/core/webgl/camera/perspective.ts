import { Camera } from "./type";
import { Vector3 } from "../common/math/vector/vector3";

export class PerspectiveCamera extends Camera {
  constructor(fov: number, aspect: number, near: number, far: number) {
    // 将角度转换为弧度
    super(fov * (Math.PI / 180), aspect, near, far);
  }

  // 与 Three.js 一致的 lookAt 方法，支持 Vector3 参数
  lookAt(vector: Vector3): this;
  lookAt(x: number, y: number, z: number): this;
  lookAt(vectorOrX: Vector3 | number, y?: number, z?: number): this {
    if (vectorOrX instanceof Vector3) {
      return super.lookAt(vectorOrX.x, vectorOrX.y, vectorOrX.z);
    } else if (y !== undefined && z !== undefined) {
      return super.lookAt(vectorOrX, y, z);
    }
    return this;
  }
}
