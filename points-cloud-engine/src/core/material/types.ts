export interface MaterialConfig {
  type: number;
  color: string;
  shininess?: number;
  specular?: string;
}

export const MaterialType: { None: number; Lambert: number; Phong: number } = {
  None: 0,
  Lambert: 1,
  Phong: 2,
};
