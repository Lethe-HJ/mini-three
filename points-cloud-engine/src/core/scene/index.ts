import type { Group } from "../group/type";
import type { Mesh } from "../mesh/type";
import type { Scene, SceneChild } from "./type";
import { ObjectType } from "../common/object/type";

export function createScene(): Scene {
  return {
    meshes: [] as Mesh[],
    objects: [] as SceneChild[],
    groups: [] as Group[],
    children: [] as SceneChild[],
    add(object: SceneChild) {
      this.children.push(object); // 总是添加到 children 中

      if (object.name === ObjectType.Mesh) {
        this.meshes.push(object as Mesh); // 添加 mesh 到 meshes 数组
      } else if (object.name === ObjectType.Group) {
        this.groups.push(object as Group); // 仅添加顶级 group 到 groups 数组
        // 递归添加组内的所有 mesh 到 meshes 数组
        (object as Group).children.forEach((child: Mesh | Group) => {
          if (child.name === ObjectType.Mesh) {
            this.meshes.push(child as Mesh);
          } else if (child.name === ObjectType.Group) {
            // 如果组内还有子组，则递归处理
            this.add(child);
          }
        });
      } else {
        this.objects.push(object);
      }
    },
  };
}
