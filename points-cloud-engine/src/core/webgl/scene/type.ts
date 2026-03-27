import type { Mesh } from "../mesh/type";
import type { AmbientLight } from "../light/ambient";
import type { PointLight } from "../light/point";
import type { Group } from "../group/type";
import { ObjectType } from "../common/object/type";
import { Color } from "../common/color/color";

export type SceneChild = Mesh | Group | AmbientLight | PointLight;

export class Scene {
  meshes: Mesh[];
  objects: SceneChild[];
  groups: Group[];
  children: SceneChild[];
  private _background: Color | null;

  constructor() {
    this.meshes = [];
    this.objects = [];
    this.groups = [];
    this.children = [];
    this._background = null;
  }

  add(object: SceneChild): void {
    this.children.push(object); // 总是添加到 children 中

    if (object.name === ObjectType.Mesh) {
      this.meshes.push(object as Mesh); // 添加 mesh 到 meshes 数组
    } else if (object.name === ObjectType.Group) {
      this.groups.push(object as Group); // 仅添加顶级 group 到 groups 数组
      // 递归添加组内的所有 mesh 到 meshes 数组
      this._addGroupMeshes(object as Group);
    } else {
      this.objects.push(object);
    }
  }

  private _addGroupMeshes(group: Group): void {
    group.children.forEach((child: Mesh | Group) => {
      if (child.name === ObjectType.Mesh) {
        this.meshes.push(child as Mesh);
      } else if (child.name === ObjectType.Group) {
        // 如果组内还有子组，则递归处理
        this._addGroupMeshes(child as Group);
      }
    });
  }

  setBackground(color: [number, number, number]): this {
    this._background = new Color(color);
    return this;
  }

  get background(): Color | null {
    return this._background;
  }

  set background(color: Color | null) {
    this._background = color;
  }
}
