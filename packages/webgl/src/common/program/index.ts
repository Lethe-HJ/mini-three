import { ShaderSource } from "../shader";
import { type ShaderSourceUnique } from "../shader/source";
import { Brand } from "../../utils/type/brand";
import { getShortUnique } from "../../utils/unique";

export type GLUnique = Brand<string, "GLUnique">;

export type ShaderProgramUnique = `${GLUnique}-${ShaderSourceUnique}`;

export class ShaderProgram {
  private static readonly instances = new WeakMap<
    WebGL2RenderingContext,
    Map<ShaderProgramUnique, ShaderProgram>
  >();

  /** 当前使用的program */
  private static readonly currentProgram = new WeakMap<
    WebGL2RenderingContext,
    WebGLProgram | null
  >();

  private static readonly glUniqueMap = new WeakMap<
    WebGL2RenderingContext,
    GLUnique
  >();

  readonly gl: WebGL2RenderingContext;
  private readonly glProgram: WebGLProgram;
  private readonly uniformLocCache = new Map<
    string,
    WebGLUniformLocation | null
  >();

  static getUnique(
    glUnique: GLUnique,
    source: ShaderSource,
  ): ShaderProgramUnique {
    return `${glUnique}-${source.unique}` as ShaderProgramUnique;
  }

  /**
   * 切换当前 program
   * 注意: useProgram对性能影响较大，尽量减少调用
   * @returns
   */
  useProgram(): void {
    if (__LOG__)
      console.log(`[ShaderProgram] gl.useProgram, unique: ${this.unique}`);
    const last = ShaderProgram.currentProgram.get(this.gl);
    // 微小优化 如果上一次的program和当前的program一致，在驱动层面仍然会return
    // 但是直接在js代码层面直接return 性能更好
    if (last === this.glProgram) return;
    this.gl.useProgram(this.glProgram);
    ShaderProgram.currentProgram.set(this.gl, this.glProgram);
  }

  /**
   * 获取 uniform 位置
   * 注意: getUniformLocation对性能影响较大，尽量减少调用
   * @param name
   * @returns
   */
  getUniformLocation(name: string): WebGLUniformLocation | null {
    if (__LOG__)
      console.log(`[ShaderProgram] getUniformLocation, name: ${name}`);
    // 缓存uniform位置 避免每次都调用gl.getUniformLocation查询位置
    const cache = this.uniformLocCache.get(name);
    if (cache !== undefined) return cache;
    if (__LOG__)
      console.log(`[ShaderProgram] gl.getUniformLocation, name: ${name}`);
    const loc = this.gl.getUniformLocation(this.glProgram, name);
    this.uniformLocCache.set(name, loc);
    return loc;
  }

  /**
   * 获取 attribute 位置
   * 注意: getAttribLocation对性能影响较大，尽量减少调用（内部已按 name 缓存）
   * @param name
   * @returns
   */
  getAttribLocation(name: string): number {
    const cached = this.attribLocCache.get(name);
    if (cached !== undefined) return cached;
    if (__LOG__)
      console.log(`[ShaderProgram] gl.getAttribLocation, name: ${name}`);
    const loc = this.gl.getAttribLocation(this.glProgram, name);
    this.attribLocCache.set(name, loc);
    return loc;
  }

  static create(
    gl: WebGL2RenderingContext,
    source: ShaderSource,
  ): ShaderProgram {
    const glUniqueMap = ShaderProgram.glUniqueMap;
    if (!glUniqueMap.has(gl)) {
      glUniqueMap.set(gl, getShortUnique() as GLUnique);
    }
    const glUnique = glUniqueMap.get(gl)!;
    const unique = ShaderProgram.getUnique(glUnique, source);
    let perGl = ShaderProgram.instances.get(gl);
    if (!perGl) {
      perGl = new Map();
      ShaderProgram.instances.set(gl, perGl);
    }
    const hit = perGl.get(unique);
    if (hit) {
      return hit;
    }
    const sp = new ShaderProgram(gl, source, unique);
    perGl.set(unique, sp);
    return sp;
  }

  private unique: ShaderProgramUnique;

  private constructor(
    gl: WebGL2RenderingContext,
    source: ShaderSource,
    unique: ShaderProgramUnique,
  ) {
    if (__LOG__) console.log(`[ShaderProgram] constructor ${unique}`);
    this.gl = gl;
    this.unique = unique;
    const { vertex: vertexShaderSource, fragment: fragmentShaderSource } =
      source;
    const program = this.buildProgram(
      vertexShaderSource.code,
      fragmentShaderSource.code,
    );
    if (!program) {
      throw new Error("Failed to create shader program");
    }
    this.glProgram = program;
  }

  private buildProgram(
    vertexShaderSource: string,
    fragmentShaderSource: string,
  ): WebGLProgram | null {
    const gl = this.gl;
    const vertexShader = this.createShader(gl.VERTEX_SHADER);
    const fragmentShader = this.createShader(gl.FRAGMENT_SHADER);
    if (!vertexShader || !fragmentShader) {
      if (vertexShader) gl.deleteShader(vertexShader);
      if (fragmentShader) gl.deleteShader(fragmentShader);
      return null;
    }

    this.setShaderSource(vertexShader, vertexShaderSource);
    this.setShaderSource(fragmentShader, fragmentShaderSource);

    if (!this.compileShader(vertexShader, "vertex")) {
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      return null;
    }
    if (!this.compileShader(fragmentShader, "fragment")) {
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      return null;
    }

    const program = this.createProgram();
    if (!program) {
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      return null;
    }

    this.attachShaders(program, vertexShader, fragmentShader);
    if (!this.verifyLink(program)) {
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      return null;
    }

    return program;
  }

  private createShader(type: number): WebGLShader | null {
    return this.gl.createShader(type);
  }

  private setShaderSource(shader: WebGLShader, source: string): void {
    this.gl.shaderSource(shader, source);
  }

  private compileShader(
    shader: WebGLShader,
    kind: "vertex" | "fragment",
  ): boolean {
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error(
        `ERROR compiling ${kind} shader!`,
        this.gl.getShaderInfoLog(shader),
      );
      return false;
    }
    return true;
  }

  private createProgram(): WebGLProgram | null {
    return this.gl.createProgram();
  }

  private attachShaders(
    program: WebGLProgram,
    vertexShader: WebGLShader,
    fragmentShader: WebGLShader,
  ): void {
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
  }

  private verifyLink(program: WebGLProgram): boolean {
    this.gl.linkProgram(program);
    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      console.error(
        "ERROR linking program!",
        this.gl.getProgramInfoLog(program),
      );
      return false;
    }
    return true;
  }
}
