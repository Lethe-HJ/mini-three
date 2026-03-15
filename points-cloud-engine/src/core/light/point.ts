import { color3 } from "../common/color/color3";
import type { Vec3 } from "../common/math/vector/vec3";

export class PointLight {
  name: "PointLight";
  position: Vec3;
  color: [number, number, number];
  intensity: number;
  distance: number;
  decay: number;
  private _attenuation: [number, number, number];

  constructor(color: string, intensity: number = 1, distance: number = 0, decay: number = 0) {
    this.name = "PointLight";
    this.position = [0, 0, 0];
    this.color = color3.hexToRgbNormalized(color);
    this.intensity = intensity;
    this.distance = distance;
    this.decay = decay;
    this._attenuation = [1, 0, 0]; // 默认为无衰减
  }

  setPosition(x: number, y: number, z: number): this {
    this.position = [x, y, z];
    return this;
  }

  setColor(color: string): this {
    this.color = color3.hexToRgbNormalized(color);
    return this;
  }

  setIntensity(intensity: number): this {
    this.intensity = intensity;
    return this;
  }

  setDistance(distance: number): this {
    this.distance = distance;
    return this;
  }

  setDecay(decay: number): this {
    this.decay = decay;
    return this;
  }

  attach(gl: WebGLRenderingContext, program: WebGLProgram): void {
    const locPos = gl.getUniformLocation(program, "u_pointLight.position");
    const locColor = gl.getUniformLocation(program, "u_pointLight.color");
    const locC = gl.getUniformLocation(program, "u_pointLight.constant");
    const locL = gl.getUniformLocation(program, "u_pointLight.linear");
    const locQ = gl.getUniformLocation(program, "u_pointLight.quadratic");
    const locIntensity = gl.getUniformLocation(program, "u_pointLightIntensity");
    if (locPos) gl.uniform3fv(locPos, this.position);
    if (locColor) gl.uniform3fv(locColor, this.color);
    if (locC) gl.uniform1f(locC, this._attenuation[0]);
    if (locL) gl.uniform1f(locL, this._attenuation[1]);
    if (locQ) gl.uniform1f(locQ, this._attenuation[2]);
    if (locIntensity) gl.uniform1f(locIntensity, this.intensity);
  }
}
