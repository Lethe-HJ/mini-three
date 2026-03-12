import type { ShaderSource } from "./type";
import { OUTPUT_SCALE } from "./config";

// ============ Shaders ============
export const noneShader: ShaderSource = {
  vertex: /*glsl */ `
    attribute vec4 a_position;
    uniform mat4 u_mvpMatrix;
    uniform vec3 u_materialColor;

    varying vec4 v_color;

    void main() {
    vec4 color = vec4(u_materialColor, 1.0); // 物体表面的颜色
    v_color = color;
    vec4 vertexPosition = u_mvpMatrix * a_position;
    gl_Position =  vertexPosition;
    }
`,
  fragment: /*glsl */ `
    precision highp float;
    varying vec4 v_color;
    #define OUTPUT_SCALE ${OUTPUT_SCALE}
    float linearToSrgb(float c) { return (c <= 0.0031308) ? c * 12.92 : 1.055 * pow(c, 1.0/2.4) - 0.055; }
    vec3 linearToSrgb(vec3 c) { return vec3(linearToSrgb(c.r), linearToSrgb(c.g), linearToSrgb(c.b)); }
    void main() {
      gl_FragColor = vec4(linearToSrgb(v_color.rgb * OUTPUT_SCALE), v_color.a);
    }
  `,
};
