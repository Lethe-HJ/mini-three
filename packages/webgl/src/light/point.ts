import { ShaderProgram } from "../common/program";
import { Color } from "../common/color/color";
import { Vector3 } from "../common/math/vector/vector3";
import { glsl } from "../common/shader/base";
import { UniformName } from "../utils/type/gl";
import { Light } from "./base";

type PointLightNeedUpdate = {
  position: boolean;
  color: boolean;
  intensity: boolean;
  attenuation: boolean;
};

export class PointLight extends Light {
  private _position: Vector3;

  private _color: Color;

  private _intensity: number;

  private _distance: number;

  private _decay: number;

  private _attenuation: [number, number, number];

  private readonly needUpdateMap = new Map<
    ShaderProgram,
    PointLightNeedUpdate
  >();

  private _orphanPositionDirty = true;
  private _orphanColorDirty = true;
  private _orphanIntensityDirty = true;
  private _orphanAttenuationDirty = true;

  private _offProgramActivated: (() => void) | undefined;

  constructor(
    color: string | number,
    intensity: number = 1,
    distance: number = 0,
    decay: number = 0,
  ) {
    super("PointLight");
    this._position = new Vector3();
    this._color = new Color(color);
    this._intensity = intensity;
    this._distance = distance;
    this._decay = decay;
    this._attenuation = [1, 0, 0]; // 默认为无衰减
  }

  get position(): Vector3 {
    return this._position;
  }

  set position(value: Vector3) {
    this._position = value;
    this.markPositionDirty();
  }

  get color(): Color {
    return this._color;
  }

  set color(value: Color) {
    this._color = value;
    this.markColorDirty();
  }

  get intensity(): number {
    return this._intensity;
  }

  set intensity(value: number) {
    this._intensity = value;
    this.markIntensityDirty();
  }

  get distance(): number {
    return this._distance;
  }

  set distance(value: number) {
    this._distance = value;
    this.markAttenuationDirty();
  }

  get decay(): number {
    return this._decay;
  }

  set decay(value: number) {
    this._decay = value;
    this.markAttenuationDirty();
  }

  setPosition(x: number, y: number, z: number): this {
    this._position.set(x, y, z);
    this.markPositionDirty();
    return this;
  }

  setColor(color: string | number): this {
    this._color = new Color(color);
    this.markColorDirty();
    return this;
  }

  setIntensity(intensity: number): this {
    this._intensity = intensity;
    this.markIntensityDirty();
    return this;
  }

  setDistance(distance: number): this {
    this._distance = distance;
    this.markAttenuationDirty();
    return this;
  }

  setDecay(decay: number): this {
    this._decay = decay;
    this.markAttenuationDirty();
    return this;
  }

  private markPositionDirty(): void {
    this._orphanPositionDirty = true;
    for (const nu of this.needUpdateMap.values()) {
      nu.position = true;
    }
  }

  private markColorDirty(): void {
    this._orphanColorDirty = true;
    for (const nu of this.needUpdateMap.values()) {
      nu.color = true;
    }
  }

  private markIntensityDirty(): void {
    this._orphanIntensityDirty = true;
    for (const nu of this.needUpdateMap.values()) {
      nu.intensity = true;
    }
  }

  private markAttenuationDirty(): void {
    this._orphanAttenuationDirty = true;
    for (const nu of this.needUpdateMap.values()) {
      nu.attenuation = true;
    }
  }

  private getNeedUpdateFor(sp: ShaderProgram): PointLightNeedUpdate {
    let nu = this.needUpdateMap.get(sp);
    if (!nu) {
      nu = {
        position: this._orphanPositionDirty,
        color: this._orphanColorDirty,
        intensity: this._orphanIntensityDirty,
        attenuation: this._orphanAttenuationDirty,
      };
      this.needUpdateMap.set(sp, nu);
      this._orphanPositionDirty = false;
      this._orphanColorDirty = false;
      this._orphanIntensityDirty = false;
      this._orphanAttenuationDirty = false;
    }
    return nu;
  }

  private ensureProgramActivatedSubscription(gl: WebGL2RenderingContext): void {
    if (this._offProgramActivated) return;
    this._offProgramActivated = ShaderProgram.onProgramActivated(
      gl,
      (sp: ShaderProgram) => {
        let nu = this.needUpdateMap.get(sp);
        if (!nu) {
          nu = {
            position: true,
            color: true,
            intensity: true,
            attenuation: true,
          };
          this.needUpdateMap.set(sp, nu);
        }
      },
    );
  }

