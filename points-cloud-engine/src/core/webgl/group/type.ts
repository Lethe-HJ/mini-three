import { m4 } from "../common/math/matrix/matrix4";
import type { Mat4 } from "../common/math/matrix/matrix4";
import { BaseObject } from "../common/object/base";
import { ObjectType } from "../common/object/type";
import type { Mesh } from "../mesh/type";

export interface GroupMatrixSet {
  model: Mat4;
  localModel: Mat4;
  rotation: Mat4;
  translate: Mat4;
  scale: Mat4;
}

export class Group extends BaseObject {
  name: typeof ObjectType.Group;
  matrixes: GroupMatrixSet;
  children: (Mesh | Group)[];
  parent: Group | null;

  constructor() {
    super(ObjectType.Group);
    this.name = ObjectType.Group;
    this.matrixes = {
      model: m4.identity(),
      localModel: m4.identity(),
      rotation: m4.identity(),
      translate: m4.identity(),
      scale: m4.identity(),
    };
    this.children = [];
    this.parent = null;
  }

  add(object: Mesh | Group): this {
    this.children.push(object);
    object.parent = this;
    return this;
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
    this.matrixes.model = parentModel
      ? m4.multiply(parentModel, this.matrixes.localModel)
      : this.matrixes.localModel;
    this.children.forEach((child) => child.updateModelMatrix());
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
