import { Renderer } from "./type";

export function createRenderer(gl: WebGLRenderingContext): Renderer {
  return new Renderer(gl);
}

export { Renderer } from "./type";
