import { m4 } from "../common/math/matrix/matrix4";
import type { Camera, CameraConfig } from "./type";

export function createCamera(config: CameraConfig): Camera & CameraConfig {
  const { position, target, up, fov, aspect, near, far } = config;

  const cameraMatrix = m4.lookAt(position, target, up);
  const viewMatrix = m4.inverse(cameraMatrix);

  const projectionMatrix = m4.perspective(fov, aspect, near, far);

  const vpMatrix = m4.multiply(projectionMatrix, viewMatrix);

  return {
    ...config,
    matrix: {
      camera: cameraMatrix,
      projection: projectionMatrix,
      view: viewMatrix,
      vp: vpMatrix,
    },
    attach(gl: WebGLRenderingContext, program: WebGLProgram) {
      gl.useProgram(program);
      const loc = gl.getUniformLocation(program, "u_cameraPosition");
      if (loc) gl.uniform3fv(loc, position);
    },
  };
}
