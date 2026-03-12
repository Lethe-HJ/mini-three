export interface Geometry {
  vertices: Float32Array;
  normals: Float32Array;
  indices: Uint8Array;
  attach(gl: WebGLRenderingContext, program: WebGLProgram): void;
}
