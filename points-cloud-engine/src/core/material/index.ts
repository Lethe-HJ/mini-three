import { color3 } from "../common/color/color3";
import { createShaderProgram } from "../common/program";
import { shadersMap } from "../common/shader";
import { MaterialType } from "./type";
import type { Material, MaterialConfig } from "./type";

export function createMaterial(config: MaterialConfig, gl: WebGLRenderingContext): Material {
  const { vertex, fragment } = shadersMap[config.type];
  const shaderProgram = createShaderProgram(gl, vertex, fragment);
  if (!shaderProgram) throw new Error("Failed to create shader program");
  const _color = color3.hexToRgbNormalized(config.color);
  const _specular =
    config.specular != null
      ? color3.hexToRgbNormalized(config.specular)
      : ([1, 1, 1] as [number, number, number]);
  return {
    shaderProgram,
    color: _color,
    specular: config.type === MaterialType.Phong ? _specular : undefined,
    attach(gl: WebGLRenderingContext) {
      gl.useProgram(shaderProgram);
      const locColor = gl.getUniformLocation(shaderProgram, "u_material.color");
      if (locColor) gl.uniform3fv(locColor, _color);
      if (config.type === MaterialType.Phong && config.shininess != null) {
        const locShininess = gl.getUniformLocation(shaderProgram, "u_material.shininess");
        if (locShininess) gl.uniform1f(locShininess, config.shininess);
        const locSpecular = gl.getUniformLocation(shaderProgram, "u_materialSpecular");
        if (locSpecular && this.specular) gl.uniform3fv(locSpecular, this.specular);
      }
    },
  };
}
