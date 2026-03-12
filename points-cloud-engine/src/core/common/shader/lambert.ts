import type { ShaderSource } from "./type";
import { OUTPUT_SCALE } from "./config";

export const lambertShader: ShaderSource = {
  vertex: /*glsl */ `
        precision lowp float;
    
        attribute vec4 a_position;
        attribute vec4 a_normal;
        uniform vec3 u_ambientLightColor;
        uniform vec3 u_materialColor;
        uniform mat4 u_mvpMatrix;
        uniform mat4 u_normalMatrix;
        uniform mat4 u_modelMatrix;
        
    
        varying vec4 v_color;
    
        struct Material {
          vec3 color;
          float shininess;
        };
    
        uniform Material u_material;
    
        struct PointLight {
          vec3 color;
          vec3 position;
          float constant;
          float linear;
          float quadratic;
        };
        uniform PointLight u_pointLight;
        uniform float u_pointLightIntensity;
    
        void main() {
          vec4 color = vec4(u_material.color, 1.0);
          vec4 vertexPosition = u_mvpMatrix * a_position;
          vec4 worldPosition = u_modelMatrix * a_position;
          vec3 lightDirection = normalize(u_pointLight.position - worldPosition.xyz);
          vec3 ambientColor = u_ambientLightColor * vec3(color);
          vec3 transformedNormal = normalize(vec3(u_normalMatrix * vec4(vec3(a_normal), 0.0)));
          float dist = length(u_pointLight.position - worldPosition.xyz);
          float attenuation = 1.0 / (u_pointLight.constant + u_pointLight.linear * dist + u_pointLight.quadratic * dist * dist);
          float dotDeg = max(dot(transformedNormal, lightDirection), 0.0);
          vec3 diffuseColor = u_pointLight.color * vec3(color) * dotDeg * attenuation * u_pointLightIntensity;
          v_color = vec4(ambientColor + diffuseColor, color.a);
          gl_Position =  vertexPosition;
        }
      `,
  fragment: /*glsl */ `
        precision lowp float;
        varying vec4 v_color;
        #define OUTPUT_SCALE ${OUTPUT_SCALE}
        float linearToSrgb(float c) { return (c <= 0.0031308) ? c * 12.92 : 1.055 * pow(c, 1.0/2.4) - 0.055; }
        vec3 linearToSrgb(vec3 c) { return vec3(linearToSrgb(c.r), linearToSrgb(c.g), linearToSrgb(c.b)); }
        void main() {
          gl_FragColor = vec4(linearToSrgb(v_color.rgb * OUTPUT_SCALE), v_color.a);
        }
      `,
};
