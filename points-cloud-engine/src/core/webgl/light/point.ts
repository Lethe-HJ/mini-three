import { Color } from "../common/color/color";
import { Vector3 } from "../common/math/vector/vector3";

export class PointLight {
  name: "PointLight";
  private _position: Vector3;
  private _color: Color;
  private _intensity: number;
  private _distance: number;
  private _decay: number;
  private _attenuation: [number, number, number];

  constructor(
    color: string | number,
    intensity: number = 1,
    distance: number = 0,
    decay: number = 0,
  ) {
    this.name = "PointLight";
    this._position = new Vector3();
    this._color = new Color(color);
    this._intensity = intensity;
    this._distance = distance;
    this._decay = decay;
    this._attenuation = [1, 0, 0]; // 默认为无衰减
  }

  get position(): Vector3 {
    return this._position;
  }

  set position(value: Vector3) {
    this._position = value;
  }

  get color(): Color {
    return this._color;
  }

  set color(value: Color) {
    this._color = value;
  }

  get intensity(): number {
    return this._intensity;
  }

  set intensity(value: number) {
    this._intensity = value;
  }

  get distance(): number {
    return this._distance;
  }

  set distance(value: number) {
    this._distance = value;
  }

  get decay(): number {
    return this._decay;
  }

  set decay(value: number) {
    this._decay = value;
  }

  setPosition(x: number, y: number, z: number): this {
    this._position.set(x, y, z);
    return this;
  }

  setColor(color: string | number): this {
    this._color = new Color(color);
    return this;
  }

  setIntensity(intensity: number): this {
    this._intensity = intensity;
    return this;
  }

  setDistance(distance: number): this {
    this._distance = distance;
    return this;
  }

  setDecay(decay: number): this {
    this._decay = decay;
    return this;
  }

  attach(gl: WebGLRenderingContext, program: WebGLProgram): void {
    const locPos = gl.getUniformLocation(program, "u_pointLight.position");
    const locColor = gl.getUniformLocation(program, "u_pointLight.color");
    const locC = gl.getUniformLocation(program, "u_pointLight.constant");
    const locL = gl.getUniformLocation(program, "u_pointLight.linear");
    const locQ = gl.getUniformLocation(program, "u_pointLight.quadratic");
    const locIntensity = gl.getUniformLocation(program, "u_pointLightIntensity");
    if (locPos) gl.uniform3fv(locPos, this._position.toArray());
    if (locColor) gl.uniform3fv(locColor, this._color.toArray());
    if (locC) gl.uniform1f(locC, this._attenuation[0]);
    if (locL) gl.uniform1f(locL, this._attenuation[1]);
    if (locQ) gl.uniform1f(locQ, this._attenuation[2]);
    if (locIntensity) gl.uniform1f(locIntensity, this._intensity);
  }
}
