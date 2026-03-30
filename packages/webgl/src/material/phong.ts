import { phongShader, ShaderSource } from "../common/shader";
import { Color } from "../common/color/color";
import { Material, MaterialConfig } from "./base";

export interface MeshPhongMaterialConfig extends MaterialConfig {
  color: Color | number;
  specular?: Color | number;
  shininess?: number;
}

/** 与 Three.js MeshPhongMaterial 常见默认一致：未指定时使用灰色高光与中等 shininess */
const DEFAULT_SPECULAR = 0x111111;
const DEFAULT_SHININESS = 30;

export class MeshPhongMaterial extends Material {
  private _specular!: Color;
  constructor(config: MeshPhongMaterialConfig) {
    if (typeof config.specular === "number") {
      config.specular = Color.fromNumber(config.specular);
    }
    super(config);
  }

  get specular(): Color {
    return this._specular;
  }

  set specular(value: Color | undefined) {
    this._specular = value ?? Color.fromNumber(DEFAULT_SPECULAR);
  }

  init() {
    this.initShader();
    this.initColor();
    this.initSpecular();
  }

  initShader() {
    this.shaderSource = ShaderSource.create(
      phongShader.vertex,
      phongShader.fragment,
    );
  }

  initSpecular() {
    const config = this.config;
    const spec = config.specular;
    if (spec instanceof Color) {
      this._specular = spec;
    } else if (spec != null) {
      this._specular = new Color(spec as string | number);
    } else {
      this._specular = Color.fromNumber(DEFAULT_SPECULAR);
    }
  }

  attach(gl: WebGL2RenderingContext, skipUseProgram = false): void {
    if (this._specular === undefined) {
      this.initSpecular();
    }
    super.attach(gl, skipUseProgram);
    const sp = this.ensureShaderProgram(gl);
    const shininess = this.config.shininess ?? DEFAULT_SHININESS;
    const locShininess = sp.getUniformLocation("u_material.shininess");
    if (locShininess) gl.uniform1f(locShininess, shininess);
    const locSpecular = sp.getUniformLocation("u_materialSpecular");
    if (locSpecular) {
      const spec = this._specular ?? Color.fromNumber(DEFAULT_SPECULAR);
      gl.uniform3fv(locSpecular, spec.toArray());
    }
  }
}
