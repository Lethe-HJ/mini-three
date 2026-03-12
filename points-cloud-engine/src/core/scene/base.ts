export interface SceneObjectBase {
  name: string;
  attach?(gl: WebGLRenderingContext, program?: WebGLProgram): void;
}
