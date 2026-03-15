import { m4 } from "../common/math/matrix/matrix4";
import type { Mat4 } from "../common/math/matrix/matrix4";
import type { Vec3 } from "../common/math/vector/vec3";

export class Camera {
  position: Vec3;
  target: Vec3;
  up: Vec3;
  fov: number;
  aspect: number;
  near: number;
  far: number;
  matrix: { camera: Mat4; projection: Mat4; view: Mat4; vp: Mat4 };

  constructor(fov: number, aspect: number, near: number, far: number) {
    this.position = [0, 0, 1];
    this.target = [0, 0, 0];
    this.up = [0, 1, 0];
    this.fov = fov;
    this.aspect = aspect;
    this.near = near;
    this.far = far;

    // 初始化 matrix 属性
    const cameraMatrix = m4.lookAt(this.position, this.target, this.up);
    const viewMatrix = m4.inverse(cameraMatrix);
    const projectionMatrix = m4.perspective(this.fov, this.aspect, this.near, this.far);
    const vpMatrix = m4.multiply(projectionMatrix, viewMatrix);

    this.matrix = {
      camera: cameraMatrix,
      projection: projectionMatrix,
      view: viewMatrix,
      vp: vpMatrix,
    };
  }

  setPosition(x: number, y: number, z: number): this {
    this.position = [x, y, z];
    this.updateMatrix();
    return this;
  }

  setTarget(x: number, y: number, z: number): this {
    this.target = [x, y, z];
    this.updateMatrix();
    return this;
  }

  setUp(x: number, y: number, z: number): this {
    this.up = [x, y, z];
    this.updateMatrix();
    return this;
  }

  lookAt(x: number, y: number, z: number): this {
    this.target = [x, y, z];
    this.updateMatrix();
    return this;
  }

  updateMatrix(): void {
    const cameraMatrix = m4.lookAt(this.position, this.target, this.up);
    const viewMatrix = m4.inverse(cameraMatrix);
    const projectionMatrix = m4.perspective(this.fov, this.aspect, this.near, this.far);
    const vpMatrix = m4.multiply(projectionMatrix, viewMatrix);

    this.matrix = {
      camera: cameraMatrix,
      projection: projectionMatrix,
      view: viewMatrix,
      vp: vpMatrix,
    };
  }

  attach(gl: WebGLRenderingContext, program: WebGLProgram): void {
    gl.useProgram(program);
    const loc = gl.getUniformLocation(program, "u_cameraPosition");
    if (loc) gl.uniform3fv(loc, this.position);
  }
}
