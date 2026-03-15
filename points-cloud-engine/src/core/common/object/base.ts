export class BaseObject {
  name: string;
  constructor(name: string) {
    this.name = name;
  }

  attach?(gl: WebGLRenderingContext, program?: WebGLProgram): void;
}