  attach(
    gl: WebGL2RenderingContext,
    sp: ShaderProgram,
    skipUseProgram = false,
  ): void {
    this.ensureProgramActivatedSubscription(gl);
    if (!skipUseProgram) sp.useProgram();

    const nu = this.getNeedUpdateFor(sp);

    if (nu.position) {
      const locPos = sp.getUniformLocation(U_PointLight.Position);
      if (locPos) {
        gl.uniform3fv(locPos, this._position.toArray());
        nu.position = false;
        if (__LOG__)
          console.log(`[PointLight] gl.uniform3fv u_pointLight.position`);
      }
    }
    if (nu.color) {
      const locColor = sp.getUniformLocation(U_PointLight.Color);
      if (locColor) {
        gl.uniform3fv(locColor, this._color.toArray());
        nu.color = false;
        if (__LOG__)
          console.log(`[PointLight] gl.uniform3fv u_pointLight.color`);
      }
    }
    const needAtten = nu.attenuation || nu.intensity;
    if (needAtten) {
      const locConst = sp.getUniformLocation(U_PointLight.Constant);
      if (locConst) {
        gl.uniform1f(locConst, this._attenuation[0]);
        if (__LOG__)
          console.log(`[PointLight] gl.uniform1f u_pointLight.constant`);
      }
      const locLinear = sp.getUniformLocation(U_PointLight.Linear);
      if (locLinear) {
        gl.uniform1f(locLinear, this._attenuation[1]);
        if (__LOG__)
          console.log(`[PointLight] gl.uniform1f u_pointLight.linear`);
      }
      const locQuadratic = sp.getUniformLocation(U_PointLight.Quadratic);
      if (locQuadratic) {
        gl.uniform1f(locQuadratic, this._attenuation[2]);
        if (__LOG__)
          console.log(`[PointLight] gl.uniform1f u_pointLight.quadratic`);
      }
      const locIntensity = sp.getUniformLocation(U_PointLight.Intensity);
      if (locIntensity) {
        gl.uniform1f(locIntensity, this._intensity);
        nu.intensity = false;
        if (__LOG__)
          console.log(`[PointLight] gl.uniform1f u_pointLight.intensity`);
      }
      if (locConst && locLinear && locQuadratic) {
        nu.attenuation = false;
      }
    }
  }

  /**
   * NOTE override 表示覆盖父类里已有的同名方法 作用如下:
   * 1. 读代码更清楚 一眼能看出这不是新方法 而是重写基类的方法
   * 2. 编译期检查 避免基类的对应方法签名变动时 子类会报错
   */

  /**
   * 清空所有 uniform 的 dirty 标志
   */
  override clearUniformNeedUpdate(): void {
    for (const nu of this.needUpdateMap.values()) {
      nu.position = false;
      nu.color = false;
      nu.intensity = false;
      nu.attenuation = false;
    }
  }
}

/**
 *  NOTE 命名约定：
 * 1. _U_* 表示文件内部使用的 Uniform 变量名称
 * 2. _U__* 表示 Uniform 变量名称的子项
 * 3. U_* 表示对外暴露的 Uniform 变量名称
 */

/**
 * u_pointLight - 点光源结构体名称
 */
const _U_PointLight = "u_pointLight" as UniformName;

/**
 * position - 点光源位置
 */
const _U__Position = "position" as UniformName;
/**
 * color - 点光源颜色
 */
const _U__Color = "color" as UniformName;
/**
 * constant - 点光源常数项
 */
const _U__Constant = "constant" as UniformName;
/**
 * linear - 点光源线性项
 */
const _U__Linear = "linear" as UniformName;
/**
 * quadratic - 点光源二次项
 */
const _U__Quadratic = "quadratic" as UniformName;
/**
 * intensity - 点光源强度
 */
const _U__Intensity = "intensity" as UniformName;

/**
 * 点光源结构体子项枚举值
 */
export const U_PointLight = {
  /**
   * u_pointLight.position - 点光源位置
   */
  Position: `${_U_PointLight}.${_U__Position}` as UniformName,
  /**
   * u_pointLight.color - 点光源颜色
   */
  Color: `${_U_PointLight}.${_U__Color}` as UniformName,
  /**
   * u_pointLight.constant - 点光源常数项
   */
  Constant: `${_U_PointLight}.${_U__Constant}` as UniformName,
  /**
   * u_pointLight.linear - 点光源线性项
   */
  Linear: `${_U_PointLight}.${_U__Linear}` as UniformName,
  /**
   * u_pointLight.quadratic - 点光源二次项
   */
  Quadratic: `${_U_PointLight}.${_U__Quadratic}` as UniformName,
  /**
   * u_pointLight.intensity - 点光源强度
   */
  Intensity: `${_U_PointLight}.${_U__Intensity}` as UniformName,
} as const;

export type _U_PointLight = (typeof U_PointLight)[keyof typeof U_PointLight];

/**
 * 点光源结构体定义代码
 * 点光源结构体实例化代码
 * ```glsl
 *   struct PointLight {
 *     vec3 color;
 *     vec3 position;
 *     float constant;
 *     float linear;
 *     float quadratic;
 *     float intensity;
 *   };
 *   uniform PointLight u_pointLight;
 * ```
 */
export const pointLightDefineCodeSource = glsl`
  // 点光源结构体
  struct PointLight {
    vec3 ${_U__Color};
    vec3 ${_U__Position};
    float ${_U__Constant};
    float ${_U__Linear};
    float ${_U__Quadratic};
    float ${_U__Intensity};
  };
  uniform PointLight ${_U_PointLight};
`;
