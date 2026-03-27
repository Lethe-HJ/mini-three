import { Camera } from "./type";
import { PerspectiveCamera } from "./perspective";
import type { Vec3 } from "../common/math/vector/vec3";

export function createCamera(config: {
  fov: number;
  aspect: number;
  near: number;
  far: number;
  position: Vec3;
  target: Vec3;
  up: Vec3;
}): Camera {
  const camera = new Camera(config.fov, config.aspect, config.near, config.far);
  camera.setPosition(config.position[0], config.position[1], config.position[2]);
  camera.lookAt(config.target[0], config.target[1], config.target[2]);
  camera.setUp(config.up[0], config.up[1], config.up[2]);
  return camera;
}

export { Camera, PerspectiveCamera };
