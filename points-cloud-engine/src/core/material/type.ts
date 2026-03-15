import { color3 } from "../common/color/color3";
import { createShaderProgram } from "../common/program";
import { shadersMap } from "../common/shader";
import { MaterialType } from "./types";
import type { MaterialConfig } from "./types";

export class Material {
  shaderProgram: WebGLProgram;
  color: [number, number, number];
  specular?: [number, number, number];
  private config: MaterialConfig;

  constructor(config: MaterialConfig, gl: WebGLRenderingContext) {
    this.config = config;
    const { vertex, fragment } = shadersMap[config.type];
    const shaderProgram = createShaderProgram(gl, vertex, fragment);
    if (!shaderProgram) throw new Error("Failed to create shader program");
    this.shaderProgram = shaderProgram;
    this.color = color3.hexToRgbNormalized(config.color);
    if (config.type === MaterialType.Phong && config.specular != null) {
      this.specular = color3.hexToRgbNormalized(config.specular);
    }
  }

  attach(gl: WebGLRenderingContext): void {
    gl.useProgram(this.shaderProgram);
    const locColor = gl.getUniformLocation(this.shaderProgram, "u_material.color");
    if (locColor) gl.uniform3fv(locColor, this.color);
    if (this.config.type === MaterialType.Phong && this.config.shininess != null) {
      const locShininess = gl.getUniformLocation(this.shaderProgram, "u_material.shininess");
      if (locShininess) gl.uniform1f(locShininess, this.config.shininess);
      const locSpecular = gl.getUniformLocation(this.shaderProgram, "u_materialSpecular");
      if (locSpecular && this.specular) gl.uniform3fv(locSpecular, this.specular);
    }
  }
}
