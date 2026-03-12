import { color3 } from "../common/color/color3";

export interface AmbientLightConfig {
  color: string;
}

export interface AmbientLight {
  name: "AmbientLight";
  color: [number, number, number];
  attach(gl: WebGLRenderingContext, program: WebGLProgram): void;
}

export function createAmbientLight(config: AmbientLightConfig): AmbientLight {
  const _color = color3.hexToRgbNormalized(config.color);
  return {
    name: "AmbientLight",
    color: _color,
    attach(gl: WebGLRenderingContext, program: WebGLProgram) {
      const loc = gl.getUniformLocation(program, "u_ambientLightColor");
      if (loc) gl.uniform3fv(loc, _color);
    },
  };
}
