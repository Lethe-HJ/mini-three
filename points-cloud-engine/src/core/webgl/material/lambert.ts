import { Color } from "../common/color/color";
import { Material } from "./base";
import { MaterialType } from "./type";

interface MeshLambertMaterialParameters {
  color?: Color | string | number;
}

export class MeshLambertMaterial extends Material {
  constructor(parameters: MeshLambertMaterialParameters = {}) {
    if (typeof parameters.color === "number") {
      parameters.color = Color.fromNumber(parameters.color);
    }
    super({
      type: MaterialType.Lambert,
      color: parameters.color ?? Color.fromNumber(0xffffff),
    });
  }
}
