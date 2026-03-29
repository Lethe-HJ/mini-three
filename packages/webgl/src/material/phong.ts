import { phongShader, ShaderSource } from "../common/shader";
import { Color } from "../common/color/color";
import { Material, MaterialConfig } from "./base";

export interface MeshPhongMaterialConfig extends MaterialConfig {
  color: Color | number;
  specular?: Color | number;
  shininess?: number;
}

export class MeshPhongMaterial extends Material {
  private _specular?: Color;
  constructor(config: MeshPhongMaterialConfig) {
    if (typeof config.specular === "number") {
      config.specular = Color.fromNumber(config.specular);
    }
    super(config);
  }

  get specular(): Color | undefined {
    return this._specular;
  }

  set specular(value: Color | undefined) {
    this._specular = value;
  }

  init() {
    this.initShader();
    this.initColor();
    this.initSpecular();
  }

  initShader() {
    this.shaderSource = ShaderSource.create(phongShader.vertex, phongShader.fragment);
  }

  initSpecular() {
    const config = this.config;
    if (config.specular instanceof Color) {
      this._specular = config.specular;
    } else {
      this._specular = new Color(config.specular);
    }
  }

  attach(gl: WebGL2RenderingContext, skipUseProgram = false): void {
    super.attach(gl, skipUseProgram);
    const sp = this.ensureShaderProgram(gl);
    if (this.config.shininess != null) {
      const locShininess = sp.getUniformLocation("u_material.shininess");
      if (locShininess) gl.uniform1f(locShininess, this.config.shininess);
      const locSpecular = sp.getUniformLocation("u_materialSpecular");
      if (locSpecular && this._specular) gl.uniform3fv(locSpecular, this._specular.toArray());
    }
  }
}
