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

const collectMeshes = (obj: Mesh | Group, meshes: Mesh[]) => {
  if (obj.name === "Mesh") {
    meshes.push(obj as Mesh);
    (obj as Mesh).updateModelMatrix();
  } else if (obj.name === "Group") {
    (obj as Group).updateModelMatrix();
    for (let i = 0; i < (obj as Group).children.length; i++) {
      const child = (obj as Group).children[i];
      collectMeshes(child, meshes);
    }
  }
};

export class WebGLRenderer {
  private gl: WebGLRenderingContext;
  private pixelRatio: number = 1;
  frustumCulling: boolean;
  private frustum: Frustum = new Frustum();
  private renderRafId: number | null = null;
  private pendingScene: Scene | null = null;
  private pendingCamera: Camera | null = null;

  constructor(config: RendererConfig | WebGLRenderingContext) {
    let gl: WebGLRenderingContext | null = null;
    if (config instanceof WebGLRenderingContext) {
      gl = config;
      this.frustumCulling = true;
    } else {
      const canvas = config.canvas;
      if (!canvas) {
        throw new Error("Canvas is required");
      }
      gl = canvas.getContext("webgl");
      if (!gl) {
        throw new Error("WebGL not supported");
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
  render(scene: Scene, camera: Camera): void {
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
        this.renderImmediate(s, c);
      }
    });
  }

  @timed()
  private cullMeshesByFrustum(camera: Camera, meshes: Mesh[]): Mesh[] {
    this.frustum.setFromProjectionMatrix(camera.matrix.vp);
    for (let i = meshes.length - 1; i >= 0; i--) {
      const mesh = meshes[i];
      if (!this.frustum.intersectsSphere(mesh.getWorldBoundingSphere())) {
        meshes.splice(i, 1);
      }
    }
    return meshes;
  }

  @timed()
  private renderImmediate(scene: Scene, camera: Camera): void {
    const gl = this.gl;
    // 如果场景有背景色，使用场景的背景色
    if (scene.background) {
      const colorArray = scene.background.toArray();
      gl.clearColor(colorArray[0], colorArray[1], colorArray[2], 1);
    }
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // 动态收集所有 mesh
    const meshes: Mesh[] = [];

    for (let i = 0; i < scene.children.length; i++) {
      const object = scene.children[i];
      collectMeshes(object as Mesh | Group, meshes);
    }

    const visibleMeshes = this.frustumCulling ? this.cullMeshesByFrustum(camera, meshes) : meshes;

    // 按 ShaderProgram 分组排序，减少 gl.useProgram 切换
    const programOrder = new Map<ShaderProgram, number>();
    let orderNext = 0;
    const programKey = (sp: ShaderProgram) => {
      let k = programOrder.get(sp);
      if (k === undefined) {
        k = orderNext++;
        programOrder.set(sp, k);
      }
      return k;
    };
    visibleMeshes.sort(
      (a, b) =>
        programKey(a.material.ensureShaderProgram(gl)) -
        programKey(b.material.ensureShaderProgram(gl)),
    );

    let lastProgram: ShaderProgram | null = null;
    for (let i = 0; i < visibleMeshes.length; i++) {
      const mesh = visibleMeshes[i];
      const sp = mesh.material.ensureShaderProgram(gl);
      if (lastProgram !== sp) {
        sp.useProgram();
        lastProgram = sp;
      }
      mesh.attach(gl, true);
      mesh.updateMatrix(gl, camera);
      for (let j = 0; j < scene.objects.length; j++) {
        const obj = scene.objects[j];
        // scene.objects 里只有光源会 attach(gl, sp)；Mesh.attach 第二参为 boolean，需单独收窄
        if (obj.name === "AmbientLight" || obj.name === "PointLight") {
          obj.attach(gl, sp);
        }
      }
      camera.attach(gl, sp);
      const idx = mesh.geometry.indices;
      gl.drawElements(gl.TRIANGLES, idx.length, indexArrayToElementType(gl, idx), 0);
    }
  }
}
