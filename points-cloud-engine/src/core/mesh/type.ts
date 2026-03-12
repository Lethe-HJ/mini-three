import type { SceneObjectBase } from "../scene/base";
import type { Mat4 } from "../common/math/matrix/matrix4";
import type { Geometry } from "../geometry/type";
import type { Material } from "../material/type";
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

export interface Mesh extends SceneObjectBase {
  name: typeof ObjectType.Mesh;
  geometry: Geometry;
  material: Material;
  parent: Group | null;
  matrixes: MeshMatrixSet;
  attach(gl: WebGLRenderingContext): void;
  updateModelMatrix(): void;
  updateMatrix(gl: WebGLRenderingContext, camera: Camera): void;
  setRotation(xDeg: number, yDeg: number, zDeg: number): void;
  setPosition(x: number, y: number, z: number): void;
  setScale(x: number, y: number, z: number): void;
}
