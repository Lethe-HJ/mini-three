import type { Camera } from "../camera/type";
import type { Scene } from "../scene/type";

export interface Renderer {
  render(scene: Scene, camera: Camera): void;
}
