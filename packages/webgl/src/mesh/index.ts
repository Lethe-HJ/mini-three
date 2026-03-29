import { m4, type Mat4 } from "../common/math/matrix/matrix4";
import { BaseObject } from "../common/object/base";
import type { Geometry } from "../geometry/base";
import type { Material } from "../material/base";
import type { Group } from "../group/type";
import type { Camera } from "../camera/type";
import { ObjectType } from "../common/object/type";
import type { BoundingSphere } from "../utils/culling/frustum";
import { MeshMatrixSet } from "./type";

export class Mesh extends BaseObject {
  name: typeof ObjectType.Mesh;
  geometry: Geometry;
  material: Material;
  parent: Group | null;
  matrixes: MeshMatrixSet;
  /** `uniformMatrix4fv` 上传用，避免每帧 `new Float32Array(16)` */
  private readonly matrixUploadModel = new Float32Array(16);
  private readonly matrixUploadMvp = new Float32Array(16);
  private readonly matrixUploadNormal = new Float32Array(16);
  /** 与 `worldBoundingSphereCache` 对应的 model 矩阵快照（`multiply` 每帧新数组，故用数值比较） */
  private readonly worldBoundingSphereModelSnapshot = new Float32Array(16);
  /** local 包围球 center xyz + radius，与 geometry 缓存一并比对 */
  private readonly worldBoundingSphereLocalSnapshot = new Float32Array(4);
  private worldBoundingSphereCache: BoundingSphere | null = null;
  /** 上一帧 `updateMatrix` 结束时的 model / vp，用于跳过未变时的 multiply / inverse */
  private readonly lastUpdateMatrixModel = new Float32Array(16);
  private readonly lastUpdateMatrixVp = new Float32Array(16);
  private lastUpdateMatrixSnapshotValid = false;
  /** 与 `updateModelMatrix` 中 TRS 快照比对，未变则跳过 local 矩阵重建 */
  private readonly lastModelTransform = {
    px: Number.NaN,
    py: Number.NaN,
    pz: Number.NaN,
    rx: Number.NaN,
    ry: Number.NaN,
    rz: Number.NaN,
    sx: Number.NaN,
    sy: Number.NaN,
    sz: Number.NaN,
  };
  private readonly lastParentWorldModel = new Float32Array(16);
  private lastParentWorldPresent = false;

  constructor(geometry: Geometry, material: Material) {
    super(ObjectType.Mesh);
    this.name = ObjectType.Mesh;
    this.geometry = geometry;
    this.material = material;
    this.parent = null;
    this.matrixes = {
      mvp: { value: null, location: null },
      model: { value: null, location: null },
      normal: { value: null, location: null },
      rotation: m4.identity(),
      translate: m4.identity(),
      scale: m4.identity(),
      localModel: m4.identity(),
    };
  }

  attach(gl: WebGL2RenderingContext, skipUseProgram = false): void {
    this.material.attach(gl, skipUseProgram);
    const sp = this.material.sp;
    if (!sp) throw new Error("Mesh: shader program is null");
    if (!skipUseProgram) sp.useProgram();
    this.matrixes.mvp.location = sp.getUniformLocation("u_mvpMatrix");
    this.matrixes.model.location = sp.getUniformLocation("u_modelMatrix");
    this.matrixes.normal.location = sp.getUniformLocation("u_normalMatrix");
    this.geometry.attach(gl, sp);
  }

  private modelMatchesWorldSphereCache(model: Mat4, local: BoundingSphere): boolean {
    if (!this.worldBoundingSphereCache) return false;
    const ls = this.worldBoundingSphereLocalSnapshot;
    if (
      local.center[0] !== ls[0] ||
      local.center[1] !== ls[1] ||
      local.center[2] !== ls[2] ||
      local.radius !== ls[3]
    ) {
      return false;
    }
    const s = this.worldBoundingSphereModelSnapshot;
    for (let i = 0; i < 16; i++) {
      if (model[i] !== s[i]) return false;
    }
    return true;
  }

  private saveWorldSphereCacheKeys(model: Mat4, local: BoundingSphere): void {
    const ls = this.worldBoundingSphereLocalSnapshot;
    ls[0] = local.center[0];
    ls[1] = local.center[1];
    ls[2] = local.center[2];
    ls[3] = local.radius;
    const s = this.worldBoundingSphereModelSnapshot;
    for (let i = 0; i < 16; i++) {
      s[i] = model[i];
    }
  }

  private trsMatchesSnapshot(): boolean {
    const t = this.lastModelTransform;
    const p = this.position;
    const r = this.rotation;
    const s = this.scale;
    return (
      p.x === t.px &&
      p.y === t.py &&
      p.z === t.pz &&
      r.x === t.rx &&
      r.y === t.ry &&
      r.z === t.rz &&
      s.x === t.sx &&
      s.y === t.sy &&
      s.z === t.sz
    );
  }

  private saveTrsSnapshot(): void {
    const t = this.lastModelTransform;
    const p = this.position;
    const r = this.rotation;
    const s = this.scale;
    t.px = p.x;
    t.py = p.y;
    t.pz = p.z;
    t.rx = r.x;
    t.ry = r.y;
    t.rz = r.z;
    t.sx = s.x;
    t.sy = s.y;
    t.sz = s.z;
  }

  private parentWorldMatches(m: Mat4): boolean {
    const s = this.lastParentWorldModel;
    for (let i = 0; i < 16; i++) {
      if (m[i] !== s[i]) return false;
    }
    return true;
  }

