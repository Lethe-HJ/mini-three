import { m4 } from "../common/math/matrix/matrix4";
import type { Mat4 } from "../common/math/matrix/matrix4";
import { Vector3 } from "../common/math/vector/vector3";

export class Camera {
  private _position: Vector3;
  private _target: Vector3;
  private _up: Vector3;
  fov: number;
  aspect: number;
  near: number;
  far: number;
  matrix: { camera: Mat4; projection: Mat4; view: Mat4; vp: Mat4 };

  constructor(fov: number, aspect: number, near: number, far: number) {
    this._position = new Vector3(0, 0, 1);
    this._target = new Vector3(0, 0, 0);
    this._up = new Vector3(0, 1, 0);
    this.fov = fov;
    this.aspect = aspect;
    this.near = near;
    this.far = far;

    // 初始化 matrix 属性
    const cameraMatrix = m4.lookAt(
      this._position.toArray(),
      this._target.toArray(),
      this._up.toArray(),
    );
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

  get position(): Vector3 {
    return this._position;
  }

  set position(value: Vector3) {
    this._position = value;
    this.updateMatrix();
  }

  get up(): Vector3 {
    return this._up;
  }

  set up(value: Vector3) {
    this._up = value;
    this.updateMatrix();
  }

  setPosition(x: number, y: number, z: number): this {
    this._position.set(x, y, z);
    this.updateMatrix();
    return this;
  }

  setTarget(x: number, y: number, z: number): this {
    this._target.set(x, y, z);
    this.updateMatrix();
    return this;
  }

  setUp(x: number, y: number, z: number): this {
    this._up.set(x, y, z);
    this.updateMatrix();
    return this;
  }

  lookAt(x: number, y: number, z: number): this {
    this._target.set(x, y, z);
    this.updateMatrix();
    return this;
  }

  updateMatrix(): void {
    const cameraMatrix = m4.lookAt(
      this._position.toArray(),
      this._target.toArray(),
      this._up.toArray(),
    );
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
    if (loc) gl.uniform3fv(loc, this._position.toArray());
  }
}
