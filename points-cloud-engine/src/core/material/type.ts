export interface MaterialConfig {
  type: number;
  color: string;
  shininess?: number;
  /** Phong 高光颜色，与 Three.js MeshPhongMaterial.specular 一致，默认白 #ffffff */
  specular?: string;
}

export const MaterialType: { None: number; Lambert: number; Phong: number } = {
  None: 0,
  Lambert: 1,
  Phong: 2,
};

export interface Material {
  shaderProgram: WebGLProgram;
  color: [number, number, number];
  specular?: [number, number, number];
  attach(gl: WebGLRenderingContext): void;
}
