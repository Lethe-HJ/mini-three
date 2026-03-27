import { Color } from "../common/color/color";
import { Material } from "./base";
import { MaterialType } from "./type";

interface MeshPhongMaterialParameters {
  color?: Color | number;
  specular?: Color | number;
  shininess?: number;
}

export class MeshPhongMaterial extends Material {
  constructor(parameters: MeshPhongMaterialParameters = {}) {
    if (typeof parameters.color === "number") {
      parameters.color = Color.fromNumber(parameters.color);
    }
    if (typeof parameters.specular === "number") {
      parameters.specular = Color.fromNumber(parameters.specular);
    }
    super({
      type: MaterialType.Phong,
      color: parameters.color ?? Color.fromNumber(0xffffff),
      specular: parameters.specular ?? Color.fromNumber(0x111111),
      shininess: parameters.shininess ?? 30,
    });
  }
}
