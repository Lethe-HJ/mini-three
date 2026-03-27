export interface MaterialConfig {
  type: number;
  color: string | number;
  shininess?: number;
  specular?: string | number;
}

export const MaterialType: { None: number; Lambert: number; Phong: number } = {
  None: 0,
  Lambert: 1,
  Phong: 2,
};
