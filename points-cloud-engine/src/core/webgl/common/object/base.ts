import { Vector3 } from "../math/vector/vector3";

export class BaseObject {
  name: string;
  position: Vector3;
  rotation: Vector3;
  scale: Vector3;

  constructor(name: string) {
    this.name = name;
    this.position = new Vector3();
    this.rotation = new Vector3();
    this.scale = new Vector3(1, 1, 1);
  }

  attach?(gl: WebGLRenderingContext, program?: WebGLProgram): void;

  setPosition(x: number, y: number, z: number): this {
    this.position.set(x, y, z);
    return this;
  }

  setRotation(x: number, y: number, z: number): this {
    this.rotation.set(x, y, z);
    return this;
  }

  setScale(x: number, y: number, z: number): this {
    this.scale.set(x, y, z);
    return this;
  }
}
