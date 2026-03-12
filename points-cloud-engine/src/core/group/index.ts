import type { Group, GroupMatrixSet } from "./type";
import type { Mesh } from "../mesh/type";
import { m4 } from "../common/math/matrix/matrix4";
import { ObjectType } from "../common/object/type";

export function createGroup(): Group {
  const matrixes: GroupMatrixSet = {
    model: m4.identity(),
    localModel: m4.identity(),
    rotation: m4.identity(),
    translate: m4.identity(),
    scale: m4.identity(),
  };
  const group: Group = {
    name: ObjectType.Group,
    matrixes,
    children: [],
    parent: null,
    add(object: Mesh | Group) {
      this.children.push(object);
      object.parent = this;
    },
    updateModelMatrix() {
      const parentModel = group.parent ? group.parent.matrixes.model : null;
      matrixes.localModel = m4.multiplySeries(
        matrixes.translate,
        matrixes.rotation,
        matrixes.scale,
      );
      matrixes.model = parentModel
        ? m4.multiply(parentModel, matrixes.localModel)
        : matrixes.localModel;
      group.children.forEach((child) => child.updateModelMatrix());
    },
    setRotation(xDeg: number, yDeg: number, zDeg: number) {
      matrixes.rotation = m4.multiplySeries(
        m4.identity(),
        m4.xRotation(xDeg),
        m4.yRotation(yDeg),
        m4.zRotation(zDeg),
      );
    },
    setPosition(x: number, y: number, z: number) {
      matrixes.translate = m4.multiplySeries(m4.identity(), m4.translation(x, y, z));
    },
    setScale(x: number, y: number, z: number) {
      matrixes.scale = m4.multiplySeries(m4.identity(), m4.scaling(x, y, z));
    },
  };
  return group;
}
