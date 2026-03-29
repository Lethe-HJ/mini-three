import { lambertShader, ShaderSource } from "../common/shader";
import { Color } from "../common/color/color";
import { Material } from "./base";

export interface MeshLambertMaterialConfig {
  color: Color | number;
}

export class MeshLambertMaterial extends Material {
  constructor(config: MeshLambertMaterialConfig) {
    super(config);
  }

  init() {
    this.initShader();
    this.initColor();
  }

  initShader() {
    this.shaderSource = ShaderSource.create(lambertShader.vertex, lambertShader.fragment);
  }
}
