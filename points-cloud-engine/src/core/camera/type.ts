import type { Mat4 } from "../common/math/matrix/matrix4";
import type { Vec3 } from "../common/math/vector/vec3";

export interface Camera {
  matrix: { camera: Mat4; projection: Mat4; view: Mat4; vp: Mat4 };
  attach(gl: WebGLRenderingContext, program: WebGLProgram): void;
}

export interface CameraConfig {
  position: Vec3;
  target: Vec3;
  up: Vec3;
  fov: number;
  aspect: number;
  near: number;
  far: number;
}
