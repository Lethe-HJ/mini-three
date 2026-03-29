import { m4 } from "../common/math/matrix/matrix4";
import type { Mat4 } from "../common/math/matrix/matrix4";
import { BaseObject } from "../common/object/base";
import { ObjectType } from "../common/object/type";
import type { Mesh } from "../mesh";

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
  private readonly lastModelTransform = {
    px: Number.NaN,
    py: Number.NaN,
    pz: Number.NaN,
    rx: Number.NaN,
    ry: Number.NaN,
    rz: Number.NaN,
    sx: Number.NaN,
    sy: Number.NaN,
    sz: Number.NaN,
  };
  private readonly lastParentWorldModel = new Float32Array(16);
  private lastParentWorldPresent = false;

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

  private trsMatchesSnapshot(): boolean {
    const t = this.lastModelTransform;
    const p = this.position;
    const r = this.rotation;
    const s = this.scale;
    return (
      p.x === t.px &&
      p.y === t.py &&
      p.z === t.pz &&
      r.x === t.rx &&
      r.y === t.ry &&
      r.z === t.rz &&
      s.x === t.sx &&
      s.y === t.sy &&
      s.z === t.sz
    );
  }

  private saveTrsSnapshot(): void {
    const t = this.lastModelTransform;
    const p = this.position;
    const r = this.rotation;
    const s = this.scale;
    t.px = p.x;
    t.py = p.y;
    t.pz = p.z;
    t.rx = r.x;
    t.ry = r.y;
    t.rz = r.z;
    t.sx = s.x;
    t.sy = s.y;
    t.sz = s.z;
  }

  private parentWorldMatches(m: Mat4): boolean {
    const s = this.lastParentWorldModel;
    for (let i = 0; i < 16; i++) {
      if (m[i] !== s[i]) return false;
    }
    return true;
  }

  private saveParentWorldSnapshot(m: Mat4): void {
    for (let i = 0; i < 16; i++) {
      this.lastParentWorldModel[i] = m[i];
    }
  }

  updateModelMatrix(): void {
    const parentModel = this.parent ? this.parent.matrixes.model : null;
    const hasParent = parentModel !== null;

    const trsUnchanged = this.trsMatchesSnapshot();
    const parentUnchanged =
      hasParent === this.lastParentWorldPresent &&
      (!hasParent || this.parentWorldMatches(parentModel!));

    if (!(trsUnchanged && parentUnchanged)) {
      if (!trsUnchanged) {
        this.matrixes.translate = m4.translation(this.position.x, this.position.y, this.position.z);
        this.matrixes.rotation = m4.multiplySeries(
          m4.identity(),
          m4.xRotation(this.rotation.x),
          m4.yRotation(this.rotation.y),
          m4.zRotation(this.rotation.z),
        );
        this.matrixes.scale = m4.scaling(this.scale.x, this.scale.y, this.scale.z);
        this.matrixes.localModel = m4.multiplySeries(
          this.matrixes.translate,
          this.matrixes.rotation,
          this.matrixes.scale,
        );
        this.saveTrsSnapshot();
      }

      if (!trsUnchanged || !parentUnchanged) {
        this.matrixes.model = parentModel
          ? m4.multiply(parentModel, this.matrixes.localModel)
          : this.matrixes.localModel;
      }

      this.lastParentWorldPresent = hasParent;
      if (hasParent && parentModel) {
        this.saveParentWorldSnapshot(parentModel);
      }
    }

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
