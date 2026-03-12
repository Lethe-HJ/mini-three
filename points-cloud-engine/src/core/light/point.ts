import { color3 } from "../common/color/color3";
import type { Vec3 } from "../common/math/vector/vec3";

interface PointLightConfig {
  color: string;
  position: Vec3;
  /** constant, linear, quadratic；与 Three.js 一致时用 [1,0,0] 表示无距离衰减 */
  attenuation: [number, number, number];
  /** 光源强度，与 Three.js PointLight.intensity 一致，默认 1 */
  intensity?: number;
}

export function createPointLight(pointLight: PointLightConfig): PointLight {
  const _color = color3.hexToRgbNormalized(pointLight.color);
  const intensity = pointLight.intensity ?? 1;
  return {
    ...pointLight,
    intensity,
    name: "PointLight",
    attach(gl: WebGLRenderingContext, program: WebGLProgram) {
      const locPos = gl.getUniformLocation(program, "u_pointLight.position");
      const locColor = gl.getUniformLocation(program, "u_pointLight.color");
      const locC = gl.getUniformLocation(program, "u_pointLight.constant");
      const locL = gl.getUniformLocation(program, "u_pointLight.linear");
      const locQ = gl.getUniformLocation(program, "u_pointLight.quadratic");
      const locIntensity = gl.getUniformLocation(program, "u_pointLightIntensity");
      if (locPos) gl.uniform3fv(locPos, pointLight.position);
      if (locColor) gl.uniform3fv(locColor, _color);
      if (locC) gl.uniform1f(locC, pointLight.attenuation[0]);
      if (locL) gl.uniform1f(locL, pointLight.attenuation[1]);
      if (locQ) gl.uniform1f(locQ, pointLight.attenuation[2]);
      if (locIntensity) gl.uniform1f(locIntensity, intensity);
    },
  };
}

export interface PointLight {
  name: "PointLight";
  position: Vec3;
  color: string;
  attenuation: [number, number, number];
  intensity: number;
  attach(gl: WebGLRenderingContext, program: WebGLProgram): void;
}