  private saveParentWorldSnapshot(m: Mat4): void {
    for (let i = 0; i < 16; i++) {
      this.lastParentWorldModel[i] = m[i];
    }
  }

  updateModelMatrix(): void {
    const parentModel = this.parent ? this.parent.matrixes.model : null;
    const hasParent = parentModel !== null;

    const trsUnchanged = this.trsMatchesSnapshot();
    const parentUnchanged =
      hasParent === this.lastParentWorldPresent &&
      (!hasParent || this.parentWorldMatches(parentModel!));

    if (trsUnchanged && parentUnchanged) {
      return;
    }

    if (!trsUnchanged) {
      this.matrixes.translate = m4.translation(this.position.x, this.position.y, this.position.z);
      this.matrixes.rotation = m4.multiplySeries(
        m4.identity(),
        m4.xRotation(this.rotation.x),
        m4.yRotation(this.rotation.y),
        m4.zRotation(this.rotation.z),
      );
      this.matrixes.scale = m4.scaling(this.scale.x, this.scale.y, this.scale.z);
      this.matrixes.localModel = m4.multiplySeries(
        this.matrixes.translate,
        this.matrixes.rotation,
        this.matrixes.scale,
      );
      this.saveTrsSnapshot();
    }

    if (!trsUnchanged || !parentUnchanged) {
      this.matrixes.model.value = parentModel
        ? m4.multiply(parentModel, this.matrixes.localModel)
        : this.matrixes.localModel;
    }

    this.lastParentWorldPresent = hasParent;
    if (hasParent && parentModel) {
      this.saveParentWorldSnapshot(parentModel);
    }
  }

  private mat4EqualsSnapshot(m: Mat4, snap: Float32Array): boolean {
    for (let i = 0; i < 16; i++) {
      if (m[i] !== snap[i]) return false;
    }
    return true;
  }

  private saveUpdateMatrixSnapshot(model: Mat4, vp: Mat4): void {
    for (let i = 0; i < 16; i++) {
      this.lastUpdateMatrixModel[i] = model[i];
      this.lastUpdateMatrixVp[i] = vp[i];
    }
    this.lastUpdateMatrixSnapshotValid = true;
  }

  updateMatrix(gl: WebGL2RenderingContext, camera: Camera): void {
    const modelMatrix = this.matrixes.model.value!;
    const vp = camera.matrix.vp;
    let mvpMatrix: Mat4;
    let normalMatrix: Mat4;
    const unchanged =
      this.lastUpdateMatrixSnapshotValid &&
      this.mat4EqualsSnapshot(modelMatrix, this.lastUpdateMatrixModel) &&
      this.mat4EqualsSnapshot(vp, this.lastUpdateMatrixVp);
    if (!unchanged) {
      mvpMatrix = m4.multiply(vp, modelMatrix);
      this.matrixes.mvp.value = mvpMatrix;
      normalMatrix = m4.transpose(m4.inverse(modelMatrix));
      this.matrixes.normal.value = normalMatrix;
      this.saveUpdateMatrixSnapshot(modelMatrix, vp);
    } else {
      mvpMatrix = this.matrixes.mvp.value!;
      normalMatrix = this.matrixes.normal.value!;
    }
    if (this.matrixes.model.location) {
      this.matrixUploadModel.set(modelMatrix);
      gl.uniformMatrix4fv(this.matrixes.model.location, false, this.matrixUploadModel);
    }
    if (this.matrixes.mvp.location) {
      this.matrixUploadMvp.set(mvpMatrix);
      gl.uniformMatrix4fv(this.matrixes.mvp.location, false, this.matrixUploadMvp);
    }
    if (this.matrixes.normal.location) {
      this.matrixUploadNormal.set(normalMatrix);
      gl.uniformMatrix4fv(this.matrixes.normal.location, false, this.matrixUploadNormal);
    }
  }

  getWorldBoundingSphere(): BoundingSphere {
    const model = this.matrixes.model.value ?? m4.identity();
    const localSphere = this.geometry.getBoundingSphere();
    if (this.modelMatchesWorldSphereCache(model, localSphere)) {
      return this.worldBoundingSphereCache!;
    }

    const [x, y, z] = localSphere.center;
    const sx = Math.hypot(model[0], model[1], model[2]);
    const sy = Math.hypot(model[4], model[5], model[6]);
    const sz = Math.hypot(model[8], model[9], model[10]);
    const scale = Math.max(sx, sy, sz);

    let out = this.worldBoundingSphereCache;
    if (!out) {
      out = {
        center: [0, 0, 0],
        radius: 0,
      };
      this.worldBoundingSphereCache = out;
    }
    out.center[0] = x * model[0] + y * model[4] + z * model[8] + model[12];
    out.center[1] = x * model[1] + y * model[5] + z * model[9] + model[13];
    out.center[2] = x * model[2] + y * model[6] + z * model[10] + model[14];
    out.radius = localSphere.radius * scale;
    this.saveWorldSphereCacheKeys(model, localSphere);
    return out;
  }

  setRotation(xDeg: number, yDeg: number, zDeg: number): this {
    this.rotation.set(xDeg, yDeg, zDeg);
    return this;
  }

  setPosition(x: number, y: number, z: number): this {
    this.position.set(x, y, z);
    return this;
  }

  setScale(x: number, y: number, z: number): this {
    this.scale.set(x, y, z);
    return this;
  }
}

export { type MeshMatrixSet } from "./type";
