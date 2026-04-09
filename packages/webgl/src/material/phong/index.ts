import { ShaderSource } from "../../common/shader";
import { Color } from "../../common/color/color";
import { ShaderProgram } from "../../common/program";
import { Material, MaterialConfig } from "../base";
import { phongShader, U_Material } from "./shader";

export interface MeshPhongMaterialConfig extends MaterialConfig {
  color: Color | number;
  specular?: Color | number;
  shininess?: number;
}

/** 与 Three.js MeshPhongMaterial 常见默认一致：未指定时使用灰色高光与中等 shininess */
const DEFAULT_SPECULAR = 0x111111;
const DEFAULT_SHININESS = 30;

type MeshPhongNeedUpdate = {
  shininess: boolean;
  specular: boolean;
};

export class MeshPhongMaterial extends Material {
  private _specular!: Color;

  private readonly phongNeedUpdateMap = new Map<
    ShaderProgram,
    MeshPhongNeedUpdate
  >();
  private _orphanShininessDirty = true;
  private _orphanSpecularDirty = true;

  constructor(config: MeshPhongMaterialConfig) {
    if (typeof config.specular === "number") {
      config.specular = Color.fromNumber(config.specular);
    }
    super(config);
  }

  get specular(): Color {
    return this._specular;
  }

  set specular(value: Color | undefined) {
    this._specular = value ?? Color.fromNumber(DEFAULT_SPECULAR);
    this.markSpecularDirty();
  }

  init() {
    this.initShader();
    this.initColor();
    this.initSpecular();
  }

  initShader() {
    this.shaderSource = ShaderSource.create(
      phongShader.vertex,
      phongShader.fragment,
    );
  }

  initSpecular() {
    const config = this.config;
    const spec = config.specular;
    if (spec instanceof Color) {
      this._specular = spec;
    } else if (spec != null) {
      this._specular = new Color(spec as string | number);
    } else {
      this._specular = Color.fromNumber(DEFAULT_SPECULAR);
    }
  }

  private markShininessDirty(): void {
    this._orphanShininessDirty = true;
    for (const nu of this.phongNeedUpdateMap.values()) {
      nu.shininess = true;
    }
  }

  private markSpecularDirty(): void {
    this._orphanSpecularDirty = true;
    for (const nu of this.phongNeedUpdateMap.values()) {
      nu.specular = true;
    }
  }

  private getPhongNeedUpdateFor(sp: ShaderProgram): MeshPhongNeedUpdate {
    let nu = this.phongNeedUpdateMap.get(sp);
    if (!nu) {
      nu = {
        shininess: this._orphanShininessDirty,
        specular: this._orphanSpecularDirty,
      };
      this.phongNeedUpdateMap.set(sp, nu);
      this._orphanShininessDirty = false;
      this._orphanSpecularDirty = false;
    }
    return nu;
  }

  protected onProgramActivatedForUniforms(sp: ShaderProgram): void {
    super.onProgramActivatedForUniforms(sp);
    if (this.sp !== sp) return;
    let nu = this.phongNeedUpdateMap.get(sp);
    if (!nu) {
      nu = { shininess: true, specular: true };
      this.phongNeedUpdateMap.set(sp, nu);
    }
  }

  attach(gl: WebGL2RenderingContext, skipUseProgram = false): void {
    if (this._specular === undefined) {
      this.initSpecular();
    }
    super.attach(gl, skipUseProgram);
    const sp = this.ensureShaderProgram(gl);
    const shininess = this.config.shininess ?? DEFAULT_SHININESS;
    const nu = this.getPhongNeedUpdateFor(sp);
    // 与基类 `u_material.color` 相同：共享 program 时须每 draw 上传，见 Material.attach
    {
      const locShininess = sp.getUniformLocation("u_material.shininess");
      if (locShininess) {
        gl.uniform1f(locShininess, shininess);
        nu.shininess = false;
        if (__LOG__)
          console.log(`[MeshPhongMaterial] gl.uniform1f u_material.shininess`);
      }
    }
    {
      const locSpecular = sp.getUniformLocation(U_Material.Specular);
      if (locSpecular) {
        const spec = this._specular ?? Color.fromNumber(DEFAULT_SPECULAR);
        gl.uniform3fv(locSpecular, spec.toArray());
        nu.specular = false;
        if (__LOG__)
          console.log(`[MeshPhongMaterial] gl.uniform3fv u_material.specular`);
      }
    }
  }

  override clearUniformNeedUpdate(): void {
    super.clearUniformNeedUpdate();
    for (const nu of this.phongNeedUpdateMap.values()) {
      nu.shininess = false;
      nu.specular = false;
    }
  }
}
