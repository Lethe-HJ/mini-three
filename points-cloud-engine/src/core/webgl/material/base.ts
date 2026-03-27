import { Color } from "../common/color/color";
import { createShaderProgram } from "../common/program";
import { shadersMap } from "../common/shader";
import { MaterialType } from "./type";

export interface MaterialConfig {
  type: number;
  color: string | number | Color;
  shininess?: number;
  specular?: string | number | Color;
}

export class Material {
  private shaderProgram: WebGLProgram | null = null;
  private _color: Color;
  private _specular?: Color;
  private config: MaterialConfig;

  constructor(config: MaterialConfig) {
    this.config = config;
    if (config.color instanceof Color) {
      this._color = config.color;
    } else {
      this._color = new Color(config.color);
    }
    if (config.type === MaterialType.Phong && config.specular != null) {
      if (config.specular instanceof Color) {
        this._specular = config.specular;
      } else {
        this._specular = new Color(config.specular);
      }
    }
  }

  get color(): Color {
    return this._color;
  }

  set color(value: Color) {
    this._color = value;
  }

  get specular(): Color | undefined {
    return this._specular;
  }

  set specular(value: Color | undefined) {
    this._specular = value;
  }

  private ensureShaderProgram(gl: WebGLRenderingContext): WebGLProgram {
    if (!this.shaderProgram) {
      const { vertex, fragment } = shadersMap[this.config.type];
      const shaderProgram = createShaderProgram(gl, vertex, fragment);
      if (!shaderProgram) throw new Error("Failed to create shader program");
      this.shaderProgram = shaderProgram;
    }
    return this.shaderProgram;
  }

  attach(gl: WebGLRenderingContext): void {
    const shaderProgram = this.ensureShaderProgram(gl);
    gl.useProgram(shaderProgram);
    const locColor = gl.getUniformLocation(shaderProgram, "u_material.color");
    if (locColor) gl.uniform3fv(locColor, this._color.toArray());
    if (this.config.type === MaterialType.Phong && this.config.shininess != null) {
      const locShininess = gl.getUniformLocation(shaderProgram, "u_material.shininess");
      if (locShininess) gl.uniform1f(locShininess, this.config.shininess);
      const locSpecular = gl.getUniformLocation(shaderProgram, "u_materialSpecular");
      if (locSpecular && this._specular) gl.uniform3fv(locSpecular, this._specular.toArray());
    }
  }

  getShaderProgram(): WebGLProgram | null {
    return this.shaderProgram;
  }
}
