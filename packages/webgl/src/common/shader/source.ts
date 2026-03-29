import { FragmentCodeSource, VertexCodeSource } from "./base";

export type ShaderSourceUnique =
  `${VertexCodeSource["unique"]}-${FragmentCodeSource["unique"]}`;

export class ShaderSource {
  static readonly instances = new Map<ShaderSourceUnique, ShaderSource>();
  private readonly _unique: ShaderSourceUnique;
  private readonly _vertex: VertexCodeSource;
  private readonly _fragment: FragmentCodeSource;
  private constructor(
    vertex: VertexCodeSource,
    fragment: FragmentCodeSource,
    unique?: ShaderSourceUnique,
  ) {
    this._vertex = vertex;
    this._fragment = fragment;
    this._unique = unique ?? ShaderSource.getUnique(vertex, fragment);
  }

  static create(
    vertex: VertexCodeSource,
    fragment: FragmentCodeSource,
  ): ShaderSource {
    const unique = ShaderSource.getUnique(vertex, fragment);
    const hit = ShaderSource.instances.get(unique);
    if (hit) return hit;
    const instance = new ShaderSource(vertex, fragment, unique);
    ShaderSource.instances.set(unique, instance);
    return instance;
  }

  static getUnique(
    vertex: VertexCodeSource,
    fragment: FragmentCodeSource,
  ): ShaderSourceUnique {
    return `${vertex.unique}-${fragment.unique}` as ShaderSourceUnique;
  }

  get unique(): ShaderSourceUnique {
    return this._unique;
  }

  get vertex(): VertexCodeSource {
    return this._vertex;
  }

  get fragment(): FragmentCodeSource {
    return this._fragment;
  }
}
