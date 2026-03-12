import { lambertShader } from "./lambert";
import { noneShader } from "./none";
import { phongShader } from "./phong";
import { type ShaderSource } from "./type";
import { MaterialType } from "../../material/type";

export const shadersMap: Record<number, ShaderSource> = {
  [MaterialType.None]: noneShader,
  [MaterialType.Lambert]: lambertShader,
  [MaterialType.Phong]: phongShader,
};
