import type { Camera } from "../camera/type";
import { Color } from "../common/color/color";
import type { Scene } from "../scene/type";
import type { RendererConfig } from "./type";
import type { Mesh } from "../mesh";
import { indexArrayToElementType } from "../geometry/base";
import type { Group } from "../group/type";
import type { ShaderProgram } from "../common/program";
import { Frustum } from "../utils/culling/frustum";
import { timed } from "../utils/decorators";

/** 仅收集 Mesh，不更新矩阵（矩阵由顶层 updateTopLevelModelMatrices 已算好） */
const collectMeshes = (obj: Mesh | Group, meshes: Mesh[]) => {
  if (obj.name === "Mesh") {
    meshes.push(obj as Mesh);
  } else if (obj.name === "Group") {
    const g = obj as Group;
    for (let i = 0; i < g.children.length; i++) {
      collectMeshes(g.children[i] as Mesh | Group, meshes);
    }
  }
};

/** 只对场景顶层子节点更新世界矩阵：Mesh 一次；Group 内部会递归子树 */
const updateTopLevelModelMatrices = (obj: Mesh | Group) => {
  if (obj.name === "Mesh") {
    (obj as Mesh).updateModelMatrix();
  } else if (obj.name === "Group") {
    (obj as Group).updateModelMatrix();
  }
};

export class WebGLRenderer {
  private gl: WebGL2RenderingContext;
  private pixelRatio: number = 1;
  frustumCulling: boolean;
  private frustum: Frustum = new Frustum();
  private renderRafId: number | null = null;
  private pendingScene: Scene | null = null;
  private pendingCamera: Camera | null = null;

  constructor(config: RendererConfig | WebGL2RenderingContext) {
    let gl: WebGL2RenderingContext | null = null;
    if (config instanceof WebGL2RenderingContext) {
      gl = config;
      this.frustumCulling = true;
    } else {
      const canvas = config.canvas;
      if (!canvas) {
        throw new Error("Canvas is required");
      }
      gl = canvas.getContext("webgl2", {
        antialias: config.antialias ?? true,
      });
      if (!gl) {
        throw new Error("WebGL2 not supported");
      }
      this.frustumCulling = config.frustumCulling ?? true;
    }
    this.gl = gl;
    this.gl.enable(gl.DEPTH_TEST);
    this.gl.clearColor(1, 1, 1, 1); // 与 Three.js scene.background 白色一致
  }

  setSize(width: number, height: number): void {
    this.gl.viewport(0, 0, width, height);
  }

  setPixelRatio(ratio: number): void {
    // 存储像素比
    this.pixelRatio = Math.max(1, ratio);

    // 尝试获取画布并更新其大小
    const canvas = this.gl.canvas as HTMLCanvasElement;
    if (canvas) {
      // 获取当前画布的CSS大小
      const cssWidth = canvas.clientWidth;
      const cssHeight = canvas.clientHeight;

      // 根据像素比更新画布的实际大小
      canvas.width = Math.floor(cssWidth * this.pixelRatio);
      canvas.height = Math.floor(cssHeight * this.pixelRatio);

      // 更新视口
      this.gl.viewport(0, 0, canvas.width, canvas.height);
    }
  }

  setClearColor(color: number): void {
    const _color = Color.fromNumber(color);
    const colorArray = _color.toNormalizedArray();
    this.gl.clearColor(colorArray[0], colorArray[1], colorArray[2], 1);
  }

  /**
   * 同一帧内多次调用会合并为一次实际绘制（通过 requestAnimationFrame 节流）。
   */
  scheduleRender(scene: Scene, camera: Camera): void {
    this.pendingScene = scene;
    this.pendingCamera = camera;
    if (this.renderRafId !== null) {
      return;
    }
    this.renderRafId = requestAnimationFrame(() => {
      this.renderRafId = null;
      const s = this.pendingScene;
      const c = this.pendingCamera;
      this.pendingScene = null;
      this.pendingCamera = null;
      if (s && c) {
        this.render(s, c);
      }
    });
  }

  // @timed()
  private cullMeshesByFrustum(camera: Camera, meshes: Mesh[]): Mesh[] {
    this.frustum.setFromProjectionMatrix(camera.matrix.vp);
    const output: Mesh[] = [];
    for (let i = 0; i < meshes.length; i++) {
      const mesh = meshes[i];
      if (this.frustum.intersectsSphere(mesh.getWorldBoundingSphere())) {
        output.push(mesh);
      }
    }
    return output;
  }

  // @timed()
  render(scene: Scene, camera: Camera): void {
    const gl = this.gl;
    if (scene.background) {
      const bg = scene.background;
      gl.clearColor(bg.r, bg.g, bg.b, 1);
    }
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const meshes: Mesh[] = [];
    for (let i = 0; i < scene.children.length; i++) {
      const object = scene.children[i] as Mesh | Group;
      // 更新顶级节点的模型矩阵
      updateTopLevelModelMatrices(object);
      // 收集所有Mesh 只收集叶子节点
      collectMeshes(scene.children[i] as Mesh | Group, meshes);
    }

    // 剔除视锥体外的Mesh
    const visibleMeshes = this.frustumCulling ? this.cullMeshesByFrustum(camera, meshes) : meshes;

    // 按 ShaderProgram 分组 后续同一组内的连续渲染, 这样可以节省program切换的开销
    const groupByProgram = new Map<ShaderProgram, Mesh[]>();
    for (let i = 0; i < visibleMeshes.length; i++) {
      const mesh = visibleMeshes[i];
      const sp = mesh.material.ensureShaderProgram(gl);
      let batch = groupByProgram.get(sp);
      if (!batch) {
        batch = [];
        groupByProgram.set(sp, batch);
      }
      batch.push(mesh);
    }

    // 遍历 program 分组 并进行渲染
    for (const [sp, batch] of groupByProgram) {
      sp.useProgram();
      for (let j = 0; j < scene.objects.length; j++) {
        const obj = scene.objects[j];
        if (obj.name === "AmbientLight" || obj.name === "PointLight") {
          obj.attach(gl, sp);
        }
      }
      camera.attach(gl, sp, true);
      for (let i = 0; i < batch.length; i++) {
        const mesh = batch[i];
        mesh.attach(gl, true);
        mesh.updateMatrix(gl, camera);
        const idx = mesh.geometry.indices;
        gl.drawElements(gl.TRIANGLES, idx.length, indexArrayToElementType(gl, idx), 0);
      }
    }
  }
}
