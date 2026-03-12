import type { Mesh } from "../mesh/type";
import type { AmbientLight } from "../light/ambient";
import type { PointLight } from "../light/point";
import type { Group } from "../group/type";

export type SceneChild = Mesh | Group | AmbientLight | PointLight;

export interface Scene {
  meshes: Mesh[];
  objects: SceneChild[];
  groups: Group[];
  children: SceneChild[];
  add(object: SceneChild): void;
}
