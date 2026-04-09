import { ShaderSource } from "../common/shader";
import { Color } from "../common/color/color";
import { ShaderProgram } from "../common/program";
import { UniformName } from "../utils/type/gl";

export interface MaterialConfig {
  color: string | number | Color;
  [key: string]: any;
}

/**
 * u_material - 材质结构体名称
 */
const _U_Material = "u_material" as UniformName;
const _U__Color = "color" as UniformName;

const U_Material = {
  /**
   * color - 材质颜色
   */
  Color: `${_U_Material}.${_U__Color}` as UniformName,
} as const;

type U_Material = (typeof U_Material)[keyof typeof U_Material];

type MaterialNeedUpdate = {
  color: boolean;
};

/**
 * 材质基类
 */
export abstract class Material {
  private _shaderProgram: ShaderProgram | undefined = undefined;
  private _offProgramActivated: (() => void) | undefined;

  private readonly needUpdateMap = new Map<ShaderProgram, MaterialNeedUpdate>();

  protected _color: Color | undefined = undefined;
  protected config: MaterialConfig;
  protected shaderSource: ShaderSource | undefined = undefined;

  constructor(config: MaterialConfig) {
    this.config = config;
    this.init();
  }

  init() {
    this.initColor();
  }

  abstract initShader(): void;

  initColor() {
    if (this.config.color instanceof Color) {
      this._color = this.config.color;
    } else {
      this._color = new Color(this.config.color);
    }
  }

  get color(): Color | undefined {
    return this._color;
  }

  set color(value: Color) {
    this._color = value;
  }

  /**
   * 确保已创建并与 `gl` 关联的 ShaderProgram（不切换当前 program）
   * @param gl
   * @returns
   */
  ensureShaderProgram(gl: WebGL2RenderingContext): ShaderProgram {
    if (!this._shaderProgram) {
      if (!this.shaderSource)
        throw new Error("Material: shader source is not set");
      this._shaderProgram = ShaderProgram.create(gl, this.shaderSource);
    }
    return this._shaderProgram;
  }

  /**
   * 与 Light/Camera 一致：仅当某 program 尚未登记时插入全量脏（切换回已登记 program 不重复打标）。
   */
  protected onProgramActivatedForUniforms(sp: ShaderProgram): void {
    if (this._shaderProgram !== sp) return;
    let nu = this.needUpdateMap.get(sp);
    if (!nu) {
      nu = { color: true };
      this.needUpdateMap.set(sp, nu);
    }
  }

  private ensureProgramActivatedSubscription(gl: WebGL2RenderingContext): void {
    if (this._offProgramActivated) return;
    this._offProgramActivated = ShaderProgram.onProgramActivated(gl, (p) =>
      this.onProgramActivatedForUniforms(p),
    );
  }

  /**
   * 附加材质相关状态到 WebGL 上下文
   * @param gl
   * @param skipUseProgram 是否跳过切换当前 program
   */
  attach(gl: WebGL2RenderingContext, skipUseProgram = false): void {
    // if (__LOG__) console.log(`[Material] attach`);
    const sp = this.ensureShaderProgram(gl);
    this.ensureProgramActivatedSubscription(gl);
    if (!skipUseProgram) sp.useProgram();
    // 多实例 Material 可共享同一 ShaderProgram：uniform 槽位在 GPU 上只有一份，
    // 每 draw 前必须写入本实例的值；不能仅靠「CPU 未变」跳过（上一 draw 可能已覆盖）。
    if (this._color) {
      const locColor = sp.getUniformLocation(U_Material.Color);
      if (locColor) {
        gl.uniform3fv(locColor, this._color.toArray());
        if (__LOG__) console.log(`[Material] gl.uniform3fv u_material.color`);
      }
    }
  }

  clearUniformNeedUpdate(): void {
    for (const nu of this.needUpdateMap.values()) {
      nu.color = false;
    }
  }

  get sp(): ShaderProgram | undefined {
    return this._shaderProgram ?? undefined;
  }
}
