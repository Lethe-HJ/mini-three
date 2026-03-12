import type { Mat4 } from "../common/math/matrix/matrix4";
import type { ObjectType } from "../common/object/type";
import type { Mesh } from "../mesh/type";
import type { SceneObjectBase } from "../scene/base";

export interface GroupMatrixSet {
  model: Mat4;
  localModel: Mat4;
  rotation: Mat4;
  translate: Mat4;
  scale: Mat4;
}

export interface Group extends SceneObjectBase {
  name: typeof ObjectType.Group;
  matrixes: GroupMatrixSet;
  children: (Mesh | Group)[];
  parent: Group | null;
  add(object: Mesh | Group): void;
  updateModelMatrix(): void;
  setRotation(xDeg: number, yDeg: number, zDeg: number): void;
  setPosition(x: number, y: number, z: number): void;
  setScale(x: number, y: number, z: number): void;
}
