import { Color } from "../common/color/color";

export class AmbientLight {
  name: "AmbientLight";
  private _color: Color;
  private _intensity: number;

  constructor(color: string | number, intensity: number = 1) {
    this.name = "AmbientLight";
    this._color = new Color(color);
    this._intensity = intensity;
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

  setColor(color: string | number): this {
    this._color = new Color(color);
    return this;
  }

  setIntensity(intensity: number): this {
    this._intensity = intensity;
    return this;
  }

  attach(gl: WebGLRenderingContext, program: WebGLProgram): void {
    const loc = gl.getUniformLocation(program, "u_ambientLightColor");
    if (loc) {
      const colorArray = this._color.toArray();
      const scaledColor = colorArray.map((c) => c * this._intensity) as [number, number, number];
      gl.uniform3fv(loc, scaledColor);
    }
  }
}
