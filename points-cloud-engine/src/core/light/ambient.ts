import { color3 } from "../common/color/color3";

export class AmbientLight {
  name: "AmbientLight";
  color: [number, number, number];
  intensity: number;

  constructor(color: string, intensity: number = 1) {
    this.name = "AmbientLight";
    this.color = color3.hexToRgbNormalized(color);
    this.intensity = intensity;
  }

  setColor(color: string): this {
    this.color = color3.hexToRgbNormalized(color);
    return this;
  }

  setIntensity(intensity: number): this {
    this.intensity = intensity;
    return this;
  }

  attach(gl: WebGLRenderingContext, program: WebGLProgram): void {
    const loc = gl.getUniformLocation(program, "u_ambientLightColor");
    if (loc) {
      const scaledColor = this.color.map((c) => c * this.intensity) as [number, number, number];
      gl.uniform3fv(loc, scaledColor);
    }
  }
}
