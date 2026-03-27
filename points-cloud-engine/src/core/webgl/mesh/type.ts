import { m4, type Mat4 } from "../common/math/matrix/matrix4";
import { BaseObject } from "../common/object/base";
import type { Geometry } from "../geometry/base";
import type { Material } from "../material/base";
import type { Group } from "../group/type";
import type { Camera } from "../camera/type";
import { ObjectType } from "../common/object/type";

export interface MeshMatrixSet {
  mvp: { value: Mat4 | null; location: WebGLUniformLocation | null };
  model: { value: Mat4 | null; location: WebGLUniformLocation | null };
  normal: { value: Mat4 | null; location: WebGLUniformLocation | null };
  rotation: Mat4;
  translate: Mat4;
  scale: Mat4;
  localModel: Mat4;
}

export class Mesh extends BaseObject {
  name: typeof ObjectType.Mesh;
  geometry: Geometry;
  material: Material;
  parent: Group | null;
  matrixes: MeshMatrixSet;

  constructor(geometry: Geometry, material: Material) {
    super(ObjectType.Mesh);
    this.name = ObjectType.Mesh;
    this.geometry = geometry;
    this.material = material;
    this.parent = null;
    this.matrixes = {
      mvp: { value: null, location: null },
      model: { value: null, location: null },
      normal: { value: null, location: null },
      rotation: m4.identity(),
      translate: m4.identity(),
      scale: m4.identity(),
      localModel: m4.identity(),
    };
  }

  attach(gl: WebGLRenderingContext): void {
    this.material.attach(gl);
    const program = this.material.getShaderProgram();
    if (!program) throw new Error("Mesh: shader program is null");
    gl.useProgram(program);
    this.matrixes.mvp.location = gl.getUniformLocation(program, "u_mvpMatrix");
    this.matrixes.model.location = gl.getUniformLocation(program, "u_modelMatrix");
    this.matrixes.normal.location = gl.getUniformLocation(program, "u_normalMatrix");
    this.geometry.attach(gl, program);
  }

  updateModelMatrix(): void {
    // 从 Vector3 更新矩阵
    this.matrixes.translate = m4.translation(this.position.x, this.position.y, this.position.z);
    this.matrixes.rotation = m4.multiplySeries(
      m4.identity(),
      m4.xRotation(this.rotation.x),
      m4.yRotation(this.rotation.y),
      m4.zRotation(this.rotation.z),
    );
    this.matrixes.scale = m4.scaling(this.scale.x, this.scale.y, this.scale.z);

    const parentModel = this.parent ? this.parent.matrixes.model : null;
    this.matrixes.localModel = m4.multiplySeries(
      this.matrixes.translate,
      this.matrixes.rotation,
      this.matrixes.scale,
    );
    this.matrixes.model.value = parentModel
      ? m4.multiply(parentModel, this.matrixes.localModel)
      : this.matrixes.localModel;
  }

  updateMatrix(gl: WebGLRenderingContext, camera: Camera): void {
    const modelMatrix = this.matrixes.model.value!;
    const mvpMatrix = m4.multiply(camera.matrix.vp, modelMatrix);
    this.matrixes.mvp.value = mvpMatrix;
    const normalMatrix = m4.transpose(m4.inverse(modelMatrix));
    this.matrixes.normal.value = normalMatrix;
    const toF32 = (m: Mat4) => (m instanceof Float32Array ? m : new Float32Array(m));
    if (this.matrixes.model.location)
      gl.uniformMatrix4fv(this.matrixes.model.location, false, toF32(modelMatrix));
    if (this.matrixes.mvp.location)
      gl.uniformMatrix4fv(this.matrixes.mvp.location, false, toF32(mvpMatrix));
    if (this.matrixes.normal.location)
      gl.uniformMatrix4fv(this.matrixes.normal.location, false, toF32(normalMatrix));
  }

  setRotation(xDeg: number, yDeg: number, zDeg: number): this {
    this.rotation.set(xDeg, yDeg, zDeg);
    return this;
  }

  setPosition(x: number, y: number, z: number): this {
    this.position.set(x, y, z);
    return this;
  }

  setScale(x: number, y: number, z: number): this {
    this.scale.set(x, y, z);
    return this;
  }
}
